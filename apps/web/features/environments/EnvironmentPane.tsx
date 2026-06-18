"use client";

import { useEffect, useState } from "react";
import { KeyValueEditor } from "@/features/requests/KeyValueEditor";
import { useEnv } from "@/features/env-context";
import { updateEnvironment, type Variable } from "@/lib/api/environments";
import type { EnvTab, KeyValueRow } from "@/features/requests/types";

let seq = 0;
// Variable (api) ↔ KeyValueRow (editor). The row carries id + description that the
// api doesn't need, so we add them on load and drop them on save.
const toRow = (v: Variable): KeyValueRow => ({ id: `ev${seq++}`, key: v.key, value: v.value, description: "", enabled: v.enabled });
const blankRow = (): KeyValueRow => ({ id: `ev${seq++}`, key: "", value: "", description: "", enabled: true });
const toVars = (rows: KeyValueRow[]): Variable[] =>
  rows.filter((r) => r.key.trim()).map((r) => ({ key: r.key.trim(), value: r.value, enabled: r.enabled }));

export function EnvironmentPane({ tab }: { tab: EnvTab }) {
  const { environments, reload } = useEnv();
  const env = environments.find((e) => e.id === tab.envId);

  const [rows, setRows] = useState<KeyValueRow[]>([blankRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Seed the variables when this tab points at a different environment. The env
  // name + lifecycle (rename/delete) live in the sidebar, so the pane is vars-only.
  useEffect(() => {
    setRows(env && env.variables.length ? env.variables.map(toRow) : [blankRow()]);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.envId]);

  async function handleSave() {
    if (!env) return;
    setSaving(true);
    setError("");
    try {
      await updateEnvironment(env.id, env.name, toVars(rows));
      await reload();
    } catch {
      setError("Couldn't save environment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-3 text-xs text-zinc-500">
          Variables here can be used anywhere as <code className="text-emerald-400">{"{{key}}"}</code>.
        </p>
        <KeyValueEditor rows={rows} onChange={setRows} />
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-ayu-line px-3 py-2.5">
        {error && <span className="mr-auto text-xs text-red-400">{error}</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
