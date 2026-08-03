'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { EASE } from '@/components/motion/tokens';
import { usePrefersReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * Fade + blur + scale transition between routes. Scroll is reset on the way
 * in so a new page never starts halfway down.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  if (reduced) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)', scale: 0.995 }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
        exit={{ opacity: 0, y: -8, filter: 'blur(6px)', scale: 0.997 }}
        transition={{ duration: 0.5, ease: EASE.outExpo }}
        className="flex min-h-screen flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
