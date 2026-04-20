import { mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import { ensureCurrentUser, getCurrentUser, verifyWorkspace } from './utils';

const PROFILE_TOO_LARGE_MESSAGE =
  'ไม่สามารถบันทึกโปรไฟล์ได้เนื่องจากข้อมูลมีขนาดใหญ่เกินไป หากคุณอัปโหลดรูปโปรไฟล์ กรุณาเลือกรูปที่มีขนาดเล็กลงแล้วลองอีกครั้ง';

/**
 * Upsert the authenticated user's profile in the app users table.
 * Called by the frontend after a successful Better Auth sign-in/sign-up.
 * Users can exist without a workspace until they create or join one.
 */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ensureCurrentUser(ctx);
    return user._id;
  },
});

/**
 * Returns the currently authenticated user's app profile.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    currency: v.optional(v.string()),
    dateFormat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Unauthenticated');
    }

    try {
      await ctx.db.patch(user._id, {
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl,
        phone: args.phone,
        jobTitle: args.jobTitle,
        department: args.department,
        timezone: args.timezone,
        language: args.language,
        currency: args.currency,
        dateFormat: args.dateFormat,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      if (message.includes('Value is too large')) {
        throw new ConvexError(PROFILE_TOO_LARGE_MESSAGE);
      }

      throw error;
    }

    return user._id;
  },
});

export const listByWorkspace = query({
  args: {
    workspaceId: v.id('workspaces'),
  },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    // Get memberships for this workspace
    const memberships = await ctx.db
      .query('workspaceMemberships')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    // Fetch user details for each membership
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        return {
          _id: membership.userId,
          name: user?.name ?? 'Unknown',
          email: user?.email ?? '',
          role: membership.role,
        };
      })
    );

    return members.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get user's onboarding state: 'no_workspace', 'invited', or 'active'
 * - no_workspace: User has no workspace memberships and no pending invites
 * - invited: User has pending invitations waiting
 * - active: User has at least one workspace membership
 */
export const getOnboardingState = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { state: 'no_workspace' as const };

    // Check for workspace memberships
    const memberships = await ctx.db
      .query('workspaceMemberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    if (memberships.length > 0) {
      // User is already active in at least one workspace
      return { state: 'active' as const };
    }

    // Check for pending invitations
    const pendingInvites = await ctx.db
      .query('invitations')
      .withIndex('by_email', (q) => q.eq('email', user.email.toLowerCase()))
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'pending'),
          q.gt(q.field('expiresAt'), Date.now())
        )
      )
      .collect();

    if (pendingInvites.length > 0) {
      return { state: 'invited' as const, invitationCount: pendingInvites.length };
    }

    return { state: 'no_workspace' as const };
  },
});
