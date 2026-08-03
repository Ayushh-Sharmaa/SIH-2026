'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '@/components/motion/tokens';

/**
 * First-paint curtain. Shows only once per browser session so returning to
 * the site mid-session feels instant rather than ceremonial.
 */
export default function LoadingScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('sih-intro-shown')) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      sessionStorage.setItem('sih-intro-shown', '1');
      return;
    }

    setShow(true);
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      sessionStorage.setItem('sih-intro-shown', '1');
      setShow(false);
      document.body.style.overflow = '';
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 0.7, ease: EASE.outExpo }}
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#EFE9E1]"
        >
          <div className="flex flex-col items-center gap-7">
            <motion.svg
              viewBox="0 0 100 100"
              className="size-16"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE.outExpo }}
            >
              <defs>
                <linearGradient id="introGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#72383d" />
                  <stop offset="100%" stopColor="#ac9c8d" />
                </linearGradient>
              </defs>
              <motion.polygon
                points="50,10 87,31 87,71 50,92 13,71 13,31"
                fill="none"
                stroke="url(#introGrad)"
                strokeWidth="3"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, ease: EASE.outExpo }}
              />
              <motion.circle
                cx="50"
                cy="50"
                r="13"
                fill="url(#introGrad)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.45, ease: EASE.outExpo }}
                style={{ transformOrigin: 'center' }}
              />
            </motion.svg>

            <div className="h-px w-40 overflow-hidden rounded-full bg-[rgba(172,156,141,0.3)]">
              <motion.div
                className="h-full bg-gradient-to-r from-[#72383d] to-[#ac9c8d]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.35, ease: EASE.outExpo }}
                style={{ transformOrigin: 'left' }}
              />
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#ac9c8d]"
            >
              SIH@GLBGOI
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
