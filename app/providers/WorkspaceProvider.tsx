'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type WorkspaceContextValue = {
  workspaceId: Id<'workspaces'> | undefined;
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceId: undefined,
  isLoading: true,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const myWorkspace = useQuery(api.workspaces.myWorkspace);
  const isLoading = myWorkspace === undefined;

  return (
    <WorkspaceContext.Provider value={{ workspaceId: myWorkspace?._id, isLoading }}>
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
