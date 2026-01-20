/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode to prevent double renders in development
  reactStrictMode: false,
  
  // Enable compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  webpack: (config, { isServer }) => {
    // Fix for canvas/konva SSR issue
    if (isServer) {
      config.externals.push({
        canvas: 'canvas',
      });
    }
    return config;
  },
};

export default nextConfig;
