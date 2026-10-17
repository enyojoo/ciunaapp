/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ciuna/shared", "@ciuna/rate-sync"],
  // Enable Turbopack for Next.js 15 (already enabled via --turbo flag in dev script)
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },
  // Enable React strict mode for better development
  reactStrictMode: true,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Configure headers for static assets (Next.js 16 approach)
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      /** Experts catalog + booking UI — avoid CDN caching HTML (client + auth-sensitive flows). */
      {
        source: '/experts',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/experts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.(jpg|jpeg|png|gif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  async redirects() {
    return [
      /** Legacy transaction detail URL; detail UI lives under `/hub/orders/[id]` only. */
      { source: "/send/:id", destination: "/hub/orders/:id", permanent: true },
      /** Food/Mart moved off `/hub/{slug}` to `/{slug}`. */
      { source: "/hub/food", destination: "/food", permanent: true },
      { source: "/hub/food/:path*", destination: "/food/:path*", permanent: true },
      { source: "/hub/mart", destination: "/mart", permanent: true },
      { source: "/hub/mart/:path*", destination: "/mart/:path*", permanent: true },
      /** Marketplace aliases (catalog lives on line home; stores directory is `/stores`). */
      { source: "/food/vendors", destination: "/food/stores", permanent: false },
      { source: "/food/vendors/", destination: "/food/stores", permanent: false },
      { source: "/food/products", destination: "/food", permanent: false },
      { source: "/food/products/", destination: "/food", permanent: false },
      { source: "/mart/vendors", destination: "/mart/stores", permanent: false },
      { source: "/mart/vendors/", destination: "/mart/stores", permanent: false },
      { source: "/mart/products", destination: "/mart", permanent: false },
      { source: "/mart/products/", destination: "/mart", permanent: false },
      /** Expert catalog + profiles under `/experts/*` (no `/hub/experts`). */
      { source: "/hub/experts", destination: "/experts", permanent: true },
      { source: "/hub/experts/", destination: "/experts", permanent: true },
      { source: "/hub/experts/checkout", destination: "/experts/checkout", permanent: true },
      { source: "/hub/experts/checkout/:slotId", destination: "/experts/checkout/:slotId", permanent: true },
      { source: "/hub/experts/:id/book", destination: "/experts/:id/book", permanent: true },
      { source: "/hub/experts/:id", destination: "/experts/:id", permanent: true },
      { source: "/expert/:id", destination: "/experts/:id", permanent: true },
    ]
  },
}

export default nextConfig