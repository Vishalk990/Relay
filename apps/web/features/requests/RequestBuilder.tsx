"use client";

import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import { sendRequest } from "./api";
import { createRequest, updateRequest } from "@/lib/api/requests";
import { ResponseViewer } from "./ResponseViewer";
import { KeyValueEditor } from "./KeyValueEditor";
import { UrlInput } from "./UrlInput";
import { MethodSelect } from "./MethodSelect";
import { SaveRequestModal } from "./SaveRequestModal";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useTabs } from "./tabs-context";
import { useEnv } from "@/features/env-context";
import { resolve, unresolvedVars } from "./resolve";
import type { ConfigTab, RequestTab } from "./types";
import type { Collection } from "@/lib/api/collections";

const CONFIG_TABS: ConfigTab[] = ["params", "headers", "body"];

interface RequestBuilderProps {
  tab: RequestTab;
  update: (patch: Partial<RequestTab>) => void;
  collectionId: string | null;
  collections: Collection[];
}

export function RequestBuilder({ tab, update, collectionId, collections }: RequestBuilderProps) {
  const { refreshAndExpand } = useTabs();
  const { activeVars } = useEnv();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  async function send() {
    if (!tab.url.trim()) {
      update({ error: "URL is empty", response: null });
      return;
    }
    update({ error: "", loading: true, response: null });

    // substitute {{vars}} from the active environment. The saved request keeps the
    // {{template}}; only this outbound call is resolved. SSRF re-validates server-side.
    const r = (s: string) => resolve(s, activeVars);
    const qs = tab.params
      .filter((p) => p.enabled && p.key.trim())
      .map((p) => `${encodeURIComponent(r(p.key))}=${encodeURIComponent(r(p.value))}`)
      .join("&");
    const base = r(tab.url.trim());
    const url = qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
    const headers = tab.headers
      .filter((h) => h.enabled && h.key.trim())
      .map((h) => ({ key: r(h.key), value: r(h.value), enabled: true }));

    try {
      const res = await sendRequest({ method: tab.method, url, headers, body: r(tab.body) });
      update({ response: res, loading: false });
    } catch (e) {
      update({ error: e instanceof Error ? e.message : "Request failed", loading: false });
    }
  }

  // create (new) or update (existing). targetCollectionId is only used for new requests.
  async function persist(targetCollectionId: string, name: string, description: string) {
    setSaving(true);
    setSaveError("");
    const payload = {
      name,
      description,
      method: tab.method,
      url: tab.url,
      params: tab.params,
      headers: tab.headers,
      body: { type: "json", content: tab.body },
    };
    try {
      const saved = tab.requestId
        ? await updateRequest(tab.requestId, payload)
        : await createRequest(targetCollectionId, payload);
      update({ requestId: saved.id, name: saved.name, description: saved.description });
      void refreshAndExpand(saved.collectionId); // make it show in the sidebar tree
      setSaveModalOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Saved tabs update silently; a brand-new tab opens the Save dialog (name/desc/collection).
  function onSaveClick() {
    if (tab.requestId) void persist("", tab.name, tab.description);
    else setSaveModalOpen(true);
  }

  // Ctrl/⌘+S to save — bind once, always call the latest closure via ref.
  const saveRef = useRef(onSaveClick);
  saveRef.current = onSaveClick;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const paramCount = tab.params.filter((p) => p.key.trim()).length;
  const headerCount = tab.headers.filter((h) => h.key.trim()).length;
  const missing = unresolvedVars(tab.url, activeVars);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* URL bar */}
      <div className="flex items-center gap-2 border-b border-ayu-line p-3">
        <MethodSelect value={tab.method} onChange={(m) => update({ method: m })} />
        <UrlInput
          value={tab.url}
          onChange={(v) => update({ url: v, error: "" })}
          onEnter={send}
          vars={activeVars}
          placeholder="https://api.example.com/users"
        />
        {missing.length > 0 && (
          <span className="shrink-0 text-xs text-amber-400" title={missing.map((v) => `{{${v}}}`).join(", ")}>
            {missing.length} unresolved
          </span>
        )}
        {saveError && !saveModalOpen && <span className="shrink-0 text-xs text-red-400">{saveError}</span>}
        <button
          onClick={send}
          disabled={tab.loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
        >
          {tab.loading ? "Sending…" : "Send"}
        </button>
        <button
          type="button"
          onClick={onSaveClick}
          disabled={saving}
          title="Save request (Ctrl/⌘+S)"
          className="flex items-center gap-1.5 rounded-lg border border-ayu-line px-3 py-2 text-sm text-zinc-300 transition hover:border-blue-500/40 hover:text-white disabled:opacity-60"
        >
          <Save className="size-4" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* request config + response — vertical resizable split (capped so neither side disappears) */}
      <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={55} minSize={25} className="flex min-h-0 flex-col">
          <div className="flex gap-4 border-b border-ayu-line px-3">
            {CONFIG_TABS.map((t) => {
              const count = t === "params" ? paramCount : t === "headers" ? headerCount : 0;
              return (
                <button
                  key={t}
                  onClick={() => update({ configTab: t })}
                  className={`px-3 py-2 text-sm capitalize transition cursor-pointer ${
                    tab.configTab === t ? "border-b-2 border-blue-500 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {t}
                  {count > 0 && <span className="ml-1 text-xs text-zinc-500">({count})</span>}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {tab.configTab === "params" && (
              <KeyValueEditor rows={tab.params} onChange={(rows) => update({ params: rows })} withDescription />
            )}
            {tab.configTab === "headers" && (
              <KeyValueEditor rows={tab.headers} onChange={(rows) => update({ headers: rows })} withDescription />
            )}
            {tab.configTab === "body" && (
              <textarea
                value={tab.body}
                onChange={(e) => update({ body: e.target.value })}
                placeholder='{ "key": "value" }'
                className="h-full min-h-32 w-full resize-none rounded-lg border border-ayu-line bg-white/[0.03] p-3 font-mono text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50"
              />
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-ayu-line" />

        <ResizablePanel defaultSize={45} minSize={15} className="min-h-0">
          <ResponseViewer response={tab.response} loading={tab.loading} error={tab.error} />
        </ResizablePanel>
      </ResizablePanelGroup>

      {saveModalOpen && (
        <SaveRequestModal
          collections={collections}
          defaultCollectionId={collectionId}
          initialName={tab.name}
          initialDescription={tab.description}
          saving={saving}
          error={saveError}
          onSave={(cid, name, description) => void persist(cid, name, description)}
          onClose={() => {
            setSaveModalOpen(false);
            setSaveError("");
          }}
        />
      )}
    </div>
  );
}
