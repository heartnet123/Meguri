import { query, mutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { verifyWorkspace, checkRole, getCurrentUser, getMembership, ensureCurrentUser } from './utils';

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
    const { membership } = await verifyWorkspace(ctx, workspaceId);
    checkRole(membership, ['owner', 'admin']);

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
      v.literal('viewer'),
    ),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await verifyWorkspace(ctx, args.workspaceId);
    checkRole(membership, ['owner', 'admin']);

    // Normalize email for case-insensitive comparison
    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if user with this email already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .unique();

    // If user exists, check if they're already a member
    if (existingUser) {
      const existingMembership = await getMembership(ctx, existingUser._id, args.workspaceId);
      if (existingMembership) {
        throw new ConvexError('This person is already a member of the workspace.');
      }
    }

    // Check if there's already a pending invitation for this email
    const existingInvites = await ctx.db
      .query('invitations')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .collect();

    const pendingForWorkspace = existingInvites.find(
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
      email: normalizedEmail,
      invitedUserId: existingUser?._id,
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
 * The user must already be authenticated (signed up) and have a profile.
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

    const user = await ensureCurrentUser(ctx);

    // Check if already a member
    const existingMembership = await getMembership(ctx, user._id, inv.workspaceId);
    if (existingMembership) {
      // Already a member - mark invite as accepted and return workspace
      await ctx.db.patch(inv._id, { status: 'accepted', invitedUserId: user._id });
      return inv.workspaceId;
    }

    // Create membership for the invited user
    await ctx.db.insert('workspaceMemberships', {
      workspaceId: inv.workspaceId,
      userId: user._id,
      role: inv.role,
      joinedAt: Date.now(),
    });

    // Update invitation with user reference and mark as accepted
    await ctx.db.patch(inv._id, { status: 'accepted', invitedUserId: user._id });

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

    const { membership } = await verifyWorkspace(ctx, inv.workspaceId);
    checkRole(membership, ['owner', 'admin']);

    if (inv.status !== 'pending') {
      throw new ConvexError('Only pending invitations can be cancelled.');
    }

    await ctx.db.patch(invitationId, { status: 'cancelled' });
  },
});

/**
 * Get pending invitations for the current user.
 */
export const getPendingForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Find invitations by user ID or email
    const byUserId = await ctx.db
      .query('invitations')
      .withIndex('by_invited_user', (q) => q.eq('invitedUserId', user._id))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect();

    const byEmail = await ctx.db
      .query('invitations')
      .withIndex('by_email', (q) => q.eq('email', user.email.toLowerCase()))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect();

    // Combine and deduplicate
    const allInvitations = [...byUserId, ...byEmail];
    const uniqueInvitations = allInvitations.filter(
      (inv, index, self) => index === self.findIndex((i) => i._id === inv._id)
    );

    // Filter out expired
    const now = Date.now();
    const validInvitations = uniqueInvitations.filter((inv) => inv.expiresAt > now);

    // Enrich with workspace and inviter details
    return Promise.all(
      validInvitations.map(async (inv) => {
        const workspace = await ctx.db.get(inv.workspaceId);
        const inviter = await ctx.db.get(inv.invitedBy);
        return {
          _id: inv._id,
          workspaceId: inv.workspaceId,
          workspaceName: workspace?.name ?? 'Unknown',
          workspaceSlug: workspace?.slug ?? '',
          role: inv.role,
          token: inv.token,
          inviterName: inviter?.name ?? 'Unknown',
          inviterEmail: inviter?.email ?? '',
          expiresAt: inv.expiresAt,
        };
      })
    );
  },
});
