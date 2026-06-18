import { api } from "@/lib/axios";

export type User = {
  id: string;
  username: string;
  email: string;
};

export async function signUp(input: {
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  const { data } = await api.post<{ user: User }>("/auth/sign-up", input);
  return data.user;
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<User> {
  const { data } = await api.post<{ user: User }>("/auth/login", input);
  return data.user;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
