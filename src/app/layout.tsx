import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import SmoothScroll from '@/components/SmoothScroll';
import CustomCursor from '@/components/CustomCursor';
import ScrollProgress from '@/components/ScrollProgress';
import PageTransition from '@/components/PageTransition';
import LoadingScreen from '@/components/LoadingScreen';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIH@GLBGOI | Team Formation & Mentorship Portal",
  description: "The official SIH Internal Hackathon portal of GL Bajaj Group of Institutions, Mathura. Powered by NexaSphere.",
};

export const viewport: Viewport = {
  themeColor: "#EFE9E1",
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
        <LoadingScreen />
        <ScrollProgress />
        <CustomCursor />
        <SmoothScroll>
          <PageTransition>{children}</PageTransition>
        </SmoothScroll>
      </body>
    </html>
  );

  if (clerkPubKey) {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
