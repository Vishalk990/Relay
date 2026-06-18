import { api } from "@/lib/axios";
import type { Workspace } from "@/features/workspaces/types";

type ApiWorkspace = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
};

function toWorkspace(w: ApiWorkspace): Workspace {
  return { id: w.id, name: w.name, createdAt: w.created_at.slice(0, 10), collections: 0, requests: 0 };
}


export async function listWorkspaces(): Promise<Workspace[]> {
  const { data } = await api.get<{ workspaces: ApiWorkspace[] | null }>("/workspaces");
  return (data.workspaces ?? []).map(toWorkspace);
}


export async function createWorkspace(name: string): Promise<Workspace> {
  const { data } = await api.post<{ workspace: ApiWorkspace }>("/workspaces", { name });
  return toWorkspace(data.workspace);
}

export async function updateWorkspace(id: string, name: string): Promise<Workspace> {
  const { data } = await api.patch<{ workspace: ApiWorkspace }>(`/workspaces/${id}`, { name });
  return toWorkspace(data.workspace);
}

export async function deleteWorkspace(id: string): Promise<void> {
  await api.delete(`/workspaces/${id}`);
}
