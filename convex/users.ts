import { mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import { getCurrentUser, verifyWorkspace } from './utils';

const PROFILE_TOO_LARGE_MESSAGE =
  'Your profile could not be saved because it is too large. If you added a profile photo, please choose a smaller image and try again.';

/**
 * Upsert the authenticated user's profile in the app users table.
 * Called by the frontend after a successful Better Auth sign-in/sign-up
 * when a workspaceId has been established (i.e., after onboarding).
 */
export const store = mutation({
  args: {
    workspaceId: v.id('workspaces'),
  },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', identity.tokenIdentifier))
      .unique();

    if (user !== null) {
      // Update profile fields that may have changed
      await ctx.db.patch(user._id, {
        name: identity.name ?? user.name,
        avatarUrl: identity.pictureUrl ?? user.avatarUrl,
      });
      return user._id;
    }

    // First sign-in: create the user profile
    return await ctx.db.insert('users', {
      workspaceId,
      betterAuthId: identity.tokenIdentifier,
      name: identity.name ?? 'Unknown User',
      email: identity.email ?? '',
      role: 'owner',
      notificationsEnabled: true,
      createdAt: Date.now(),
      avatarUrl: identity.pictureUrl,
      timezone: 'Asia/Bangkok',
      language: 'en',
      currency: 'THB',
      dateFormat: 'DD/MM/YYYY',
    });
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

    const users = await ctx.db
      .query('users')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    return users
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }));
  },
});
