import type { User } from "@/lib/api/auth";
import { UserMenu } from "./UserMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

// Server component — renders the fetched user. The interactive account menu
// (hover popup + logout) is the only client island.
export function TopBar({ user }: { user: User | null }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 bg-ayu-panel px-5">
      {/* brand — left */}
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-blue-500 text-sm font-bold text-white">R</span>
        <span className="text-sm font-semibold tracking-[0.2em] text-blue-400/80 uppercase">Relay</span>
      </div>

      {/* workspace controls + account — right */}
      <div className="flex items-center gap-3">
        <WorkspaceSwitcher />
        <div className="h-6 w-px bg-white/10" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
