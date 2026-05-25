import { timingSafeEqualString } from "./secrets";

const WEAK_ADMIN_SECRETS = new Set([
  "",
  "change-me-to-a-long-random-string",
  "changeme",
  "admin",
  "secret",
]);

export function isAdminAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret || WEAK_ADMIN_SECRETS.has(secret)) return false;

  const header = request.headers.get("x-admin-secret")?.trim();
  if (!header) return false;

  return timingSafeEqualString(header, secret);
}
