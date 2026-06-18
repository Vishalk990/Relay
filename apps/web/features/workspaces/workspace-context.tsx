"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createWorkspace as apiCreate,
  updateWorkspace as apiUpdate,
  deleteWorkspace as apiDelete,
} from "@/lib/api/workspaces";
import { listCollections, createCollection as apiCreateCollection, type Collection } from "@/lib/api/collections";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import type { Workspace } from "./types";

type WorkspaceContextValue = {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  selectedWorkspace: Workspace | null;
  selectWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<void>;
  openCreateWorkspace: () => void;
  renameWorkspace: (id: string, name: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  // collections of the selected workspace
  collections: Collection[];
  collectionsLoading: boolean;
  selectedCollectionId: string | null;
  selectCollection: (id: string) => void;
  createCollection: (name: string) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  return ctx;
}

export function WorkspaceProvider({
  initialWorkspaces,
  children,
}: {
  initialWorkspaces: Workspace[];
  children: ReactNode;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(initialWorkspaces[0]?.id ?? null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Reload collections whenever the selected workspace changes.
  useEffect(() => {
    if (!selectedWorkspaceId) {
      setCollections([]);
      return;
    }
    setCollectionsLoading(true);
    setSelectedCollectionId(null);
    listCollections(selectedWorkspaceId)
      .then(setCollections)
      .catch(() => setCollections([]))
      .finally(() => setCollectionsLoading(false));
  }, [selectedWorkspaceId]);

  const selectWorkspace = useCallback((id: string) => setSelectedWorkspaceId(id), []);
  const selectCollection = useCallback((id: string) => setSelectedCollectionId(id), []);

  const createWorkspace = useCallback(async (name: string) => {
    const ws = await apiCreate(name);
    setWorkspaces((prev) => [...prev, ws]);
    setSelectedWorkspaceId(ws.id);
  }, []);

  const renameWorkspace = useCallback(async (id: string, name: string) => {
    const ws = await apiUpdate(id, name);
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name: ws.name } : w)));
  }, []);

  const deleteWorkspace = useCallback(async (id: string) => {
    await apiDelete(id);
    setWorkspaces((prev) => {
      const remaining = prev.filter((w) => w.id !== id);
      setSelectedWorkspaceId((cur) => (cur === id ? remaining[0]?.id ?? null : cur));
      return remaining;
    });
  }, []);

  const createCollection = useCallback(
    async (name: string) => {
      if (!selectedWorkspaceId) return;
      const col = await apiCreateCollection(selectedWorkspaceId, name);
      setCollections((prev) => [...prev, col]);
      setSelectedCollectionId(col.id);
    },
    [selectedWorkspaceId],
  );

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        selectedWorkspaceId,
        selectedWorkspace,
        selectWorkspace,
        createWorkspace,
        openCreateWorkspace: () => setCreating(true),
        renameWorkspace,
        deleteWorkspace,
        collections,
        collectionsLoading,
        selectedCollectionId,
        selectCollection,
        createCollection,
      }}
    >
      {children}
      {creating && (
        <CreateWorkspaceModal
          existingNames={workspaces.map((w) => w.name)}
          onClose={() => setCreating(false)}
          onCreate={async (name) => {
            await createWorkspace(name);
            setCreating(false);
          }}
        />
      )}
    </WorkspaceContext.Provider>
  );
}
