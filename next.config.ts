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
  `script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.accounts.dev https://challenges.cloudflare.com https://*.clerk.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // next/font self-hosts the Google fonts at build time, so no external origin.
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://img.clerk.com https://*.clerk.accounts.dev https://*.accounts.dev https://*.clerk.com",
  "connect-src 'self' https://*.supabase.co https://*.clerk.accounts.dev https://*.accounts.dev https://*.protect.clerk.com https://api.clerk.com https://*.clerk.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.accounts.dev https://challenges.cloudflare.com https://*.clerk.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  // Blocks <form action="https://attacker"> exfiltration.
  "form-action 'self' https://*.clerk.accounts.dev https://*.accounts.dev https://*.clerk.com",
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
      // There is deliberately no `/_next/static/:path*` rule here.
      //
      // It used to set `public, max-age=31536000, immutable`, which is exactly
      // what Next already sends for that path unprompted — the build output is
      // content-hashed, so the framework pins it without being asked. Restating
      // it bought nothing and cost something: every build printed
      //
      //   Custom Cache-Control headers detected for the following routes:
      //     - /_next/static/:path*
      //   Setting a custom Cache-Control header can break Next.js development
      //   behavior.
      //
      // and the warning is earned. In development the chunks under that path
      // are regenerated on every edit while keeping their URLs, so an immutable
      // header tells the browser never to revalidate them — leaving developers
      // staring at stale JavaScript that a normal reload cannot clear.
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
