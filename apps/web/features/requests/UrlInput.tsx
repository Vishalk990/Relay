"use client";

import { useRef, type ReactNode } from "react";

// Render the URL as colored segments: {{token}} → green if defined in the active
// env, amber if not; everything else in normal text.
function highlight(value: string, vars: Record<string, string>): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\{\{\s*([\w.$-]+)\s*\}\}/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    if (m.index > last) out.push(<span key={i++}>{value.slice(last, m.index)}</span>);
    const known = m[1] in vars;
    out.push(
      <span key={i++} className={known ? "text-emerald-400" : "text-amber-400"}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < value.length) out.push(<span key={i++}>{value.slice(last)}</span>);
  return out;
}

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  vars: Record<string, string>;
  placeholder?: string;
}

// Padding/size/border must match between the backdrop and the input so the
// colored text lines up exactly under the (transparent-text) input.
const SHARED = "w-full rounded-lg px-3.5 py-2 text-sm";

export function UrlInput({ value, onChange, onEnter, vars, placeholder }: UrlInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // keep the backdrop's horizontal scroll in sync with the input as you type past the edge
  function syncScroll() {
    if (backdropRef.current && inputRef.current) {
      backdropRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  }

  return (
    <div className="relative flex-1">
      {/* backdrop: the visible, colored text (border transparent → same box as input) */}
      <div
        ref={backdropRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 overflow-hidden border border-transparent whitespace-pre text-white ${SHARED}`}
      >
        {value ? highlight(value, vars) : <span className="text-zinc-600">{placeholder}</span>}
      </div>
      {/* input on top: transparent text (caret stays visible), faint bg shows the backdrop through */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        placeholder={placeholder}
        spellCheck={false}
        // inline caretColor: text-transparent also hides the caret unless we force it
        style={{ caretColor: "#fff" }}
        className={`relative border border-ayu-line bg-white/[0.03] text-transparent placeholder:text-transparent outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 ${SHARED}`}
      />
    </div>
  );
}
