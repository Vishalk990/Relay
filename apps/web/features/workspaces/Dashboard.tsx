"use client";

import { Sidebar } from "@/features/workspaces/Sidebar";
import { WorkspaceDetail } from "@/features/workspaces/WorkspaceDetail";
import { useWorkspace } from "@/features/workspaces/workspace-context";
import { TabsProvider } from "@/features/requests/tabs-context";
import { EnvProvider } from "@/features/env-context";

export function Dashboard() {
  const { selectedWorkspace, selectedWorkspaceId, selectedCollectionId, collections } = useWorkspace();

  return (
    <TabsProvider>
      <EnvProvider workspaceId={selectedWorkspaceId}>
        <Sidebar />
        <WorkspaceDetail
          workspace={selectedWorkspace}
          collectionId={selectedCollectionId}
          collections={collections}
        />
      </EnvProvider>
    </TabsProvider>
  );
}
