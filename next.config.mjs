/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["geoip-lite"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
