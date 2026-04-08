import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { verifyWorkspace, checkRole } from './utils';

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    return ctx.db
      .query('alerts')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .order('desc')
      .collect();
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

    const open = all.filter((a) => a.status === 'open');
    return {
      open: open.length,
      critical: open.filter((a) => a.severity === 'critical').length,
      unusual: open.filter((a) => a.type === 'unusual_demand').length,
      lowStock: open.filter((a) => a.type === 'low_stock').length,
    };
  },
});

export const resolve = mutation({
  args: { id: v.id('alerts') },
  handler: async (ctx, { id }) => {
    const alert = await ctx.db.get(id);
    if (!alert) throw new Error('Alert not found');

    const user = await verifyWorkspace(ctx, alert.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager', 'staff']);

    await ctx.db.patch(id, { 
      status: 'resolved', 
      resolvedAt: Date.now(),
      resolvedBy: user._id 
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
    await Promise.all(open.map((a) => ctx.db.patch(a._id, { 
      status: 'resolved', 
      resolvedAt: now,
      resolvedBy: user._id 
    })));
  },
});
