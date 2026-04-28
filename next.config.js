/** @type {import('next').NextConfig} */
const nextConfig = {
  // Local dev: proxy /api/* to FastAPI on :8000 (uvicorn).
  // Vercel: vercel.json handles routing to the Python serverless function.
  async rewrites() {
    if (process.env.VERCEL) return [];
    const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:8000';
    return [
      { source: '/api/:path*', destination: `${backendOrigin}/api/:path*` },
      { source: '/_/backend/api/:path*', destination: `${backendOrigin}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
