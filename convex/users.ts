import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser } from './utils';

/**
 * Stores or updates a user in the database based on their Clerk identity.
 * This should be called by the frontend after a successful login.
 */
export const store = mutation({
  args: {
    workspaceId: v.id('workspaces'),
  },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Called storeUser without authentication');
    }

    // Check if user already exists
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (user !== null) {
      // If the user already exists, update their profile
      if (user.workspaceId !== workspaceId) {
        // If they're trying to join a different workspace, this logic depends on the app's requirements.
        // For now, we'll keep the existing workspace association.
      }
      
      await ctx.db.patch(user._id, {
        name: identity.name ?? user.name,
        email: identity.email ?? user.email,
        avatarUrl: identity.pictureUrl ?? user.avatarUrl,
      });
      return user._id;
    }

    // Create a new user
    return await ctx.db.insert('users', {
      workspaceId,
      clerkId: identity.subject,
      name: identity.name ?? 'Unknown User',
      email: identity.email ?? 'no-email@clerk.com',
      role: 'owner', // Default role for the first user in a workspace
      notificationsEnabled: true,
      createdAt: Date.now(),
      avatarUrl: identity.pictureUrl,
    });
  },
});

/**
 * Returns the currently authenticated user.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});
