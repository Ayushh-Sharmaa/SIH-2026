import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sih.glbajajgroup.org';

/**
 * Only publicly reachable routes belong here.
 *
 * /dashboard, /admin, /onboarding and /team-formation all require a session, so
 * listing them would advertise URLs that return a redirect to every crawler
 * that follows them.
 *
 * `lastModified` is stamped at build time rather than with `new Date()` at
 * request time, so the value is stable across requests instead of changing on
 * every crawl and training crawlers to distrust it.
 */
const BUILD_TIME = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: BUILD_TIME,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/tracks`,
      lastModified: BUILD_TIME,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: BUILD_TIME,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: BUILD_TIME,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
