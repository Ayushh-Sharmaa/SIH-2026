import { FAQS } from '@/lib/content';

/**
 * JSON-LD structured data.
 *
 * Deliberately a server component with no `'use client'`: this is inert markup
 * that must be present in the initial HTML for crawlers that do not execute
 * JavaScript. Rendering it on the client would defeat the purpose.
 *
 * `JSON.stringify` output is injected via dangerouslySetInnerHTML, which is safe
 * here because every value originates from our own constants, never from user
 * input. The `<` escape guards against a stray sequence closing the script tag
 * early if content is ever sourced from the database.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sih.glbajajgroup.org';

const ORGANISATION_NAME = 'GL Bajaj Group of Institutions, Mathura';

function LdJson({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Escaping `<` prevents a value from terminating the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

/** Organisation + website identity. Belongs in the root layout, once. */
export function SiteStructuredData() {
  const organisation = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    '@id': `${SITE_URL}/#organisation`,
    name: ORGANISATION_NAME,
    alternateName: 'GLBGOI',
    url: 'https://www.glbajajgroup.org',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mathura',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Smart India Hackathon cell',
      email: 'iic@glbajajgroup.org',
      availableLanguage: ['en', 'hi'],
    },
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'SIH@GLBGOI',
    description:
      'The official Smart India Hackathon internal portal of GL Bajaj Group of Institutions, Mathura.',
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organisation` },
  };

  return (
    <>
      <LdJson data={organisation} />
      <LdJson data={website} />
    </>
  );
}

/**
 * FAQ rich result, generated from the same constants the page renders.
 *
 * Sourcing both from `FAQS` is the point: schema that drifts from the visible
 * content is a manual-action risk, and duplicating the strings guarantees drift.
 */
export function FaqStructuredData() {
  return (
    <LdJson
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      }}
    />
  );
}

/** Breadcrumb trail. Pass the ancestors of the current page, in order. */
export function BreadcrumbStructuredData({
  trail,
}: {
  trail: { name: string; path: string }[];
}) {
  return (
    <LdJson
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: trail.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.path}`,
        })),
      }}
    />
  );
}
