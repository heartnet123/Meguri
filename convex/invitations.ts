import { query, mutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { verifyWorkspace, checkRole, getCurrentUser } from './utils';

/**
 * Generate a URL-safe random token for invitation links.
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List all invitations for a workspace (owner/admin only).
 */
export const listByWorkspace = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    const user = await verifyWorkspace(ctx, workspaceId);
    checkRole(user, ['owner', 'admin']);

    const invitations = await ctx.db
      .query('invitations')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .order('desc')
      .collect();

    // Enrich with inviter name
    return Promise.all(
      invitations.map(async (inv) => {
        const inviter = await ctx.db.get(inv.invitedBy);
        return {
          ...inv,
          inviterName: inviter?.name ?? 'Unknown',
          inviterEmail: inviter?.email ?? '',
          isExpired: inv.expiresAt < Date.now(),
        };
      }),
    );
  },
});

/**
 * Get a pending invitation by its token (public-facing for the join page).
 * Returns null if the token is invalid, cancelled, or expired.
 */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const inv = await ctx.db
      .query('invitations')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique();

    if (!inv) return null;
    if (inv.status !== 'pending') return null;
    if (inv.expiresAt < Date.now()) return null;

    const workspace = await ctx.db.get(inv.workspaceId);
    const inviter = await ctx.db.get(inv.invitedBy);

    return {
      _id: inv._id,
      email: inv.email,
      role: inv.role,
      workspaceName: workspace?.name ?? 'Unknown',
      workspaceSlug: workspace?.slug ?? '',
      inviterName: inviter?.name ?? 'Unknown',
      inviterEmail: inviter?.email ?? '',
      expiresAt: inv.expiresAt,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create and send an invitation (owner/admin only).
 */
export const create = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    email: v.string(),
    role: v.union(
      v.literal('admin'),
      v.literal('manager'),
      v.literal('staff'),
    ),
  },
  handler: async (ctx, args) => {
    const user = await verifyWorkspace(ctx, args.workspaceId);
    checkRole(user, ['owner', 'admin']);

    // Check if email is already a member of this workspace
    const existingMember = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .collect();

    const alreadyMember = existingMember.find(
      (u) => u.workspaceId === args.workspaceId,
    );
    if (alreadyMember) {
      throw new ConvexError('This person is already a member of the workspace.');
    }

    // Check if there's already a pending invitation for this email
    const existing = await ctx.db
      .query('invitations')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .collect();

    const pendingForWorkspace = existing.find(
      (inv) =>
        inv.workspaceId === args.workspaceId &&
        inv.status === 'pending' &&
        inv.expiresAt > Date.now(),
    );
    if (pendingForWorkspace) {
      throw new ConvexError('A pending invitation already exists for this email.');
    }

    const now = Date.now();
    const token = generateToken();

    return ctx.db.insert('invitations', {
      workspaceId: args.workspaceId,
      email: args.email,
      role: args.role,
      token,
      status: 'pending',
      invitedBy: user._id,
      createdAt: now,
      expiresAt: now + INVITE_EXPIRY_MS,
    });
  },
});

/**
 * Accept an invitation and join the workspace.
 * The user must already be authenticated (signed up).
 */
export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('You must be signed in to accept an invitation.');

    const inv = await ctx.db
      .query('invitations')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique();

    if (!inv) throw new ConvexError('Invitation not found.');
    if (inv.status !== 'pending') throw new ConvexError('This invitation has already been used or cancelled.');
    if (inv.expiresAt < Date.now()) throw new ConvexError('This invitation has expired.');

    // Find or create user profile
    let user = await ctx.db
      .query('users')
      .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', identity.tokenIdentifier))
      .unique();

    if (user) {
      // User exists — link to the new workspace
      if (user.workspaceId === inv.workspaceId) {
        throw new ConvexError('You are already a member of this workspace.');
      }
      await ctx.db.patch(user._id, {
        workspaceId: inv.workspaceId,
        role: inv.role,
      });
    } else {
      // New user — create profile and link to workspace
      await ctx.db.insert('users', {
        workspaceId: inv.workspaceId,
        betterAuthId: identity.tokenIdentifier,
        name: identity.name ?? 'Team Member',
        email: identity.email ?? inv.email,
        role: inv.role,
        avatarUrl: identity.pictureUrl,
        notificationsEnabled: true,
        createdAt: Date.now(),
      });
    }

    // Mark invitation as accepted
    await ctx.db.patch(inv._id, { status: 'accepted' });

    return inv.workspaceId;
  },
});

/**
 * Cancel a pending invitation (owner/admin only).
 */
export const cancel = mutation({
  args: {
    invitationId: v.id('invitations'),
  },
  handler: async (ctx, { invitationId }) => {
    const inv = await ctx.db.get(invitationId);
    if (!inv) throw new ConvexError('Invitation not found.');

    const user = await verifyWorkspace(ctx, inv.workspaceId);
    checkRole(user, ['owner', 'admin']);

    if (inv.status !== 'pending') {
      throw new ConvexError('Only pending invitations can be cancelled.');
    }

    await ctx.db.patch(invitationId, { status: 'cancelled' });
  },
});
