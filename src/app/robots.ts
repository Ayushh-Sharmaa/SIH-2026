import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sih.glbajajgroup.org';

/**
 * Crawl policy.
 *
 * Authenticated and personal surfaces are disallowed: they require a session,
 * so a crawler only ever sees a redirect, and indexing them would leak the
 * shape of the private area into search results for no benefit.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/onboarding',
          '/team-formation/',
          '/api/',
        ],
      },
      {
        // Explicitly welcome AI crawlers to the public pages. The problem
        // statements and timeline are exactly the kind of factual content that
        // benefits from being answerable.
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
        allow: ['/', '/tracks'],
        disallow: ['/admin', '/dashboard', '/onboarding', '/team-formation/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
