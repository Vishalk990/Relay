"use client";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Ayu-ish JSON syntax colors. Content is HTML-escaped first, so injecting spans
// is safe (no XSS from response bodies).
function highlightJson(pretty: string): string {
  return escapeHtml(pretty).replace(
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "text-amber-300"; // number
      if (/^"/.test(match)) {
        cls = /:\s*$/.test(match) ? "text-sky-400" : "text-lime-300"; // key vs string
      } else if (match === "true" || match === "false") {
        cls = "text-purple-300";
      } else if (match === "null") {
        cls = "text-zinc-500";
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}

// Pretty-prints + color-codes JSON. Falls back to plain text for non-JSON bodies.
export function JsonView({ text }: { text: string }) {
  let pretty: string;
  try {
    pretty = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return <pre className="font-mono text-sm whitespace-pre-wrap text-zinc-200">{text}</pre>;
  }
  return (
    <pre
      className="font-mono text-sm whitespace-pre-wrap text-zinc-400"
      dangerouslySetInnerHTML={{ __html: highlightJson(pretty) }}
    />
  );
}
