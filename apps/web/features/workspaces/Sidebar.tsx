"use client";

import { PlusIcon } from "@/components/ui/icons";
import type { Workspace } from "./types";

interface SidebarProps {
  workspaces: Workspace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function Sidebar({ workspaces, selectedId, onSelect, onCreate }: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-white/[0.02]">
      {/* brand */}
      <div className="flex items-center gap-2 px-5 py-4">
        <span className="grid size-7 place-items-center rounded-lg bg-blue-500 text-sm font-bold text-white">R</span>
        <span className="text-sm font-semibold tracking-[0.2em] text-blue-400/80 uppercase">Relay</span>
      </div>

      {/* workspaces list */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">
        <p className="px-2 pb-2 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">Workspaces</p>
        <nav className="flex flex-col gap-0.5">
          {workspaces.map((w) => {
            const active = w.id === selectedId;
            return (
              <button
                key={w.id}
                onClick={() => onSelect(w.id)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  active ? "bg-blue-500/15 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-md text-xs font-semibold ${
                    active ? "bg-blue-500 text-white" : "bg-white/10 text-zinc-300"
                  }`}
                >
                  {w.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{w.name}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={onCreate}
          className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-white/15 px-2.5 py-2 text-sm text-zinc-400 transition hover:border-blue-500/40 hover:text-blue-300"
        >
          <PlusIcon className="size-4" /> New workspace
        </button>
      </div>

      {/* user chip */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white">
            Y
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-zinc-200">You</p>
            <p className="truncate text-xs text-zinc-500">you@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
