/** Default slug — change via ADMIN_PANEL_PATH / NEXT_PUBLIC_ADMIN_PANEL_PATH */
const DEFAULT_ADMIN_PATH = "k9v-m2x7-q4p1-n8w3";

function normalizeAdminPath(raw: string | undefined): string {
  const slug = (raw?.trim() || DEFAULT_ADMIN_PATH).replace(/^\/+|\/+$/g, "");
  if (!/^[a-z0-9][a-z0-9-]{11,80}$/i.test(slug)) {
    return DEFAULT_ADMIN_PATH;
  }
  return slug.toLowerCase();
}

export function getAdminPanelPath() {
  return normalizeAdminPath(
    process.env.ADMIN_PANEL_PATH || process.env.NEXT_PUBLIC_ADMIN_PANEL_PATH,
  );
}

export function getAdminPanelHref() {
  return `/${getAdminPanelPath()}`;
}

export function getAdminApiBase() {
  return `/api/${getAdminPanelPath()}`;
}

export function isAdminPanelPathname(pathname: string) {
  const href = getAdminPanelHref();
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isLegacyAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isLegacyAdminApiPath(pathname: string) {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}
