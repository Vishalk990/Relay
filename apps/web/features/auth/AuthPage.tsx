"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GithubIcon, GoogleIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { isAxiosError } from "axios";
import { signIn, signUp } from "@/lib/api/auth";

interface AuthPageProps {
  isSignIn: boolean;
}

export function AuthPage({ isSignIn }: AuthPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [oauth, setOauth] = useState<"google" | "github" | null>(null);
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  function startOauth(provider: "google" | "github") {
    setOauth(provider);
    window.location.href = `/api/auth/${provider}/login`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignIn) {
        await signIn({ email, password });
      } else {
        await signUp({ username, email, password });
      }
      router.push("/app");
    } catch (err) {
      const message =
        (isAxiosError(err) && (err.response?.data?.message as string)) ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black font-sans">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-112 w-176 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative w-full max-w-md px-6">
        <div className="rounded-2xl border border-white/10 bg-white/3 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur">
          <h1 className="bg-linear-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-2xl font-semibold text-transparent">
            {isSignIn ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {isSignIn ? "Sign in to pick up where you left off." : "Join Relay and start building requests."}
          </p>
          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={() => startOauth("google")}
              disabled={oauth !== null}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-blue-500/40 hover:bg-white/[0.06] disabled:opacity-60"
            >
              <GoogleIcon className="h-4 w-4" />
              {oauth === "google" ? "Redirecting…" : "Continue with Google"}
            </button>
            <button
              type="button"
              onClick={() => startOauth("github")}
              disabled={oauth !== null}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-blue-500/40 hover:bg-white/[0.06] disabled:opacity-60"
            >
              <GithubIcon className="h-4 w-4" />
              {oauth === "github" ? "Redirecting…" : "Continue with GitHub"}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="johndoe@gmail.com"
              required
            />
            {!isSignIn && (
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                required
              />
            )}
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-500">
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {loading ? "Please wait…" : isSignIn ? "Sign in" : "Sign up"}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          {isSignIn ? "New to Relay?" : "Already have an account?"}{" "}
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="font-medium text-blue-400 transition hover:text-blue-300"
          >
            {isSignIn ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </div>
    </main>
  );
}
