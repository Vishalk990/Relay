"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LogOut } from "lucide-react";
import { logout, type User } from "@/lib/api/auth";

function initials(user: User | null): string {
  const base = user?.username || user?.email || "?";
  return base[0].toUpperCase();
}

export function UserMenu({ user }: { user: User | null }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {}
    window.location.href = "/sign-in";
  }

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={80}
        closeDelay={150}
        render={<button className="rounded-full outline-none ring-blue-500/40 focus-visible:ring-2" />}
      >
        <Avatar className="size-8 cursor-pointer border border-white/10">
          <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">{initials(user)}</AvatarFallback>
        </Avatar>
      </HoverCardTrigger>

      <HoverCardContent align="end" className="w-64 p-0">
        {/* profile */}
        <div className="flex items-center gap-3 p-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">{initials(user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user?.username ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
          </div>
        </div>

        {/* actions */}
        <div className="border-t border-border p-2">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="size-4" />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
