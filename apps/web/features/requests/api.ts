import { api } from "@/lib/axios";
import type { ResponseData } from "./types";

export type SendPayload = {
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  body: string;
};

export async function sendRequest(payload: SendPayload): Promise<ResponseData> {
  const { data } = await api.post<ResponseData>("/requests/send", payload);
  return data;
}
