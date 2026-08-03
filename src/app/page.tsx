'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 14,
      },
    },
  } as const;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      {/* Background blobs with drifting animation */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 40, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full filter blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 50, -30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-accent/15 rounded-full filter blur-[120px] pointer-events-none"
      />

      {/* Main Container */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center z-10 max-w-4xl mx-auto space-y-10"
      >
        {/* Header Branding */}
        <div className="space-y-4">
          <motion.span
            variants={itemVariants}
            className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20"
          >
            Internal Hackathon Portal 2026
          </motion.span>
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-accent to-indigo-400 bg-clip-text text-transparent animate-gradient"
          >
            SIH@GLBGOI
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="max-w-xl text-lg sm:text-xl text-muted mx-auto leading-relaxed"
          >
            The official team formation and mentorship platform of GL Bajaj Group of Institutions, Mathura.
          </motion.p>
        </div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm"
        >
          <Link
            href="/login"
            className="flex-1 rounded-xl bg-primary hover:bg-primary-hover px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-center cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Enter Portal
          </Link>
          <Link
            href="/signup"
            className="flex-1 rounded-xl bg-card border border-card-border hover:bg-card-border px-6 py-3.5 text-sm font-bold text-foreground transition-all text-center cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Create Account
          </Link>
        </motion.div>

        {/* Feature Highlights (Bento-like grid) */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 w-full"
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.025, borderColor: 'rgba(99, 102, 241, 0.35)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.1)' }}
            className="glass-card rounded-2xl p-6 border border-card-border text-left transition-all duration-300 cursor-default"
          >
            <span className="text-2xl mb-3 block">🤝</span>
            <h3 className="text-base font-bold text-foreground">Teammate Search</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Discover students filtered by tech stack, soft skills, presenting fluency, and specific SIH problem statements.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.025, borderColor: 'rgba(167, 139, 250, 0.35)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(167, 139, 250, 0.1)' }}
            className="glass-card rounded-2xl p-6 border border-card-border text-left transition-all duration-300 cursor-default"
          >
            <span className="text-2xl mb-3 block">💡</span>
            <h3 className="text-base font-bold text-foreground">Mentor Assignment</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Find and request guide allocations from verified GL Bajaj faculties and alumni based on domain expertise.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.025, borderColor: 'rgba(99, 102, 241, 0.35)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.1)' }}
            className="glass-card rounded-2xl p-6 border border-card-border text-left transition-all duration-300 cursor-default"
          >
            <span className="text-2xl mb-3 block">⚡</span>
            <h3 className="text-base font-bold text-foreground">Automated Flow</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Roster calculations, skill-gap notifications, and team configurations update in real-time as people join or leave.
            </p>
          </motion.div>
        </motion.div>
      </motion.main>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-card-border text-xs text-muted z-10">
        Created with ❤️ by the <span className="font-semibold text-primary">NexaSphere</span> Tech Club
      </footer>
    </div>
  );
}
