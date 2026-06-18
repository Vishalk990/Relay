import { api } from "@/lib/axios";

export type Collection = {
  id: string;
  name: string;
  parentId: string | null;
};

type ApiCollection = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  position: number;
  created_at: string;
};

const toCollection = (c: ApiCollection): Collection => ({
  id: c.id,
  name: c.name,
  parentId: c.parent_id,
});

export async function listCollections(workspaceId: string): Promise<Collection[]> {
  const { data } = await api.get<{ collections: ApiCollection[] | null }>("/collections", {
    params: { workspaceId },
  });
  return (data.collections ?? []).map(toCollection);
}

export async function createCollection(workspaceId: string, name: string): Promise<Collection> {
  const { data } = await api.post<{ collection: ApiCollection }>("/collections", {
    workspaceId,
    parentId: "",
    name,
  });
  return toCollection(data.collection);
}
