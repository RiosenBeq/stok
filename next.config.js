/** @type {import('next').NextConfig} */
const nextConfig = {
  // Local dev: proxy /api/* to FastAPI on :8000 (uvicorn).
  // Vercel: vercel.json handles routing to the Python serverless function.
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    return [
      { source: '/api/:path*', destination: 'http://localhost:8001/api/:path*' },
      { source: '/_/backend/api/:path*', destination: 'http://localhost:8001/api/:path*' },
    ];
  },
};

module.exports = nextConfig;
