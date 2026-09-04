import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

const identity = (name: string, email: string) => ({
  tokenIdentifier: `auth|${email}`,
  name,
  email,
});

async function createWorkspace(
  t: ReturnType<typeof convexTest>,
  owner: ReturnType<typeof identity>,
  slug: string,
) {
  return t.withIdentity(owner).mutation(api.workspaces.create, {
    name: slug,
    slug,
    currency: 'THB',
    timezone: 'Asia/Bangkok',
  });
}

async function addMember(
  t: ReturnType<typeof convexTest>,
  workspaceId: Id<'workspaces'>,
  memberIdentity: ReturnType<typeof identity>,
  role: 'admin' | 'manager' | 'staff' | 'viewer',
) {
  const userId = await t.run((ctx) =>
    ctx.db.insert('users', {
      betterAuthId: memberIdentity.tokenIdentifier,
      name: memberIdentity.name,
      email: memberIdentity.email,
      notificationsEnabled: true,
      createdAt: Date.now(),
    }),
  );
  await t.run((ctx) =>
    ctx.db.insert('workspaceMemberships', {
      workspaceId,
      userId,
      role,
      joinedAt: Date.now(),
    }),
  );
  return userId;
}

describe('workspace access control', () => {
  it('allows members to read inventory but blocks a viewer from changing it', async () => {
    const t = convexTest(schema, modules);
    const owner = identity('Owner', 'owner@example.com');
    const viewer = identity('Viewer', 'viewer@example.com');
    const workspaceId = await createWorkspace(t, owner, 'viewer-workspace');
    await addMember(t, workspaceId, viewer, 'viewer');

    const itemId = await t.withIdentity(owner).mutation(api.inventory.add, {
      workspaceId,
      sku: 'FLOUR-1',
      name: 'Flour',
      category: 'ingredient',
      unit: 'kg',
      currentStock: 10,
      minStockLevel: 2,
    });

    await expect(
      t.withIdentity(viewer).query(api.inventory.list, { workspaceId }),
    ).resolves.toHaveLength(1);
    await expect(
      t.withIdentity(viewer).mutation(api.inventory.adjustStock, {
        id: itemId,
        type: 'adjustment',
        quantity: 1,
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it('blocks cross-workspace forecasting reads and writes', async () => {
    const t = convexTest(schema, modules);
    const alice = identity('Alice', 'alice@example.com');
    const bob = identity('Bob', 'bob@example.com');
    await createWorkspace(t, alice, 'alice-workspace');
    const bobWorkspaceId = await createWorkspace(t, bob, 'bob-workspace');

    const bobItemId = await t.withIdentity(bob).mutation(api.inventory.add, {
      workspaceId: bobWorkspaceId,
      sku: 'BOB-1',
      name: 'Bob stock',
      category: 'ingredient',
      unit: 'unit',
      currentStock: 3,
      minStockLevel: 1,
    });

    await expect(
      t.withIdentity(alice).query(api.forecasting.latestByItem, {
        workspaceId: bobWorkspaceId,
      }),
    ).rejects.toThrow(/Unauthorized/);
    await expect(
      t.withIdentity(alice).mutation(api.forecasting.saveSnapshot, {
        workspaceId: bobWorkspaceId,
        inventoryItemId: bobItemId,
        periodDays: 7,
        predictedQty: 4,
        unit: 'unit',
        confidence: 'high',
        model: 'test',
      }),
    ).rejects.toThrow(/Unauthorized/);
  });

  it('blocks cross-workspace purchase-planning reads and writes', async () => {
    const t = convexTest(schema, modules);
    const alice = identity('Alice', 'alice-purchase@example.com');
    const bob = identity('Bob', 'bob-purchase@example.com');
    await createWorkspace(t, alice, 'alice-purchase');
    const bobWorkspaceId = await createWorkspace(t, bob, 'bob-purchase');
    const bobItemId = await t.withIdentity(bob).mutation(api.inventory.add, {
      workspaceId: bobWorkspaceId,
      sku: 'BOB-REC',
      name: 'Bob recommendation item',
      category: 'ingredient',
      unit: 'unit',
      currentStock: 1,
      minStockLevel: 5,
    });
    const recommendationId = await t.run((ctx) =>
      ctx.db.insert('reorderRecommendations', {
        workspaceId: bobWorkspaceId,
        inventoryItemId: bobItemId,
        recommendedQty: 10,
        urgency: 'high',
        reason: 'test',
        status: 'pending',
        generatedAt: Date.now(),
      }),
    );

    await expect(
      t.withIdentity(alice).query(api.purchasePlanning.recommendations, {
        workspaceId: bobWorkspaceId,
      }),
    ).rejects.toThrow(/Unauthorized/);
    await expect(
      t.withIdentity(alice).mutation(api.purchasePlanning.accept, {
        id: recommendationId,
      }),
    ).rejects.toThrow(/Unauthorized/);
  });
});

describe('workspace invitations', () => {
  it('allows owners and admins to invite, but blocks managers', async () => {
    const t = convexTest(schema, modules);
    const owner = identity('Owner', 'invite-owner@example.com');
    const admin = identity('Admin', 'invite-admin@example.com');
    const manager = identity('Manager', 'invite-manager@example.com');
    const workspaceId = await createWorkspace(t, owner, 'invite-roles');
    await addMember(t, workspaceId, admin, 'admin');
    await addMember(t, workspaceId, manager, 'manager');

    await expect(
      t.withIdentity(owner).mutation(api.invitations.create, {
        workspaceId,
        email: 'owner-target@example.com',
        role: 'staff',
      }),
    ).resolves.toBeDefined();
    await expect(
      t.withIdentity(admin).mutation(api.invitations.create, {
        workspaceId,
        email: 'admin-target@example.com',
        role: 'viewer',
      }),
    ).resolves.toBeDefined();
    await expect(
      t.withIdentity(manager).mutation(api.invitations.create, {
        workspaceId,
        email: 'manager-target@example.com',
        role: 'staff',
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it('adds the invited account to the intended workspace with the invited role', async () => {
    const t = convexTest(schema, modules);
    const owner = identity('Owner', 'join-owner@example.com');
    const invitee = identity('Invitee', 'join-invitee@example.com');
    const workspaceId = await createWorkspace(t, owner, 'join-target');
    await t.withIdentity(owner).mutation(api.invitations.create, {
      workspaceId,
      email: invitee.email,
      role: 'viewer',
    });
    const token = await t.run(async (ctx) => {
      const invitation = await ctx.db
        .query('invitations')
        .withIndex('by_email', (q) => q.eq('email', invitee.email))
        .unique();
      return invitation!.token;
    });

    await expect(
      t.withIdentity(invitee).mutation(api.invitations.accept, { token }),
    ).resolves.toBe(workspaceId);
    await expect(
      t.withIdentity(invitee).query(api.workspaces.myWorkspaces, {}),
    ).resolves.toEqual([
      expect.objectContaining({ _id: workspaceId, role: 'viewer' }),
    ]);
  });

  it('rejects a valid invitation token used by a different email account', async () => {
    const t = convexTest(schema, modules);
    const owner = identity('Owner', 'binding-owner@example.com');
    const invitee = identity('Invitee', 'binding-invitee@example.com');
    const attacker = identity('Attacker', 'attacker@example.com');
    const workspaceId = await createWorkspace(t, owner, 'invite-binding');
    await t.withIdentity(owner).mutation(api.invitations.create, {
      workspaceId,
      email: invitee.email,
      role: 'viewer',
    });
    const token = await t.run(async (ctx) => {
      const invitation = await ctx.db
        .query('invitations')
        .withIndex('by_email', (q) => q.eq('email', invitee.email))
        .unique();
      return invitation!.token;
    });

    await expect(
      t.withIdentity(attacker).mutation(api.invitations.accept, { token }),
    ).rejects.toThrow(/invited email/i);
  });
});
