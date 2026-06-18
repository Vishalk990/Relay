export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export type KeyValueRow = {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
};

export type ConfigTab = "params" | "headers" | "body";

export type ResponseData = {
  status: number;
  statusText: string;
  durationMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  body: string;
};

export type RequestTab = {
  kind: "request";
  id: string;
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: string;
  configTab: ConfigTab;
  response: ResponseData | null;
  loading: boolean;
  error: string;
  requestId?: string;
};

// An environment opened in the tab area. envId is null for an unsaved new env.
export type EnvTab = {
  kind: "environment";
  id: string;
  envId: string | null;
  name: string;
};

// A tab can hold either a request builder or an environment editor.
export type Tab = RequestTab | EnvTab;
