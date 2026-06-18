"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  listRequests,
  updateRequest as apiUpdateRequest,
  deleteRequest as apiDeleteRequest,
  type SavedRequest,
} from "@/lib/api/requests";
import type { EnvTab, KeyValueRow, RequestTab, Tab } from "./types";

let tabSeq = 0;
let rowSeq = 0;
const emptyRow = (): KeyValueRow => ({ id: `r${rowSeq++}`, key: "", value: "", description: "", enabled: true });

function makeTab(): RequestTab {
  return {
    kind: "request",
    id: `tab${tabSeq++}`,
    name: "",
    description: "",
    method: "GET",
    url: "",
    params: [emptyRow()],
    headers: [emptyRow()],
    body: "",
    configTab: "params",
    response: null,
    loading: false,
    error: "",
  };
}

function savedToTab(r: SavedRequest): RequestTab {
  return {
    kind: "request",
    id: `tab${tabSeq++}`,
    name: r.name,
    description: r.description,
    method: r.method,
    url: r.url,
    params: r.params.length ? r.params : [emptyRow()],
    headers: r.headers.length ? r.headers : [emptyRow()],
    body: r.body,
    configTab: "params",
    response: null,
    loading: false,
    error: "",
    requestId: r.id,
  };
}

type TabsContextValue = {
  // open tabs
  tabs: Tab[];
  activeId: string;
  setActive: (id: string) => void;
  openNew: () => void;
  openSaved: (r: SavedRequest) => void;
  openEnvironment: (env: { envId: string | null; name: string }) => void;
  updateTab: (id: string, patch: Partial<RequestTab>) => void;
  updateEnvTab: (id: string, patch: Partial<EnvTab>) => void;
  closeTab: (id: string) => void;
  // sidebar tree: collection id → its requests
  requestsByCollection: Record<string, SavedRequest[]>;
  expanded: Record<string, boolean>;
  toggleCollection: (id: string) => void;
  loadRequests: (collectionId: string) => Promise<void>;
  // request actions (used after save + from the tree)
  refreshAndExpand: (collectionId: string) => Promise<void>;
  renameRequest: (r: SavedRequest, name: string) => Promise<void>;
  deleteRequest: (r: SavedRequest) => Promise<void>;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used within <TabsProvider>");
  return ctx;
}

export function TabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>(() => [makeTab()]);
  const [activeId, setActiveId] = useState<string>(() => tabs[0].id);
  const [requestsByCollection, setRBC] = useState<Record<string, SavedRequest[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // patches only apply to request tabs; env tabs are left untouched.
  const updateTab = useCallback((id: string, patch: Partial<RequestTab>) => {
    setTabs((ts) => ts.map((t) => (t.id === id && t.kind === "request" ? { ...t, ...patch } : t)));
  }, []);

  const updateEnvTab = useCallback((id: string, patch: Partial<EnvTab>) => {
    setTabs((ts) => ts.map((t) => (t.id === id && t.kind === "environment" ? { ...t, ...patch } : t)));
  }, []);

  const openNew = useCallback(() => {
    const t = makeTab();
    setTabs((ts) => [...ts, t]);
    setActiveId(t.id);
  }, []);

  const openSaved = useCallback((r: SavedRequest) => {
    setTabs((ts) => {
      const existing = ts.find((t) => t.kind === "request" && t.requestId === r.id);
      if (existing) {
        setActiveId(existing.id);
        return ts;
      }
      const t = savedToTab(r);
      setActiveId(t.id);
      return [...ts, t];
    });
  }, []);

  // Open an environment in the tab area. Reuses an already-open tab for the same
  // env (envId), so a given environment — or the single "new" tab — opens once.
  const openEnvironment = useCallback((env: { envId: string | null; name: string }) => {
    setTabs((ts) => {
      const existing = ts.find((t) => t.kind === "environment" && t.envId === env.envId);
      if (existing) {
        setActiveId(existing.id);
        return ts;
      }
      const t: EnvTab = { kind: "environment", id: `tab${tabSeq++}`, envId: env.envId, name: env.name };
      setActiveId(t.id);
      return [...ts, t];
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      setActiveId((cur) => {
        if (cur !== id) return cur; // closing a background tab keeps focus
        if (next.length === 0) return ""; // all tabs closed → empty state
        const idx = prev.findIndex((t) => t.id === id);
        return (next[idx] ?? next[idx - 1] ?? next[0]).id;
      });
      return next;
    });
  }, []);

  const loadRequests = useCallback(async (collectionId: string) => {
    const reqs = await listRequests(collectionId);
    setRBC((m) => ({ ...m, [collectionId]: reqs }));
  }, []);

  const toggleCollection = useCallback(
    (id: string) => {
      setExpanded((m) => {
        const open = !m[id];
        if (open && !(id in requestsByCollection)) void loadRequests(id); // lazy-load on first expand
        return { ...m, [id]: open };
      });
    },
    [requestsByCollection, loadRequests],
  );

  // after a save: make sure the collection is expanded and its list is fresh
  const refreshAndExpand = useCallback(
    async (collectionId: string) => {
      setExpanded((m) => ({ ...m, [collectionId]: true }));
      await loadRequests(collectionId);
    },
    [loadRequests],
  );

  const renameRequest = useCallback(
    async (r: SavedRequest, name: string) => {
      await apiUpdateRequest(r.id, {
        name,
        description: r.description,
        method: r.method,
        url: r.url,
        params: r.params,
        headers: r.headers,
        body: { type: "json", content: r.body },
      });
      await loadRequests(r.collectionId);
      setTabs((ts) => ts.map((t) => (t.kind === "request" && t.requestId === r.id ? { ...t, name } : t)));
    },
    [loadRequests],
  );

  const deleteRequest = useCallback(
    async (r: SavedRequest) => {
      await apiDeleteRequest(r.id);
      await loadRequests(r.collectionId);
      // close any open tab pointing at the deleted request
      setTabs((prev) => {
        const next = prev.filter((t) => !(t.kind === "request" && t.requestId === r.id));
        if (next.length === prev.length) return prev;
        setActiveId((cur) => {
          const curTab = prev.find((t) => t.id === cur);
          if (!(curTab?.kind === "request" && curTab.requestId === r.id)) return cur;
          return next.length === 0 ? "" : next[0].id;
        });
        return next;
      });
    },
    [loadRequests],
  );

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeId,
        setActive: setActiveId,
        openNew,
        openSaved,
        openEnvironment,
        updateTab,
        updateEnvTab,
        closeTab,
        requestsByCollection,
        expanded,
        toggleCollection,
        loadRequests,
        refreshAndExpand,
        renameRequest,
        deleteRequest,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
}
