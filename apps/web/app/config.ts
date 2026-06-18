export const NAV_ITEMS: string[] = ["Features", "Docs"];

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  throw new Error("BACKEND_URL is not set");
}
export const BACKEND_URL: string = backendUrl;
