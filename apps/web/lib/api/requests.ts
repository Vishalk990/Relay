import { api } from "@/lib/axios";
import type { HttpMethod, KeyValueRow } from "@/features/requests/types";

export type SavedRequest = {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: string;
};

export type SaveRequestPayload = {
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: { type: string; content: string }; // backend stores this JSONB shape
};

type ApiRequest = {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  method: string;
  url: string;
  params: KeyValueRow[] | null;
  headers: KeyValueRow[] | null;
  body: { type?: string; content?: string } | null;
};

function toSaved(r: ApiRequest): SavedRequest {
  return {
    id: r.id,
    collectionId: r.collectionId,
    name: r.name,
    description: r.description ?? "",
    method: r.method as HttpMethod,
    url: r.url,
    params: r.params ?? [],
    headers: r.headers ?? [],
    body: r.body?.content ?? "", // unwrap { type, content } → raw string
  };
}

export async function listRequests(collectionId: string): Promise<SavedRequest[]> {
  const { data } = await api.get<{ requests: ApiRequest[] | null }>(`/collections/${collectionId}/requests`);
  return (data.requests ?? []).map(toSaved);
}

export async function createRequest(collectionId: string, payload: SaveRequestPayload): Promise<SavedRequest> {
  const { data } = await api.post<{ request: ApiRequest }>(`/collections/${collectionId}/requests`, payload);
  return toSaved(data.request);
}

export async function updateRequest(id: string, payload: SaveRequestPayload): Promise<SavedRequest> {
  const { data } = await api.patch<{ request: ApiRequest }>(`/requests/${id}`, payload);
  return toSaved(data.request);
}

export async function deleteRequest(id: string): Promise<void> {
  await api.delete(`/requests/${id}`);
}
