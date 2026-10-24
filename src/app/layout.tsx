import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Suspense } from 'react';
import './globals.css';

import ScrollProgress from '@/components/ScrollProgress';
import PageTransition from '@/components/PageTransition';
import LoadingScreen from '@/components/LoadingScreen';
import NavigationProgressBar from '@/components/layout/NavigationProgressBar';
import MotionProvider from '@/components/motion/MotionProvider';
import { SessionProvider } from '@/lib/session';
import { ToastProvider } from '@/components/ui/Toast';
import { SiteStructuredData } from '@/components/seo/StructuredData';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  // Metric-matched fallback: the swap from fallback to Geist no longer shifts
  // layout, which is most of this page's CLS budget.
  fallback: ['Inter', 'system-ui', 'arial'],
  adjustFontFallback: true,
  preload: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
  // Mono is used only for small labels, so paying for a preload would cost more
  // than it saves.
  preload: false,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://arena.glbajajgroup.org';
const TITLE = 'Arena — Student Skill & Team Finder | Hustle Carnival 2026';
const DESCRIPTION =
  'Arena is the official student skill and team finder platform developed by Team Ghost (NexaSphere) for Hustle Carnival 2026 (Problem Statement ELU04: Education & Student Networking) and campus hackathons at GL Bajaj Group of Institutions, Mathura. Form balanced teams, close skill gaps, and match with verified faculty mentors.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Pages set only their own name; the suffix is applied here once.
    template: '%s | Arena',
  },
  description: DESCRIPTION,
  applicationName: 'Arena',
  keywords: [
    'Arena',
    'Student Skill and Team Finder',
    'Hustle Carnival 2026',
    'Ellusion Buildathon',
    'ELU04',
    'Team Ghost',
    'Education & Student Networking',
    'GL Bajaj Group of Institutions Mathura',
    'GLBGOI',
    'Smart India Hackathon',
    'team formation',
    'hackathon mentorship',
    'NexaSphere',
  ],
  authors: [{ name: 'Team Ghost · NexaSphere' }],
  creator: 'NexaSphere',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Arena',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/Logo/NexaSphere Icon without Background.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: SITE_URL },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: '#EFE9E1',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  // Never block zoom — capping scale is a WCAG 1.4.4 failure.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}
    >
      <body className="noise-texture flex min-h-full flex-col">
        {/* Rendered server-side so crawlers that do not execute JS still see it. */}
        <SiteStructuredData />

        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {/* Wraps everything so no Framer animation escapes the reduced-motion
            policy, and so components that omit a transition inherit the house
            curve rather than Framer's default spring. */}
        <MotionProvider>
          {/* Above the route tree so the session survives navigation and is
              fetched once per page load rather than once per route change. */}
          <SessionProvider>
            <ToastProvider>
              <LoadingScreen />
              <Suspense fallback={null}>
                <NavigationProgressBar />
              </Suspense>
              <ScrollProgress />
              <PageTransition>{children}</PageTransition>
            </ToastProvider>
          </SessionProvider>
        </MotionProvider>
      </body>
    </html>
  );

  if (clerkPubKey) {
    return <ClerkProvider publishableKey={clerkPubKey}>{content}</ClerkProvider>;
  }

  return content;
}
