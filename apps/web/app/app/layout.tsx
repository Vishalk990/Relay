import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/auth.server";
import { listWorkspacesServer } from "@/lib/api/workspaces.server";
import { TopBar } from "@/features/app/TopBar";
import { WorkspaceProvider } from "@/features/workspaces/workspace-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getMeServer();
  if (!user) redirect("/sign-in");
  const initialWorkspaces = await listWorkspacesServer();

  return (
    <WorkspaceProvider initialWorkspaces={initialWorkspaces}>
      <div className="flex h-screen flex-col bg-ayu-bg font-sans text-zinc-200">
        <TopBar user={user} />
        <div className="flex min-h-0 flex-1">{children}</div>
      </div>
    </WorkspaceProvider>
  );
}
