"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, LayoutGrid, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWorkspace } from "@/features/workspaces/workspace-context";
import { RenameWorkspaceModal } from "@/features/workspaces/RenameWorkspaceModal";

export function WorkspaceSwitcher() {
  const {
    workspaces,
    selectedWorkspace,
    selectedWorkspaceId,
    selectWorkspace,
    openCreateWorkspace,
    renameWorkspace,
    deleteWorkspace,
  } = useWorkspace();

  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!selectedWorkspaceId) return;
    setDeleting(true);
    try {
      await deleteWorkspace(selectedWorkspaceId);
      setConfirmDelete(false);
    } catch {
      // keep the dialog open to retry
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* workspace selector */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              title="Switch workspace"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-sm text-white outline-none transition hover:border-blue-500/40 data-popup-open:border-blue-500/50"
            />
          }
        >
          <LayoutGrid className="size-4 text-blue-400" />
          <span className="max-w-40 truncate font-medium">{selectedWorkspace?.name ?? "No workspace"}</span>
          <ChevronsUpDown className="size-3.5 text-zinc-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {workspaces.map((w) => (
            <DropdownMenuItem key={w.id} onClick={() => selectWorkspace(w.id)} className="gap-2">
              <LayoutGrid className="size-4 shrink-0 text-zinc-400" />
              <span className="flex-1 truncate">{w.name}</span>
              {w.id === selectedWorkspaceId && <Check className="size-4 text-blue-400" />}
            </DropdownMenuItem>
          ))}
          {workspaces.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={openCreateWorkspace} className="gap-2 text-blue-400">
            <Plus className="size-4" /> New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* settings: rename / delete */}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={!selectedWorkspace}
          render={
            <button
              type="button"
              title="Workspace settings"
              className="grid size-8 place-items-center rounded-lg border border-white/10 text-zinc-400 outline-none transition hover:border-blue-500/40 hover:text-white data-popup-open:border-blue-500/50 disabled:opacity-40"
            />
          }
        >
          <Settings className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setRenaming(true)} className="gap-2">
            <Pencil className="size-4" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)} className="gap-2">
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {renaming && selectedWorkspace && (
        <RenameWorkspaceModal
          currentName={selectedWorkspace.name}
          existingNames={workspaces.filter((w) => w.id !== selectedWorkspace.id).map((w) => w.name)}
          onClose={() => setRenaming(false)}
          onRename={async (name) => {
            await renameWorkspace(selectedWorkspace.id, name);
            setRenaming(false);
          }}
        />
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{selectedWorkspace?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the workspace and all its collections and requests. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white hover:bg-red-500">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
