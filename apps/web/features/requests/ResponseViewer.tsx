"use client";

import { useState } from "react";
import { JsonView } from "./JsonView";
import type { ResponseData } from "./types";

const statusColor = (s: number) =>
  s >= 200 && s < 300 ? "text-emerald-400" : s >= 300 && s < 400 ? "text-blue-400" : s >= 400 ? "text-red-400" : "text-zinc-400";
const fmtSize = (b: number) => (b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`);

interface ResponseViewerProps {
  response: ResponseData | null;
  loading: boolean;
  error: string;
}

export function ResponseViewer({ response, loading, error }: ResponseViewerProps) {
  const [tab, setTab] = useState<"body" | "headers">("body");

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* status / meta bar */}
      <div className="flex items-center gap-4 border-b border-ayu-line bg-ayu-panel px-3 py-2 text-sm">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">Response</span>
        {response && (
          <>
            <span className={`font-semibold ${statusColor(response.status)}`}>
              {response.status} {response.statusText}
            </span>
            <span className="text-zinc-500">{response.durationMs} ms</span>
            <span className="text-zinc-500">{fmtSize(response.sizeBytes)}</span>
            <div className="ml-auto flex gap-1">
              {(["body", "headers"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded px-2.5 py-1 text-xs capitalize ${tab === t ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* content */}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {loading ? (
          <p className="text-sm text-zinc-500">Sending…</p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : !response ? (
          <p className="text-sm text-zinc-600">Send a request to see the response.</p>
        ) : tab === "body" ? (
          <JsonView text={response.body} />
        ) : (
          <div className="space-y-1">
            {Object.entries(response.headers).map(([k, v]) => (
              <div key={k} className="flex gap-2 font-mono text-xs">
                <span className="text-blue-400">{k}:</span>
                <span className="text-zinc-300">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
