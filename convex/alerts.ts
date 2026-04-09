import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { verifyWorkspace, checkRole } from './utils';
import { getAlertCategory, getAlertHref } from '../lib/alerts/inbox.js';

type AlertType = 'low_stock' | 'unusual_demand' | 'supplier' | 'price_change' | 'system';

async function loadUserNames(ctx: any, ids: Id<'users'>[]) {
  const uniqueIds = Array.from(new Set(ids));
  const users = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(
    users.flatMap((user) => (user ? [[user._id, user.name]] : []))
  );
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

    const alerts = await ctx.db
      .query('alerts')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .order('desc')
      .collect();

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

    const all = await ctx.db
      .query('alerts')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    const open = all.filter((alert) => alert.status === 'open');
    return {
      open: open.length,
      critical: open.filter((alert) => alert.severity === 'critical').length,
      unusual: open.filter((alert) => (alert.category ?? getAlertCategory(alert.type)) === 'anomaly').length,
      lowStock: open.filter((alert) => (alert.category ?? getAlertCategory(alert.type)) === 'stock').length,
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

    const user = await verifyWorkspace(ctx, alert.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager', 'staff']);

    if (assignedTo !== null) {
      const assignee = await ctx.db.get(assignedTo);
      if (!assignee || assignee.workspaceId !== alert.workspaceId) {
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

    const user = await verifyWorkspace(ctx, alert.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager', 'staff']);

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

    const user = await verifyWorkspace(ctx, alert.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager', 'staff']);

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
    const user = await verifyWorkspace(ctx, workspaceId);
    checkRole(user, ['owner', 'admin', 'manager', 'staff']);

    const open = await ctx.db
      .query('alerts')
      .withIndex('by_workspace_status', (q) =>
        q.eq('workspaceId', workspaceId).eq('status', 'open')
      )
      .collect();

    const now = Date.now();
    await Promise.all(
      open.map((alert) =>
        ctx.db.patch(alert._id, {
          status: 'resolved',
          resolvedAt: now,
          resolvedBy: user._id,
        })
      )
    );
  },
});
