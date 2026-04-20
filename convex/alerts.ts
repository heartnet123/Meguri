import { mutation, query, MutationCtx, QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { verifyWorkspace, checkRole } from './utils';
import { getAlertCategory, getAlertHref } from '../lib/alerts/inbox.js';

type AlertType = 'low_stock' | 'unusual_demand' | 'supplier' | 'price_change' | 'system';

async function loadUserNames(ctx: QueryCtx | MutationCtx, ids: Id<'users'>[]) {
  const uniqueIds = Array.from(new Set(ids));
  const users = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(
    users.flatMap((user) => (user ? [[user._id, user.name]] : []))
  );
}

async function countQuery<T>(query: AsyncIterable<T>) {
  let count = 0;
  for await (const _row of query) {
    count += 1;
  }
  return count;
}

function buildAlertSummary(alert: {
  type: AlertType;
  relatedItemId?: Id<'inventoryItems'>;
  relatedEntityId?: string;
  category?: 'stock' | 'anomaly' | 'supplier' | 'system';
}) {
  return {
    category: alert.category ?? getAlertCategory(alert.type),
    href: getAlertHref({
      type: alert.type,
      relatedItemId: alert.relatedItemId,
      relatedEntityId: alert.relatedEntityId,
    }),
  };
}

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const alerts = [];
    for await (const alert of ctx.db
      .query('alerts')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .order('desc')) {
      alerts.push(alert);
    }

    const userNameMap = await loadUserNames(
      ctx,
      alerts.flatMap((alert) => [
        ...(alert.assignedTo ? [alert.assignedTo] : []),
        ...(alert.resolvedBy ? [alert.resolvedBy] : []),
      ])
    );

    return alerts.map((alert) => {
      const summary = buildAlertSummary(alert);
      return {
        ...alert,
        category: summary.category,
        href: summary.href,
        assignedToName: alert.assignedTo ? userNameMap.get(alert.assignedTo) ?? null : null,
        resolvedByName: alert.resolvedBy ? userNameMap.get(alert.resolvedBy) ?? null : null,
      };
    });
  },
});

export const stats = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const open = await countQuery(
      ctx.db
        .query('alerts')
        .withIndex('by_workspace_status', (q) => q.eq('workspaceId', workspaceId).eq('status', 'open'))
    );

    const critical = await countQuery(
      ctx.db
        .query('alerts')
        .withIndex('by_workspace_status_and_severity', (q) =>
          q.eq('workspaceId', workspaceId).eq('status', 'open').eq('severity', 'critical')
        )
    );

    const unusual = await countQuery(
      ctx.db
        .query('alerts')
        .withIndex('by_workspace_status_and_category', (q) =>
          q.eq('workspaceId', workspaceId).eq('status', 'open').eq('category', 'anomaly')
        )
    );

    const lowStock = await countQuery(
      ctx.db
        .query('alerts')
        .withIndex('by_workspace_status_and_category', (q) =>
          q.eq('workspaceId', workspaceId).eq('status', 'open').eq('category', 'stock')
        )
    );

    return {
      open,
      critical,
      unusual,
      lowStock,
    };
  },
});

export const assign = mutation({
  args: {
    id: v.id('alerts'),
    assignedTo: v.union(v.id('users'), v.null()),
  },
  handler: async (ctx, { id, assignedTo }) => {
    const alert = await ctx.db.get(id);
    if (!alert) throw new Error('Alert not found');

    const { user, membership } = await verifyWorkspace(ctx, alert.workspaceId);
    checkRole(membership, ['owner', 'admin', 'manager', 'staff']);

    if (assignedTo !== null) {
      // Verify assignee exists and has membership in this workspace
      const assigneeMembership = await ctx.db
        .query('workspaceMemberships')
        .withIndex('by_user_workspace', (q) => q.eq('userId', assignedTo).eq('workspaceId', alert.workspaceId))
        .unique();
      if (!assigneeMembership) {
        throw new Error('Assignee must belong to the same workspace');
      }
    }

    await ctx.db.patch(id, {
      assignedTo: assignedTo ?? undefined,
    });
  },
});

export const resolve = mutation({
  args: {
    id: v.id('alerts'),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { id, note }) => {
    const alert = await ctx.db.get(id);
    if (!alert) throw new Error('Alert not found');

    const { user, membership } = await verifyWorkspace(ctx, alert.workspaceId);
    checkRole(membership, ['owner', 'admin', 'manager', 'staff']);

    await ctx.db.patch(id, {
      status: 'resolved',
      resolvedAt: Date.now(),
      resolvedBy: user._id,
      resolutionNote: note?.trim() ? note.trim() : undefined,
    });
  },
});

export const reopen = mutation({
  args: { id: v.id('alerts') },
  handler: async (ctx, { id }) => {
    const alert = await ctx.db.get(id);
    if (!alert) throw new Error('Alert not found');

    const { membership } = await verifyWorkspace(ctx, alert.workspaceId);
    checkRole(membership, ['owner', 'admin', 'manager', 'staff']);

    await ctx.db.patch(id, {
      status: 'open',
      resolvedAt: undefined,
      resolvedBy: undefined,
      resolutionNote: undefined,
    });
  },
});

export const resolveAll = mutation({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    const { user, membership } = await verifyWorkspace(ctx, workspaceId);
    checkRole(membership, ['owner', 'admin', 'manager', 'staff']);

    const now = Date.now();
    for await (const alert of ctx.db
      .query('alerts')
      .withIndex('by_workspace_status', (q) => q.eq('workspaceId', workspaceId).eq('status', 'open'))) {
      await ctx.db.patch(alert._id, {
        status: 'resolved',
        resolvedAt: now,
        resolvedBy: user._id,
      });
    }
  },
});
