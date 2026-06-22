/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint runs in CI (.github/workflows/ci.yml), not in the production build.
  // A stray ESLint error must not take down a Vercel deploy (regression: 2026-05-17).
  // Type errors still block the build — those are real bugs, not style nits.
  eslint: { ignoreDuringBuilds: true },
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
    ].join(' ');

    const csp = [
      "default-src 'self'",
      "img-src 'self' data: https:",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://*.sentry.io ws: wss:",
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
