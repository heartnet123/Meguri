'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Id } from '@/convex/_generated/dataModel';

type WorkspaceContextValue = {
  workspaceId: Id<'workspaces'> | undefined;
  setWorkspaceId: (id: Id<'workspaces'>) => void;
  workspaceValidated: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceId: undefined,
  setWorkspaceId: () => {},
  workspaceValidated: false,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceIdState] = useState<Id<'workspaces'> | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const stored = localStorage.getItem('ss_workspace_id');
      return stored ? (stored as Id<'workspaces'>) : undefined;
    } catch {
      return undefined;
    }
  });
  const [workspaceValidated, setWorkspaceValidated] = useState<boolean>(false);

  useEffect(() => {
    if (workspaceId) {
      // TODO: Perform explicit validation here (e.g. check token or ownership).
      // For now, if we have a workspaceId, we consider it valid after the next tick.
      const timer = setTimeout(() => {
        setWorkspaceValidated(true);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setWorkspaceValidated(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [workspaceId]);

  const setWorkspaceId = (id: Id<'workspaces'>) => {
    try {
      localStorage.setItem('ss_workspace_id', id);
    } catch {
      // ignore
    }
    setWorkspaceIdState(id);
    setWorkspaceValidated(true);
  };

  return (
    <WorkspaceContext.Provider value={{ workspaceId, setWorkspaceId, workspaceValidated }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export function useWorkspaceId() {
  return useContext(WorkspaceContext).workspaceId;
}
