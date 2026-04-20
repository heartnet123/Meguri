import { QueryCtx, MutationCtx } from './_generated/server';
import { Id } from './_generated/dataModel';

export type User = {
  _id: Id<'users'>;
  betterAuthId?: string;
  name: string;
  email: string;
};

export type Membership = {
  _id: Id<'workspaceMemberships'>;
  workspaceId: Id<'workspaces'>;
  userId: Id<'users'>;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
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
 * Ensure the authenticated user has an app profile.
 * This self-heals older sessions created before the profile sync mutation runs.
 */
export async function ensureCurrentUser(ctx: MutationCtx): Promise<User> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthenticated');
  }

  const existingUser = await ctx.db
    .query('users')
    .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', identity.tokenIdentifier))
    .unique();

  if (existingUser) {
    const nextName = identity.name ?? existingUser.name;
    const nextEmail = identity.email ?? existingUser.email;

    if (nextName !== existingUser.name || nextEmail !== existingUser.email || identity.pictureUrl !== existingUser.avatarUrl) {
      await ctx.db.patch(existingUser._id, {
        name: nextName,
        email: nextEmail,
        avatarUrl: identity.pictureUrl ?? existingUser.avatarUrl,
      });
    }

    return {
      _id: existingUser._id,
      betterAuthId: existingUser.betterAuthId,
      name: nextName,
      email: nextEmail,
    };
  }

  const userId = await ctx.db.insert('users', {
    betterAuthId: identity.tokenIdentifier,
    name: identity.name ?? 'ผู้ใช้ไม่ทราบชื่อ',
    email: identity.email ?? '',
    notificationsEnabled: true,
    createdAt: Date.now(),
    avatarUrl: identity.pictureUrl,
    timezone: 'Asia/Bangkok',
    language: 'th',
    currency: 'THB',
    dateFormat: 'DD/MM/YYYY',
  });

  return {
    _id: userId,
    betterAuthId: identity.tokenIdentifier,
    name: identity.name ?? 'ผู้ใช้ไม่ทราบชื่อ',
    email: identity.email ?? '',
  };
}

/**
 * Get user's membership for a specific workspace.
 */
export async function getMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  workspaceId: Id<'workspaces'>
): Promise<Membership | null> {
  const membership = await ctx.db
    .query('workspaceMemberships')
    .withIndex('by_user_workspace', (q) => q.eq('userId', userId).eq('workspaceId', workspaceId))
    .unique();

  if (!membership) return null;

  return {
    _id: membership._id,
    workspaceId: membership.workspaceId,
    userId: membership.userId,
    role: membership.role as Membership['role'],
  };
}

/**
 * Securely verify that the user is authenticated and belongs to the specified workspace.
 * Returns the membership record which includes the user's role in this workspace.
 */
export async function verifyWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<'workspaces'>
): Promise<{ user: User; membership: Membership }> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error('Unauthenticated');
  }

  const membership = await getMembership(ctx, user._id, workspaceId);
  if (!membership) {
    throw new Error('Unauthorized: You do not belong to this workspace');
  }

  return { user, membership };
}

/**
 * Check if the membership has one of the required roles.
 */
export function checkRole(membership: Membership, allowedRoles: Membership['role'][]) {
  if (!allowedRoles.includes(membership.role)) {
    throw new Error(`Forbidden: Requires ${allowedRoles.join(' or ')} role`);
  }
}
