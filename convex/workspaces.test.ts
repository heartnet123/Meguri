/// <reference types="vite/client" />

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

describe('workspaces.create', () => {
  it('creates a missing user profile for authenticated users before creating the workspace', async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: 'auth|alice',
      name: 'Alice Example',
      email: 'alice@example.com',
    });

    await t.mutation(api.workspaces.create, {
      name: 'Alice Bakery',
      slug: 'alice-bakery',
      currency: 'THB',
      timezone: 'Asia/Bangkok',
    });

    const me = await t.query(api.users.me, {});
    const myWorkspaces = await t.query(api.workspaces.myWorkspaces, {});

    expect(me).toMatchObject({
      betterAuthId: 'auth|alice',
      name: 'Alice Example',
      email: 'alice@example.com',
    });
    expect(myWorkspaces).toHaveLength(1);
    expect(myWorkspaces[0]).toMatchObject({
      name: 'Alice Bakery',
      slug: 'alice-bakery',
      role: 'owner',
    });
  });
});
