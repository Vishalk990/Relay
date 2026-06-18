"use client";

import { RequestTabs } from "@/features/requests/RequestTabs";
import { useWorkspace } from "./workspace-context";
import type { Workspace } from "./types";
import type { Collection } from "@/lib/api/collections";

interface WorkspaceDetailProps {
  workspace: Workspace | null;
  collectionId: string | null;
  collections: Collection[];
}

export function WorkspaceDetail({ workspace, collectionId, collections }: WorkspaceDetailProps) {
  const { openCreateWorkspace } = useWorkspace();

  if (!workspace) {
    return (
      <main className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="relative text-center">
          <h2 className="text-lg font-medium text-zinc-300">No workspace selected</h2>
          <p className="mt-1 text-sm text-zinc-500">Create your first workspace to get started.</p>
          <button
            onClick={openCreateWorkspace}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            + New workspace
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1">
        <RequestTabs collectionId={collectionId} collections={collections} />
      </div>
    </main>
  );
}
