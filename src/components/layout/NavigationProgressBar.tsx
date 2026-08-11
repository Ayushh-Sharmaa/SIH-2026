'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      setProgress(100);
      timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
        setNavigating(false);
      }, 200);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (timeout) clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (navigating) {
      document.body.classList.add('nav-loading');
    } else {
      document.body.classList.remove('nav-loading');
    }
    return () => {
      document.body.classList.remove('nav-loading');
    };
  }, [navigating]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let safetyTimeout: NodeJS.Timeout;

    const startProgress = () => {
      setVisible(true);
      setNavigating(true);
      setProgress(10);
      
      clearInterval(interval);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.floor(Math.random() * 5) + 2;
        });
      }, 100);

      // Safety timeout: Release lock after 8 seconds if navigation fails to resolve
      clearTimeout(safetyTimeout);
      safetyTimeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
        setNavigating(false);
        clearInterval(interval);
      }, 8000);
    };

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Check if it's an internal link
      const isInternal = href.startsWith('/') && !href.startsWith('//');
      const isModifiedClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      const isDownload = anchor.hasAttribute('download');
      const isTargetBlank = anchor.getAttribute('target') === '_blank';

      // Check if it's a hash link on the same page
      const currentUrl = new URL(window.location.href);
      let isSamePageHash = false;
      try {
        const targetUrl = new URL(href, window.location.href);
        isSamePageHash = currentUrl.pathname === targetUrl.pathname && targetUrl.hash !== '';
      } catch {
        isSamePageHash = href.startsWith('#');
      }

      if (isInternal && !isModifiedClick && !isDownload && !isTargetBlank && !isSamePageHash) {
        startProgress();
      }
    };

    // Patch history pushState and replaceState to catch programmatic routing
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      startProgress();
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      startProgress();
      return originalReplaceState.apply(this, args);
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body.nav-loading {
          pointer-events: none !important;
        }
        body.nav-loading a, body.nav-loading button, body.nav-loading [role="button"] {
          cursor: wait !important;
        }
      `}} />
      {visible && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px] w-full bg-transparent pointer-events-none"
        >
          <div
            className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_1px_10px_rgba(114,56,61,0.6)]"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--primary, #72383D)',
            }}
          />
        </div>
      )}
    </>
  );
}
