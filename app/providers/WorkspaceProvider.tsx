'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useActiveOrganization } from '@/lib/auth';

type WorkspaceContextValue = {
  workspaceId: string | undefined;
  organization: any | null; // From better-auth
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceId: undefined,
  organization: null,
  isLoading: true,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: activeOrg, isPending } = useActiveOrganization();

  // Optionally automatically handle setting active org if needed,
  // or just rely on what Better Auth manages via the organization plugin

  return (
    <WorkspaceContext.Provider value={{
      workspaceId: activeOrg?.id,
      organization: activeOrg,
      isLoading: isPending
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceId() {
  return useContext(WorkspaceContext).workspaceId;
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}