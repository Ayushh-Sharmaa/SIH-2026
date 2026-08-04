import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

import SmoothScroll from '@/components/SmoothScroll';
import CustomCursor from '@/components/CustomCursor';
import ScrollProgress from '@/components/ScrollProgress';
import PageTransition from '@/components/PageTransition';
import LoadingScreen from '@/components/LoadingScreen';
import MotionProvider from '@/components/motion/MotionProvider';

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sih.glbajajgroup.org';
const TITLE = 'SIH@GLBGOI | Team Formation & Mentorship Portal';
const DESCRIPTION =
  'The official SIH Internal Hackathon portal of GL Bajaj Group of Institutions, Mathura. Form balanced teams, close skill gaps, and match with verified faculty mentors. Powered by NexaSphere.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Pages set only their own name; the suffix is applied here once.
    template: '%s | SIH@GLBGOI',
  },
  description: DESCRIPTION,
  applicationName: 'SIH@GLBGOI',
  keywords: [
    'Smart India Hackathon',
    'SIH 2026',
    'GL Bajaj',
    'GLBGOI',
    'team formation',
    'hackathon mentorship',
  ],
  authors: [{ name: 'NexaSphere' }],
  creator: 'NexaSphere',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'SIH@GLBGOI',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="noise-texture flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {/* Wraps everything so no Framer animation escapes the reduced-motion
            policy, and so components that omit a transition inherit the house
            curve rather than Framer's default spring. */}
        <MotionProvider>
          <LoadingScreen />
          <ScrollProgress />
          <CustomCursor />
          <SmoothScroll>
            <PageTransition>{children}</PageTransition>
          </SmoothScroll>
        </MotionProvider>
      </body>
    </html>
  );

  if (clerkPubKey) {
    return <ClerkProvider publishableKey={clerkPubKey}>{content}</ClerkProvider>;
  }

  return content;
}
