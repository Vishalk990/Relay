"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/features/workspaces/Sidebar";
import { WorkspaceDetail } from "@/features/workspaces/WorkspaceDetail";
import { CreateWorkspaceModal } from "@/features/workspaces/CreateWorkspaceModal";
import { listWorkspaces, createWorkspace } from "@/lib/api/workspaces";
import type { Workspace } from "@/features/workspaces/types";

export function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listWorkspaces()
      .then((ws) => {
        setWorkspaces(ws);
        setSelectedId(ws[0]?.id ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(name: string) {
    const ws = await createWorkspace(name);
    setWorkspaces((prev) => [...prev, ws]);
    setSelectedId(ws.id);
    setCreating(false);
  }

  const selected = workspaces.find((w) => w.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black font-sans text-sm text-zinc-500">
        Loading workspaces…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-black font-sans text-center">
        <p className="text-sm text-red-400">{error}</p>
        <p className="text-xs text-zinc-500">Make sure you&rsquo;re signed in and the backend is running.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black font-sans text-zinc-200">
      <Sidebar
        workspaces={workspaces}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setCreating(true)}
      />
      <WorkspaceDetail workspace={selected} onCreate={() => setCreating(true)} />
      {creating && (
        <CreateWorkspaceModal
          existingNames={workspaces.map((w) => w.name)}
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
