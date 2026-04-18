import { mutation, query, MutationCtx } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { getCurrentUser } from './utils';

/**
 * Create a new workspace and the owner user profile in one transaction.
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', identity.tokenIdentifier))
      .unique();

    if (existingUser?.workspaceId) {
      throw new Error('You already belong to a workspace. You cannot create another one from onboarding.');
    }

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

    if (existingUser) {
      await ctx.db.patch(existingUser._id, { workspaceId, role: 'owner' });
      await upsertMembership(ctx, workspaceId, existingUser._id, 'owner');
    } else {
      const userId = await ctx.db.insert('users', {
        workspaceId,
        betterAuthId: identity.tokenIdentifier,
        name: identity.name ?? 'Owner',
        email: identity.email ?? '',
        role: 'owner',
        avatarUrl: identity.pictureUrl,
        notificationsEnabled: true,
        createdAt: Date.now(),
      });
      await upsertMembership(ctx, workspaceId, userId, 'owner');
    }

    return workspaceId;
  },
});

async function upsertMembership(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  userId: Id<'users'>,
  role: 'owner' | 'admin' | 'manager' | 'staff'
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
 * Returns the workspace the authenticated user belongs to.
 */
export const myWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user?.workspaceId) return null;
    return ctx.db.get(user.workspaceId);
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

export const switchWorkspace = mutation({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError('Unauthenticated');

    const membership = await ctx.db
      .query('workspaceMemberships')
      .withIndex('by_user_workspace', (q) => q.eq('userId', user._id).eq('workspaceId', workspaceId))
      .unique();

    if (!membership) {
      throw new ConvexError('You do not have access to this workspace.');
    }

    await ctx.db.patch(user._id, { workspaceId });
    return workspaceId;
  },
});
