/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ciuna/shared", "@ciuna/rate-sync"],
  compress: true,
  reactStrictMode: true,
}

export default nextConfig
