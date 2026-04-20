import { mutation, query, MutationCtx } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { ensureCurrentUser, getCurrentUser, getMembership, verifyWorkspace, checkRole } from './utils';

/**
 * Create a new workspace and add the user as owner.
 * Called from the onboarding flow after a user signs up.
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    currency: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ensureCurrentUser(ctx);

    const existing = await ctx.db
      .query('workspaces')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (existing) throw new Error('Workspace slug is already taken. Please choose another.');

    const workspaceId = await ctx.db.insert('workspaces', {
      name: args.name,
      slug: args.slug,
      currency: args.currency,
      timezone: args.timezone,
      plan: 'free',
      createdAt: Date.now(),
    });

    // Create owner membership
    await ctx.db.insert('workspaceMemberships', {
      workspaceId,
      userId: user._id,
      role: 'owner',
      joinedAt: Date.now(),
    });

    return workspaceId;
  },
});

async function upsertMembership(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  userId: Id<'users'>,
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer'
) {
  const existing = await ctx.db
    .query('workspaceMemberships')
    .withIndex('by_user_workspace', (q) => q.eq('userId', userId).eq('workspaceId', workspaceId))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { role });
    return existing._id;
  }

  return ctx.db.insert('workspaceMemberships', {
    workspaceId,
    userId,
    role,
    joinedAt: Date.now(),
  });
}

/**
 * Returns the first workspace the authenticated user belongs to.
 * Use this for default workspace selection or when user has no specific preference.
 */
export const myWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    // Get first membership (most recently joined)
    const membership = await ctx.db
      .query('workspaceMemberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .first();

    if (!membership) return null;
    return ctx.db.get(membership.workspaceId);
  },
});

export const myWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const memberships: Doc<'workspaceMemberships'>[] = [];
    for await (const membership of ctx.db
      .query('workspaceMemberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))) {
      memberships.push(membership);
    }

    const workspaces = await Promise.all(memberships.map((m) => ctx.db.get(m.workspaceId)));
    const availableWorkspaces = [];
    for (const workspace of workspaces) {
      if (workspace !== null) {
        availableWorkspaces.push({
        _id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
        currency: workspace.currency,
        timezone: workspace.timezone,
        plan: workspace.plan,
        role: memberships.find((m) => m.workspaceId === workspace._id)?.role ?? 'staff',
        });
      }
    }

    return availableWorkspaces;
  },
});

/**
 * Verify user has access to workspace and return role.
 * The UI tracks "current" workspace in local state; this just validates access.
 */
export const switchWorkspace = mutation({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError('Unauthenticated');

    const membership = await getMembership(ctx, user._id, workspaceId);
    if (!membership) {
      throw new ConvexError('You do not have access to this workspace.');
    }

    return { workspaceId, role: membership.role };
  },
});

/**
 * Remove a member from the workspace.
 * - Owner/admin only; cannot remove the workspace owner.
 */
export const removeMember = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
  },
  handler: async (ctx, { workspaceId, userId }) => {
    const { user, membership } = await verifyWorkspace(ctx, workspaceId);
    checkRole(membership, ['owner', 'admin']);

    // Prevent removing yourself as owner
    if (user._id === userId && membership.role === 'owner') {
      throw new ConvexError('ไม่สามารถลบเจ้าของเวิร์กสเปซออกจากเวิร์กสเปซได้');
    }

    const targetMembership = await getMembership(ctx, userId, workspaceId);
    if (!targetMembership) {
      throw new ConvexError('ไม่พบสมาชิกในเวิร์กสเปซนี้');
    }

    // Admins cannot remove the owner or other admins
    if (membership.role === 'admin' && (targetMembership.role === 'owner' || targetMembership.role === 'admin')) {
      throw new ConvexError('ผู้ดูแลระบบไม่สามารถลบเจ้าของหรือผู้ดูแลระบบคนอื่นออกได้');
    }

    await ctx.db.delete(targetMembership._id);
  },
});

/**
 * Change a member's role in the workspace.
 * - Owner/admin only; cannot reassign the owner role.
 */
export const changeMemberRole = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
    newRole: v.union(
      v.literal('admin'),
      v.literal('manager'),
      v.literal('staff'),
      v.literal('viewer'),
    ),
  },
  handler: async (ctx, { workspaceId, userId, newRole }) => {
    const { membership } = await verifyWorkspace(ctx, workspaceId);
    checkRole(membership, ['owner', 'admin']);

    const targetMembership = await getMembership(ctx, userId, workspaceId);
    if (!targetMembership) {
      throw new ConvexError('ไม่พบสมาชิกในเวิร์กสเปซนี้');
    }

    // Cannot change the owner's role
    if (targetMembership.role === 'owner') {
      throw new ConvexError('ไม่สามารถเปลี่ยนบทบาทของเจ้าของเวิร์กสเปซได้');
    }

    // Admins cannot elevate others to owner, or change other admins
    if (membership.role === 'admin' && targetMembership.role === 'admin') {
      throw new ConvexError('ผู้ดูแลระบบไม่สามารถเปลี่ยนบทบาทของผู้ดูแลระบบคนอื่นได้');
    }

    await ctx.db.patch(targetMembership._id, { role: newRole });
  },
});
