"use client";

import { useEffect, useRef, useState } from "react";

interface RenameWorkspaceModalProps {
  currentName: string;
  existingNames: string[];
  onClose: () => void;
  onRename: (name: string) => Promise<void>;
}

export function RenameWorkspaceModal({ currentName, existingNames, onClose, onRename }: RenameWorkspaceModalProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Name is required.");
    if (trimmed === currentName) return onClose();
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return setError("A workspace with that name already exists.");
    }
    try {
      setSubmitting(true);
      await onRename(trimmed);
    } catch {
      setError("Couldn't rename workspace. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-blue-950/40"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">Rename workspace</h2>

        <form onSubmit={submit} className="mt-5">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Workspace name"
            className="w-full rounded-lg border border-white/10 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
