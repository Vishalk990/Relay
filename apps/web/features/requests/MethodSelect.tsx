"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { METHODS, METHOD_COLOR, METHOD_DOT } from "./methods";
import type { HttpMethod } from "./types";

interface MethodSelectProps {
  value: HttpMethod;
  onChange: (m: HttpMethod) => void;
}

// Custom color-coded method picker — replaces the unstylable native <select>.
export function MethodSelect({ value, onChange }: MethodSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            title="HTTP method"
            className="flex w-28 shrink-0 items-center gap-2 rounded-lg border border-ayu-line bg-white/[0.03] px-3 py-2 text-sm font-semibold outline-none transition hover:border-blue-500/40 data-popup-open:border-blue-500/50"
          />
        }
      >
        <span className={`size-1.5 rounded-full ${METHOD_DOT[value]}`} />
        <span className={METHOD_COLOR[value]}>{value}</span>
        <ChevronDown className="ml-auto size-3.5 text-zinc-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32 min-w-32">
        {METHODS.map((m) => (
          <DropdownMenuItem key={m} onClick={() => onChange(m)} className="gap-2">
            <span className={`size-1.5 rounded-full ${METHOD_DOT[m]}`} />
            <span className={`font-semibold ${METHOD_COLOR[m]}`}>{m}</span>
            {m === value && <Check className="ml-auto size-3.5 text-zinc-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
