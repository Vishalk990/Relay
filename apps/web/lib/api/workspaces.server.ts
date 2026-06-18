import { serverFetch } from "@/lib/api/server";
import type { Workspace } from "@/features/workspaces/types";

type ApiWorkspace = { id: string; owner_id: string; name: string; created_at: string };

export async function listWorkspacesServer(): Promise<Workspace[]> {
  const data = await serverFetch<{ workspaces: ApiWorkspace[] | null }>("/api/workspaces");
  return (data?.workspaces ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    createdAt: w.created_at.slice(0, 10),
    collections: 0,
    requests: 0,
  }));
}
