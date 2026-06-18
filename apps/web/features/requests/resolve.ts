// {{ token }} → its value. WHY return `full` (the literal {{x}}) when unknown:
// matches Postman — an undefined variable stays visible so the user sees what's
// missing, instead of silently sending an empty string and getting a confusing 404.
export function resolve(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w.$-]+)\s*\}\}/g, (full, key: string) => (key in vars ? vars[key] : full));
}

// Tokens in the template that have no value in the active env — drives the warning.
export function unresolvedVars(template: string, vars: Record<string, string>): string[] {
  const out = new Set<string>();
  for (const m of template.matchAll(/\{\{\s*([\w.$-]+)\s*\}\}/g)) {
    if (!(m[1] in vars)) out.add(m[1]);
  }
  return [...out];
}
