"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  listEnvironments,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  type Environment,
} from "@/lib/api/environments";


type EnvContextValue = {
  environments: Environment[];
  activeEnvId: string | null;
  setActiveEnvId: (id: string | null) => void;
  activeVars: Record<string, string>; // {key: value} of the active env's ENABLED vars
  reload: () => Promise<void>;
  createEnv: (name: string) => Promise<Environment>;
  renameEnv: (env: Environment, name: string) => Promise<void>;
  deleteEnv: (id: string) => Promise<void>;
};

const EnvContext = createContext<EnvContextValue | null>(null);
export const useEnv = () => {
  const c = useContext(EnvContext);
  if (!c) throw new Error("useEnv must be used within <EnvProvider>");
  return c;
};

export function EnvProvider({ workspaceId, children }: { workspaceId: string | null; children: ReactNode }) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvId, setActiveEnvIdState] = useState<string | null>(null);


  const storageKey = workspaceId ? `relay_active_env_${workspaceId}` : null;
  const setActiveEnvId = useCallback(
    (id: string | null) => {
      setActiveEnvIdState(id);
      if (storageKey) {
        if (id) localStorage.setItem(storageKey, id);
        else localStorage.removeItem(storageKey);
      }
    },
    [storageKey],
  );

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setEnvironments([]);
      return;
    }
    setEnvironments(await listEnvironments(workspaceId));
  }, [workspaceId]);


  useEffect(() => {
    void reload();
    setActiveEnvIdState(storageKey ? localStorage.getItem(storageKey) : null);
  }, [reload, storageKey]);
  
  const activeVars = useMemo(() => {
    const env = environments.find((e) => e.id === activeEnvId);
    const map: Record<string, string> = {};
    env?.variables.filter((v) => v.enabled && v.key.trim()).forEach((v) => (map[v.key] = v.value));
    return map;
  }, [environments, activeEnvId]);

  const createEnv = useCallback(
    async (name: string) => {
      if (!workspaceId) throw new Error("no workspace selected");
      const env = await createEnvironment(workspaceId, name, []);
      await reload();
      return env;
    },
    [workspaceId, reload],
  );

  // keep existing variables; only the name changes (vars are edited in the tab).
  const renameEnv = useCallback(
    async (env: Environment, name: string) => {
      await updateEnvironment(env.id, name, env.variables);
      await reload();
    },
    [reload],
  );

  const deleteEnv = useCallback(
    async (id: string) => {
      await deleteEnvironment(id);
      if (activeEnvId === id) setActiveEnvId(null);
      await reload();
    },
    [reload, activeEnvId, setActiveEnvId],
  );

  return (
    <EnvContext.Provider
      value={{ environments, activeEnvId, setActiveEnvId, activeVars, reload, createEnv, renameEnv, deleteEnv }}
    >
      {children}
    </EnvContext.Provider>
  );
}
