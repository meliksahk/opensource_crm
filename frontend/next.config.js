// frontend/next.config.js
/** @type {import('next').NextConfig} */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';

const nextConfig = {
  reactStrictMode: true,
  // Tarayıcı yalnız frontend origin'ine konuşur; /api istekleri sunucu tarafında
  // backend'e proxy'lenir (tek origin → tunnel/CORS sorunsuz, cookie aynı origin).
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND}/api/:path*` }];
  },
};

module.exports = nextConfig;
