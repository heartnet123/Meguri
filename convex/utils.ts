import { QueryCtx, MutationCtx } from './_generated/server';
import { Id } from './_generated/dataModel';

export type User = {
  _id: Id<'users'>;
  workspaceId?: Id<'workspaces'>;
  betterAuthId?: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
};

/**
 * Get the currently authenticated user profile from the database.
 * Identity is provided by Better Auth via the Convex JWT plugin.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<User | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query('users')
    .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', identity.tokenIdentifier))
    .unique();
}

/**
 * Securely verify that the user is authenticated and belongs to the specified workspace.
 */
export async function verifyWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<'workspaces'>
): Promise<User> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error('Unauthenticated');
  }

  const membership = await ctx.db
    .query('workspaceMemberships')
    .withIndex('by_user_workspace', (q) => q.eq('userId', user._id).eq('workspaceId', workspaceId))
    .unique();

  if (!membership) {
    throw new Error('Unauthorized: You do not belong to this workspace');
  }

  return user;
}

/**
 * Check if the user has one of the required roles.
 */
export function checkRole(user: User, allowedRoles: User['role'][]) {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Requires ${allowedRoles.join(' or ')} role`);
  }
}
