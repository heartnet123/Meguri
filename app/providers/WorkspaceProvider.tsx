'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Id } from '@/convex/_generated/dataModel';

type WorkspaceContextValue = {
  workspaceId: Id<'workspaces'> | undefined;
  setWorkspaceId: (id: Id<'workspaces'>) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceId: undefined,
  setWorkspaceId: () => {},
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

  const setWorkspaceId = (id: Id<'workspaces'>) => {
    try {
      localStorage.setItem('ss_workspace_id', id);
    } catch {
      // ignore
    }
    setWorkspaceIdState(id);
  };

  return (
    <WorkspaceContext.Provider value={{ workspaceId, setWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceId() {
  return useContext(WorkspaceContext).workspaceId;
}
