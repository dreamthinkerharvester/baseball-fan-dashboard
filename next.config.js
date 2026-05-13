/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.koreabaseball.com' },
      { protocol: 'https', hostname: '**.statiz.co.kr' },
    ],
  },
  async headers() {
    // Next.js dev mode (HMR) uses eval() — must allow 'unsafe-eval' in development.
    // Production strips eval and keeps strict policy.
    const isDev = process.env.NODE_ENV === 'development';
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      'https://va.vercel-scripts.com',
    ].join(' ');

    const csp = [
      "default-src 'self'",
      "img-src 'self' data: https:",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://*.sentry.io https://va.vercel-scripts.com ws: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
