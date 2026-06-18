import type { User } from "@/lib/api/auth";
import { serverFetch } from "@/lib/api/server";

export async function getMeServer(): Promise<User | null> {
  const data = await serverFetch<{ user: User }>("/auth/me");
  return data?.user ?? null;
}
