/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/hub", destination: "/food/products", permanent: false },
      { source: "/hub/", destination: "/food/products", permanent: false },
      { source: "/hub/food/products", destination: "/food/products", permanent: false },
      { source: "/hub/food/products/", destination: "/food/products", permanent: false },
      { source: "/hub/food/vendors", destination: "/food/vendors", permanent: false },
      { source: "/hub/food/vendors/", destination: "/food/vendors", permanent: false },
      { source: "/hub/mart/products", destination: "/mart/products", permanent: false },
      { source: "/hub/mart/products/", destination: "/mart/products", permanent: false },
      { source: "/hub/mart/vendors", destination: "/mart/vendors", permanent: false },
      { source: "/hub/mart/vendors/", destination: "/mart/vendors", permanent: false },
      { source: "/hub/vendors", destination: "/food/vendors", permanent: false },
      { source: "/hub/vendors/", destination: "/food/vendors", permanent: false },
      { source: "/hub/new", destination: "/food/products/new", permanent: false },
      { source: "/hub/new/", destination: "/food/products/new", permanent: false },
      { source: "/hub/:id/edit", destination: "/products/:id/edit", permanent: false },
      { source: "/hub/:id/edit/", destination: "/products/:id/edit", permanent: false },
    ]
  },
  transpilePackages: ["@ciuna/shared"],
  compress: true,
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
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
}

export default nextConfig
