/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    images: {
      unoptimized: true,
    },
    // Extreme memory optimization
    experimental: {
      webpackBuildWorker: false,
      optimizeCss: false,
      optimizePackageImports: false,
      parallelServerBuildTraces: false,
      parallelServerCompiles: false,
    },
    webpack: (config) => {
      // Aggressive memory optimization
      config.optimization = {
        ...config.optimization,
        minimize: true,
        runtimeChunk: false,
        splitChunks: {
          chunks: "all",
          maxInitialRequests: 10,
          minSize: 50000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
          },
        },
      }
  
      // Disable source maps completely
      config.devtool = false
  
      return config
    },
    // Reduce memory usage for the server
    onDemandEntries: {
      maxInactiveAge: 10 * 1000,
      pagesBufferLength: 1,
    },
    // Reduce memory usage by disabling compression
    compress: false,
  }
  
  export default nextConfig
  
  