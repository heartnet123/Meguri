import { QueryCtx, MutationCtx } from './_generated/server';
import { Id } from './_generated/dataModel';

export type User = {
  _id: Id<'users'>;
  workspaceId: Id<'workspaces'>;
  clerkId?: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
};

/**
 * Get the currently authenticated user from the database.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<User | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique();
}

/**
 * Securely verify that the user belongs to the specified workspace.
 */
export async function verifyWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<'workspaces'>
): Promise<User> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error('Unauthenticated');
  }

  if (user.workspaceId !== workspaceId) {
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
