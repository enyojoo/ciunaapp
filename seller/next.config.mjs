/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ciuna/shared", "@ciuna/ui-web"],
  reactStrictMode: true,
  compress: true,
  images: { unoptimized: true },
  experimental: { optimizePackageImports: ["lucide-react"] },
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ]
  },
}

export default nextConfig
