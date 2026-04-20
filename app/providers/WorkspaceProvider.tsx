'use client';

import { createContext, useContext, ReactNode, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type WorkspaceContextValue = {
  workspaceId: Id<'workspaces'> | undefined | null;
  isLoading: boolean;
  hasNoWorkspaces: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceId: undefined,
  isLoading: true,
  hasNoWorkspaces: false,
});

const STORAGE_KEY = 'smartstock-current-workspace';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const myWorkspaces = useQuery(api.workspaces.myWorkspaces);
  const [storedWorkspaceId] = useState<Id<'workspaces'> | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (stored as Id<'workspaces'>) : null;
  });

  const currentWorkspaceId = useMemo(() => {
    if (!myWorkspaces || myWorkspaces.length === 0) {
      return null;
    }

    if (storedWorkspaceId && myWorkspaces.some((workspace) => workspace._id === storedWorkspaceId)) {
      return storedWorkspaceId;
    }

    return myWorkspaces[0]._id;
  }, [myWorkspaces, storedWorkspaceId]);

  const isLoading = myWorkspaces === undefined;
  const hasNoWorkspaces = myWorkspaces !== undefined && myWorkspaces.length === 0;

  return (
    <WorkspaceContext.Provider value={{
      workspaceId: currentWorkspaceId ?? undefined,
      isLoading,
      hasNoWorkspaces,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceId() {
  const context = useContext(WorkspaceContext);
  return context.workspaceId;
}

export function useWorkspaceLoading() {
  return useContext(WorkspaceContext).isLoading;
}

export function useHasNoWorkspaces() {
  return useContext(WorkspaceContext).hasNoWorkspaces;
}

/**
 * Switch to a different workspace - persists to localStorage
 */
export function useSwitchWorkspace() {
  return (workspaceId: Id<'workspaces'>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, workspaceId);
    }
    // Trigger a page refresh to reload workspace-scoped data
    window.location.reload();
  };
}
