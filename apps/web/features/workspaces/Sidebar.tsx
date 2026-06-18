"use client";

import { useRef, useState } from "react";
import { Check, ChevronRight, Layers, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PlusIcon } from "@/components/ui/icons";
import { useEnv } from "@/features/env-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTabs } from "@/features/requests/tabs-context";
import { useWorkspace } from "./workspace-context";
import type { SavedRequest } from "@/lib/api/requests";

const methodColor: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
  HEAD: "text-zinc-400",
  OPTIONS: "text-zinc-400",
};

function FolderIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function Sidebar() {
  const {
    collections,
    collectionsLoading,
    selectedWorkspaceId,
    selectedCollectionId,
    selectCollection,
    createCollection,
  } = useWorkspace();
  const { tabs, requestsByCollection, expanded, toggleCollection, openSaved, openEnvironment, updateEnvTab, closeTab, renameRequest, deleteRequest } =
    useTabs();
  const { environments, activeEnvId, setActiveEnvId, createEnv, renameEnv, deleteEnv } = useEnv();

  // inline collection create
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [savingCol, setSavingCol] = useState(false);
  const busy = useRef(false);

  // inline request rename
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  // inline environment create + rename
  const [creatingEnv, setCreatingEnv] = useState(false);
  const [envDraft, setEnvDraft] = useState("");
  const envBusy = useRef(false);
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
  const [envRenameDraft, setEnvRenameDraft] = useState("");

  function cancelCreate() {
    setCreating(false);
    setDraft("");
  }

  async function commitCreate() {
    if (busy.current) return;
    const name = draft.trim();
    if (!name) {
      cancelCreate();
      return;
    }
    busy.current = true;
    setSavingCol(true);
    try {
      await createCollection(name);
      cancelCreate();
    } catch {
      // keep open to retry
    } finally {
      busy.current = false;
      setSavingCol(false);
    }
  }

  async function commitRename(r: SavedRequest) {
    const name = renameDraft.trim();
    setEditingId(null);
    if (name && name !== r.name) await renameRequest(r, name);
  }

  function cancelEnvCreate() {
    setCreatingEnv(false);
    setEnvDraft("");
  }

  // create the env (empty), then open it in a tab to edit its variables
  async function commitEnvCreate() {
    if (envBusy.current) return;
    const name = envDraft.trim();
    if (!name) {
      cancelEnvCreate();
      return;
    }
    envBusy.current = true;
    try {
      const env = await createEnv(name);
      cancelEnvCreate();
      openEnvironment({ envId: env.id, name: env.name });
    } catch {
      // keep open to retry
    } finally {
      envBusy.current = false;
    }
  }

  async function commitEnvRename(env: { id: string; name: string }) {
    const name = envRenameDraft.trim();
    setEditingEnvId(null);
    if (!name || name === env.name) return;
    await renameEnv(environments.find((e) => e.id === env.id)!, name);
    // keep any open tab's label in sync
    const t = tabs.find((tb) => tb.kind === "environment" && tb.envId === env.id);
    if (t) updateEnvTab(t.id, { name });
  }

  async function handleEnvDelete(id: string) {
    await deleteEnv(id);
    const t = tabs.find((tb) => tb.kind === "environment" && tb.envId === id);
    if (t) closeTab(t.id);
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-ayu-line bg-white/2">
      {/* collections + requests tree */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase">Collections</p>
          <button
            onClick={() => {
              setDraft("");
              setCreating(true);
            }}
            disabled={!selectedWorkspaceId}
            title="New collection"
            className="text-zinc-400 transition hover:text-blue-300 disabled:opacity-40"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>

        {creating && (
          <div className="mb-1 flex items-center gap-2 rounded-lg border border-blue-500/40 bg-white/[0.03] px-2 py-1.5">
            <FolderIcon className="size-4 shrink-0 text-zinc-500" />
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCreate();
                else if (e.key === "Escape") cancelCreate();
              }}
              onBlur={commitCreate}
              disabled={savingCol}
              placeholder="Collection name"
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />
          </div>
        )}

        {collectionsLoading ? (
          <p className="px-1 text-sm text-zinc-600">Loading…</p>
        ) : (
          <nav className="flex flex-col gap-0.5">
            {collections.map((col) => {
              const open = !!expanded[col.id];
              const reqs = requestsByCollection[col.id] ?? [];
              return (
                <div key={col.id}>
                  {/* collection row */}
                  <div
                    onClick={() => {
                      selectCollection(col.id);
                      toggleCollection(col.id);
                    }}
                    className={`group flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition ${
                      col.id === selectedCollectionId
                        ? "bg-blue-500/15 text-white"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    }`}
                  >
                    <ChevronRight
                      className={`size-3.5 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`}
                    />
                    <FolderIcon className="size-4 shrink-0 text-zinc-500" />
                    <span className="flex-1 truncate">{col.name}</span>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      title="Settings"
                      className="rounded p-0.5 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>

                  {/* requests under the collection */}
                  {open && (
                    <div className="mt-0.5 ml-3 flex flex-col gap-0.5 border-l border-ayu-line pl-2">
                      {reqs.map((r) =>
                        editingId === r.id ? (
                          <input
                            key={r.id}
                            autoFocus
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void commitRename(r);
                              else if (e.key === "Escape") setEditingId(null);
                            }}
                            onBlur={() => setEditingId(null)}
                            className="rounded-md border border-blue-500/40 bg-white/[0.03] px-2 py-1 text-sm text-white outline-none"
                          />
                        ) : (
                          <div
                            key={r.id}
                            onClick={() => openSaved(r)}
                            className="group/req flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
                          >
                            <span
                              className={`shrink-0 text-[10px] font-semibold ${methodColor[r.method] ?? "text-zinc-400"}`}
                            >
                              {r.method}
                            </span>
                            <span className="flex-1 truncate">{r.name || "Untitled"}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    title="Request actions"
                                    className="cursor-pointer rounded p-0.5 text-zinc-500 opacity-0 transition group-hover/req:opacity-100 hover:bg-white/10 hover:text-white"
                                  />
                                }
                              >
                                <MoreHorizontal className="size-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRenameDraft(r.name);
                                    setEditingId(r.id);
                                  }}
                                >
                                  <Pencil className="size-4" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => void deleteRequest(r)}>
                                  <Trash2 className="size-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ),
                      )}
                      {reqs.length === 0 && <p className="px-2 py-1 text-xs text-zinc-600">No requests yet.</p>}
                    </div>
                  )}
                </div>
              );
            })}
            {collections.length === 0 && !creating && <p className="px-1 text-sm text-zinc-600">No collections yet.</p>}
          </nav>
        )}
      </div>

      {/* environments — click to edit in a tab, check to set the active env */}
      <div className="flex shrink-0 flex-col border-t border-ayu-line">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <p className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase">Environments</p>
          <button
            onClick={() => {
              setEnvDraft("");
              setCreatingEnv(true);
            }}
            disabled={!selectedWorkspaceId}
            title="New environment"
            className="text-zinc-400 transition hover:text-blue-300 disabled:opacity-40"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
        <div className="max-h-56 overflow-y-auto px-3 pb-3">
          {creatingEnv && (
            <div className="mb-1 flex items-center gap-2 rounded-lg border border-blue-500/40 bg-white/3 px-2 py-1.5">
              <Layers className="size-4 shrink-0 text-zinc-500" />
              <input
                autoFocus
                value={envDraft}
                onChange={(e) => setEnvDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void commitEnvCreate();
                  else if (e.key === "Escape") cancelEnvCreate();
                }}
                onBlur={() => void commitEnvCreate()}
                placeholder="Environment name"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </div>
          )}
          <nav className="flex flex-col gap-0.5">
            {environments.map((env) => {
              const isActive = env.id === activeEnvId;
              return editingEnvId === env.id ? (
                <input
                  key={env.id}
                  autoFocus
                  value={envRenameDraft}
                  onChange={(e) => setEnvRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void commitEnvRename(env);
                    else if (e.key === "Escape") setEditingEnvId(null);
                  }}
                  onBlur={() => setEditingEnvId(null)}
                  className="rounded-md border border-blue-500/40 bg-white/3 px-2 py-1 text-sm text-white outline-none"
                />
              ) : (
                <div
                  key={env.id}
                  onClick={() => openEnvironment({ envId: env.id, name: env.name })}
                  className="group/env flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
                >
                  <Layers className={`size-4 shrink-0 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                  <span className="flex-1 truncate">{env.name}</span>
                  <button
                    type="button"
                    title={isActive ? "Active — click to unset" : "Set as active"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveEnvId(isActive ? null : env.id);
                    }}
                    className={`rounded p-0.5 transition ${
                      isActive
                        ? "text-emerald-400"
                        : "text-zinc-600 opacity-0 group-hover/env:opacity-100 hover:text-emerald-300"
                    }`}
                  >
                    <Check className="size-4" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          onClick={(e) => e.stopPropagation()}
                          title="Environment actions"
                          className="rounded p-0.5 text-zinc-500 opacity-0 transition group-hover/env:opacity-100 hover:bg-white/10 hover:text-white"
                        />
                      }
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEnvRenameDraft(env.name);
                          setEditingEnvId(env.id);
                        }}
                      >
                        <Pencil className="size-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => void handleEnvDelete(env.id)}>
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
            {environments.length === 0 && !creatingEnv && (
              <p className="px-2 py-1 text-xs text-zinc-600">No environments yet.</p>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
