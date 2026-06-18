"use client";

import { Trash2 } from "lucide-react";
import type { KeyValueRow } from "./types";

let seq = 0;
const blankRow = (): KeyValueRow => ({ id: `kv${seq++}`, key: "", value: "", description: "", enabled: true });

interface KeyValueEditorProps {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  withDescription?: boolean;
}

export function KeyValueEditor({ rows, onChange, withDescription = false }: KeyValueEditorProps) {
  const patch = (id: string, p: Partial<KeyValueRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const add = () => onChange([...rows, blankRow()]);

  const cell =
    "flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600";

  return (
    <div className="overflow-hidden rounded-md border border-ayu-line">
      {/* column headers */}
      <div className="flex items-center gap-2 border-b border-ayu-line bg-white/[0.02] px-2 py-1.5 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
        <span className="w-4" />
        <span className="flex-1">Key</span>
        <span className="flex-1">Value</span>
        {withDescription && <span className="flex-1">Description</span>}
        <span className="w-5" />
      </div>

      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2 border-b border-ayu-line/60 px-2 py-1 last:border-b-0">
          <input
            type="checkbox"
            checked={r.enabled}
            onChange={(e) => patch(r.id, { enabled: e.target.checked })}
            className="accent-blue-500"
          />
          <input value={r.key} onChange={(e) => patch(r.id, { key: e.target.value })} placeholder="Key" className={cell} />
          <input value={r.value} onChange={(e) => patch(r.id, { value: e.target.value })} placeholder="Value" className={cell} />
          {withDescription && (
            <input
              value={r.description}
              onChange={(e) => patch(r.id, { description: e.target.value })}
              placeholder="Description"
              className={cell}
            />
          )}
          <button onClick={() => remove(r.id)} className="text-zinc-600 transition hover:text-red-400 cursor-pointer" title="Remove row">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}

      <button onClick={add} className="w-full px-2 py-1.5 text-left text-xs font-medium text-blue-400 transition hover:text-blue-300">
        + Add row
      </button>
    </div>
  );
}
