/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // CSP configuration for development and production
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/^https/, 'wss');
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${wsUrl} ${apiUrl};`
              : `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${wsUrl} ${apiUrl};`,
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig


