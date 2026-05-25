const adminPanelPath = (
  process.env.ADMIN_PANEL_PATH ||
  process.env.NEXT_PUBLIC_ADMIN_PANEL_PATH ||
  "k9v-m2x7-q4p1-n8w3"
)
  .trim()
  .replace(/^\/+|\/+$/g, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["geoip-lite"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async rewrites() {
    return [
      { source: `/${adminPanelPath}`, destination: "/admin" },
      { source: `/${adminPanelPath}/:path*`, destination: "/admin/:path*" },
      { source: `/api/${adminPanelPath}/:path*`, destination: "/api/admin/:path*" },
    ];
  },
};

export default nextConfig;
