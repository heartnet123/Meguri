'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type WorkspaceContextValue = {
  workspaceId: Id<'workspaces'> | undefined;
  setWorkspaceId: (id: Id<'workspaces'>) => void;
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceId: undefined,
  setWorkspaceId: () => {},
  isLoading: true,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: reads localStorage once at construction
  const [workspaceId, setWorkspaceIdState] = useState<Id<'workspaces'> | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const stored = localStorage.getItem('ss_workspace_id');
      // Simple validation for Id format if needed, but for now just cast
      return stored ? (stored as Id<'workspaces'>) : undefined;
    } catch {
      return undefined;
    }
  });

  const myWorkspace = useQuery(api.workspaces.myWorkspace);
  const isLoading = myWorkspace === undefined;

  // Auto-sync: if no ID in state but we have one from query, set it.
  useEffect(() => {
    if (!workspaceId && myWorkspace?._id) {
      setWorkspaceIdState(myWorkspace._id);
      try {
        localStorage.setItem('ss_workspace_id', myWorkspace._id);
      } catch (e) {
        console.error('Failed to save workspaceId to localStorage', e);
      }
    }
  }, [workspaceId, myWorkspace]);

  const setWorkspaceId = (id: Id<'workspaces'>) => {
    try {
      localStorage.setItem('ss_workspace_id', id);
    } catch {
      // ignore
    }
    setWorkspaceIdState(id);
  };

  return (
    <WorkspaceContext.Provider value={{ workspaceId, setWorkspaceId, isLoading }}>
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
