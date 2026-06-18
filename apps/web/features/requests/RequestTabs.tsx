"use client";

import { Layers, Plus, X } from "lucide-react";
import { RequestBuilder } from "./RequestBuilder";
import { EnvironmentPane } from "@/features/environments/EnvironmentPane";
import { METHOD_COLOR } from "./methods";
import { useTabs } from "./tabs-context";
import type { Collection } from "@/lib/api/collections";

export function RequestTabs({ collectionId, collections }: { collectionId: string | null; collections: Collection[] }) {
  const { tabs, activeId, setActive, openNew, updateTab, closeTab } = useTabs();
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className="flex h-full min-h-0 flex-col bg-ayu-bg">
      <div className="flex min-h-10 items-stretch border-b border-ayu-line bg-ayu-panel">
        <div className="flex flex-1 items-stretch overflow-x-auto">
          {tabs.map((t) => {
            const isActive = t.id === activeId;
            return (
              <div
                key={t.id}
                onClick={() => setActive(t.id)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    closeTab(t.id);
                  }
                }}
                className={`group flex max-w-48 shrink-0 cursor-pointer items-center gap-2 border-r border-ayu-line px-3 py-2 text-xs ${
                  isActive ? "bg-ayu-bg text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t.kind === "request" ? (
                  <>
                    <span className={`font-semibold ${METHOD_COLOR[t.method]}`}>{t.method}</span>
                    <span className="truncate">{t.name.trim() || t.url.trim() || "Untitled"}</span>
                  </>
                ) : (
                  <>
                    <Layers className="size-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">{t.name.trim() || "New environment"}</span>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                  className="cursor-pointer rounded p-0.5 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white"
                  title="Close tab"
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={openNew}
          title="New request"
          className="grid w-9 shrink-0 place-items-center border-l border-ayu-line text-zinc-400 transition hover:text-white"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* active request, or empty state when every tab is closed */}
      <div className="min-h-0 flex-1">
        {active ? (
          active.kind === "request" ? (
            <RequestBuilder
              tab={active}
              update={(patch) => updateTab(active.id, patch)}
              collectionId={collectionId}
              collections={collections}
            />
          ) : (
            <EnvironmentPane tab={active} />
          )
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <div className="rounded-xl border border-dashed border-ayu-line bg-white/2 px-10 py-8 text-center">
              <p className="text-sm font-medium text-zinc-300">No request open</p>
              <p className="mt-1 text-xs text-zinc-500">Open a saved request from the sidebar, or start a new one.</p>
              <button
                onClick={openNew}
                className="cursor-pointer mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                <Plus className="size-4" /> Add request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
