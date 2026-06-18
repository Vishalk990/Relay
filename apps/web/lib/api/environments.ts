import { api } from "../axios";

export type Variable = {
  key: string;
  value: string;
  enabled: boolean;
};

export type Environment = {
  id: string;
  workspaceId: string;
  name: string;
  variables: Variable[];
};
type ApiEnv = { id: string; workspaceId: string; name: string; variables: Variable[] | null };
const toEnv = (e: ApiEnv): Environment => ({ ...e, variables: e.variables ?? [] });

export async function listEnvironments(workspaceId: string): Promise<Environment[]> {
  const { data } = await api.get<{ environments: ApiEnv[] | null }>(`/workspaces/${workspaceId}/environments`);
  return (data.environments ?? []).map(toEnv);
}

export async function createEnvironment(workspaceId: string, name: string, variables: Variable[]) {
  const { data } = await api.post<{ environment: ApiEnv }>(`/workspaces/${workspaceId}/environments`, { name, variables });
  return toEnv(data.environment);
}
export async function updateEnvironment(id: string, name: string, variables: Variable[]) {
  const { data } = await api.patch<{ environment: ApiEnv }>(`/environments/${id}`, { name, variables });
  return toEnv(data.environment);
}
export async function deleteEnvironment(id: string): Promise<void> {
  await api.delete(`/environments/${id}`);
}
