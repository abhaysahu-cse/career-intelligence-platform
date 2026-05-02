/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.dicebear.com', 'logo.clearbit.com', 'ui-avatars.com'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // Proxy API calls to backend services in development
  async rewrites() {
    return [
      // All /api/* calls → API Gateway (Spring Boot :8080)
      // NOTE: frontend lib/api.ts calls paths WITHOUT /api prefix now,
      // so this rewrite is only needed if any legacy /api/* calls remain.
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
