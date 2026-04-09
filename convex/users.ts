import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser } from './utils';

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
      .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', identity.subject))
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
      betterAuthId: identity.subject,
      name: identity.name ?? 'Unknown User',
      email: identity.email ?? '',
      role: 'owner',
      notificationsEnabled: true,
      createdAt: Date.now(),
      avatarUrl: identity.pictureUrl,
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
