"use client";

import type { Workspace } from "./types";

interface WorkspaceDetailProps {
  workspace: Workspace | null;
  onCreate: () => void;
}

export function WorkspaceDetail({ workspace, onCreate }: WorkspaceDetailProps) {
  // Empty state — no workspace selected / none exist yet.
  if (!workspace) {
    return (
      <main className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="relative text-center">
          <h2 className="text-lg font-medium text-zinc-300">No workspace selected</h2>
          <p className="mt-1 text-sm text-zinc-500">Create your first workspace to get started.</p>
          <button
            onClick={onCreate}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            + New workspace
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto">
      {/* header */}
      <header className="border-b border-white/10 px-8 py-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-500 text-lg font-bold text-white">
            {workspace.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-semibold text-white">{workspace.name}</h1>
            <p className="text-xs text-zinc-500">Created {workspace.createdAt}</p>
          </div>
        </div>
      </header>

      {/* stats */}
      <div className="grid grid-cols-3 gap-4 px-8 py-6">
        <Stat label="Collections" value={workspace.collections} />
        <Stat label="Requests" value={workspace.requests} />
        <Stat label="Members" value={1} />
      </div>

      {/* content placeholder */}
      <div className="px-8 pb-8">
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-zinc-400">Collections &amp; requests will live here.</p>
          <p className="mt-1 text-xs text-zinc-600">Coming next — for now this is the workspace shell.</p>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs tracking-wide text-zinc-500 uppercase">{label}</p>
    </div>
  );
}
