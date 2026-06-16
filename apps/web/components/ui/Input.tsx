import React from "react";

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      <input
        {...props}
        className="rounded-lg border border-white/10 bg-white/3 px-3.5 py-2.5 text-sm text-white
      placeholder:text-zinc-600 outline-none transition focus:border-blue-500/50 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  );
}
