'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';

/**
 * Keeps the app-level Convex user profile in sync with Better Auth sessions.
 * This prevents authenticated users from landing in onboarding flows without
 * a corresponding document in the `users` table.
 */
export function AuthProfileSync() {
  const { data: session, isPending } = authClient.useSession();
  const storeUser = useMutation(api.users.store);
  const lastSyncedUserKey = useRef<string | null>(null);

  useEffect(() => {
    const sessionUser = session?.user;

    if (isPending || !sessionUser) {
      if (!sessionUser) {
        lastSyncedUserKey.current = null;
      }
      return;
    }

    const syncKey = sessionUser.id ?? sessionUser.email ?? 'authenticated-user';
    if (lastSyncedUserKey.current === syncKey) {
      return;
    }

    let isCancelled = false;

    void storeUser({})
      .then(() => {
        if (!isCancelled) {
          lastSyncedUserKey.current = syncKey;
        }
      })
      .catch((error) => {
        console.error('Failed to sync authenticated user profile', error);
      });

    return () => {
      isCancelled = true;
    };
  }, [isPending, session?.user, storeUser]);

  return null;
}

export default AuthProfileSync;
