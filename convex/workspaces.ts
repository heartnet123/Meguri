import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

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

    // Enforce slug uniqueness
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

    // Check if a user profile already exists (from a previous partial sign-up)
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', identity.subject))
      .unique();

    if (existingUser) {
      // Link existing user to the new workspace
      await ctx.db.patch(existingUser._id, { workspaceId });
    } else {
      // Create a new user profile as workspace owner
      await ctx.db.insert('users', {
        workspaceId,
        betterAuthId: identity.subject,
        name: identity.name ?? 'Owner',
        email: identity.email ?? '',
        role: 'owner',
        avatarUrl: identity.pictureUrl,
        notificationsEnabled: true,
        createdAt: Date.now(),
      });
    }

    return workspaceId;
  },
});

/**
 * Returns the workspace the authenticated user belongs to.
 */
export const myWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', identity.subject))
      .unique();

    if (!user?.workspaceId) return null;

    return ctx.db.get(user.workspaceId);
  },
});
