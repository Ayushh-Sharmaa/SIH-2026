import type { NextConfig } from 'next';

/**
 * Security headers and asset policy.
 *
 * The config previously held only `reactCompiler`, so the app shipped with no
 * CSP, no HSTS, no clickjacking protection and no referrer policy.
 *
 * `unsafe-inline` on style-src is unavoidable here: Next injects critical CSS
 * inline and framer-motion writes inline styles on every animated element.
 * Removing it needs a nonce-based CSP threaded through a custom document, which
 * is a larger change than this pass. `unsafe-eval` is scoped to development,
 * where React Refresh requires it.
 */
const isDev = process.env.NODE_ENV === 'development';

const CSP = [
  "default-src 'self'",
  // Clerk serves its widget from its own CDN and calls its own API.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://*.clerk.accounts.dev https://*.clerk.com`,
  "style-src 'self' 'unsafe-inline'",
  // next/font self-hosts the Google fonts at build time, so no external origin.
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.supabase.co",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  // Blocks <form action="https://attacker"> exfiltration.
  "form-action 'self'",
  // Modern replacement for X-Frame-Options; also covers nested frames.
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  // Two years, subdomains included, preload-eligible.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Kept alongside frame-ancestors for older browsers.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Deny every capability this portal never uses.
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
    ].join(', '),
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Removes the `X-Powered-By: Next.js` fingerprint.
  poweredByHeader: false,

  compress: true,

  images: {
    // AVIF first, WebP fallback. The brand assets are PNGs, so this is what
    // makes next/image actually pay for itself here.
    formats: ['image/avif', 'image/webp'],
    // Matches the breakpoints this site actually uses rather than the defaults.
    deviceSizes: [375, 425, 768, 1024, 1280, 1440, 1920, 2560],
    // Matches the real rendered logo/avatar sizes (28, 32, 48, 92, 128).
    imageSizes: [16, 28, 32, 48, 64, 92, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: false,
  },

  async headers() {
    return [
      {
        // Every route, including API responses.
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Build output is content-hashed, so it is safe to cache immutably.
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Brand assets are not content-hashed, so revalidate rather than pin.
        source: '/Logo/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

export default nextConfig;
