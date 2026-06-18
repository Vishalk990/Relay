"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Collection } from "@/lib/api/collections";

interface SaveRequestModalProps {
  collections: Collection[];
  defaultCollectionId: string | null;
  initialName: string;
  initialDescription: string;
  saving: boolean;
  error: string;
  onSave: (collectionId: string, name: string, description: string) => void;
  onClose: () => void;
}

export function SaveRequestModal({
  collections,
  defaultCollectionId,
  initialName,
  initialDescription,
  saving,
  error,
  onSave,
  onClose,
}: SaveRequestModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [collectionId, setCollectionId] = useState(defaultCollectionId ?? "");

  // Save enabled only with a name AND a chosen collection.
  const canSave = name.trim() !== "" && collectionId !== "" && !saving;
  const selectedName = collections.find((c) => c.id === collectionId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">Save request</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Get user by id"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Description <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this request does…"
              className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Collection <span className="text-red-400">*</span>
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={collections.length === 0}
                render={
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3.5 py-2.5 text-sm text-white outline-none transition hover:border-blue-500/40 data-popup-open:border-blue-500/50 disabled:opacity-50"
                  />
                }
              >
                <span className={selectedName ? "text-white" : "text-zinc-600"}>
                  {selectedName ?? "Select a collection…"}
                </span>
                <ChevronDown className="ml-auto size-4 text-zinc-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                {collections.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => setCollectionId(c.id)} className="gap-2">
                    <span className="truncate">{c.name}</span>
                    {c.id === collectionId && <Check className="ml-auto size-4 text-blue-400" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {collections.length === 0 && (
              <p className="mt-1 text-xs text-amber-400">No collections yet — create one in the sidebar first.</p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(collectionId, name.trim(), description.trim())}
            disabled={!canSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
