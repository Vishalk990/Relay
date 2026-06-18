import type { HttpMethod } from "./types";

export const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

// Text color per method — used on the method-select trigger and the tab labels.
export const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
  HEAD: "text-cyan-400",
  OPTIONS: "text-pink-400",
};

// Background dot per method — keeps color identity in the menu even when the
// row's text flips to the accent color on hover/focus.
export const METHOD_DOT: Record<HttpMethod, string> = {
  GET: "bg-emerald-400",
  POST: "bg-amber-400",
  PUT: "bg-blue-400",
  PATCH: "bg-purple-400",
  DELETE: "bg-red-400",
  HEAD: "bg-cyan-400",
  OPTIONS: "bg-pink-400",
};
