import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Reduce memory usage during development and build
  experimental: {
    webpackBuildWorker: false,
    // Instead of disabling optimizePackageImports, we can keep the default packages
    // or specify only essential ones to reduce memory usage
    optimizePackageImports: ["lucide-react"], // Only include packages you actually use
    // Disable parallel operations to reduce memory usage
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
  },
  webpack: (config) => {
    // Optimize memory usage
    config.optimization = {
      ...config.optimization,
      minimize: true,
      // Reduce chunk size
      splitChunks: {
        chunks: "all",
        maxInitialRequests: 25,
        minSize: 20000,
      },
    }

    // Disable source maps in development to save memory
    config.devtool = false

    return config
  },
  // Reduce memory usage for the server
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 15 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
}

export default nextConfig

