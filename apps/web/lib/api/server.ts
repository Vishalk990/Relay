import { cookies } from "next/headers";
import { BACKEND_URL } from "@/app/config";


export async function serverFetch<T>(path: string): Promise<T | null> {
  const jar = await cookies();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { cookie: jar.toString() },
    cache: "no-store",
  });
  return res.ok ? ((await res.json()) as T) : null;
}
