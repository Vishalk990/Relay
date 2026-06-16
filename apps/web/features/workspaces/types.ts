// Mock-data shape for the workspaces dashboard. Mirror this to the backend's
// workspace model when wiring real endpoints (GET/POST /api/workspaces).
export type Workspace = {
  id: string;
  name: string;
  createdAt: string; // YYYY-MM-DD
  collections: number;
  requests: number;
};
