'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const SIH_MILESTONES = [
  {
    id: 1,
    phase: 'Phase 01',
    period: 'Jun - Aug 2026',
    title: 'Registration of SPOCs',
    desc: 'Institutional Single Point of Contact (SPOC) registration and college onboarding on the official SIH portal.',
    icon: '📝',
    color: 'from-cyan-500 to-blue-600',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 2,
    phase: 'Phase 02',
    period: 'Jun - Aug 2026',
    title: 'Internal Hackathon',
    desc: 'Campus-wide internal hackathon at GL Bajaj to screen, mentor, and select the top student teams.',
    icon: '🚀',
    color: 'from-blue-500 to-indigo-600',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  {
    id: 3,
    phase: 'Phase 03',
    period: 'Jul - Aug 2026',
    title: 'SIH Problem Statement Launch',
    desc: 'Official nationwide release of problem statements across 18 ministries and industrial themes.',
    icon: '🌐',
    color: 'from-sky-500 to-teal-600',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  },
  {
    id: 4,
    phase: 'Phase 04',
    period: 'Jul - Aug 2026',
    title: 'Report Compilation & Upload',
    desc: 'Internal hackathon evaluation reports and top team nomination details uploaded to SIH portal.',
    icon: '📊',
    color: 'from-teal-500 to-emerald-600',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  },
  {
    id: 5,
    phase: 'Phase 05',
    period: 'Aug - Sept 2026',
    title: 'Nomination of Top Teams & Idea Submission',
    desc: 'Official submission of executive PPTs, architecture diagrams, and prototype videos on SIH portal.',
    icon: '💡',
    color: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  {
    id: 6,
    phase: 'Phase 06',
    period: 'Sep - Oct 2026',
    title: 'Screening of Ideas',
    desc: 'Rigorous multi-round evaluation of submitted proposals by national jury panels & ministry experts.',
    icon: '🔎',
    color: 'from-purple-500 to-violet-600',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  {
    id: 7,
    phase: 'Phase 07',
    period: 'Oct 2026',
    title: 'Result Publication',
    desc: 'Official publication of shortlisted finalist teams for the Smart India Hackathon Grand Finale.',
    icon: '📢',
    color: 'from-rose-500 to-pink-600',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  {
    id: 8,
    phase: 'Phase 08',
    period: 'Nov 2026',
    title: 'Communication of Result to Finalists',
    desc: 'Dispatch of official finalist letters, nodal center assignments, and logistical instructions.',
    icon: '✉️',
    color: 'from-violet-500 to-indigo-600',
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  },
  {
    id: 9,
    phase: 'Phase 09',
    period: 'Nov 2026',
    title: 'Mentoring & Training Sessions',
    desc: 'Intensive faculty mentorship, technical bootcamps, and mock presentation drills at GL Bajaj.',
    icon: '🎓',
    color: 'from-pink-500 to-rose-600',
    badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  },
  {
    id: 10,
    phase: 'Phase 10',
    period: 'Nov 2026',
    title: 'Shortlisted Students Announcement',
    desc: 'Final roster confirmation and travel preparation for teams heading to national nodal centers.',
    icon: '📣',
    color: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 11,
    phase: 'Phase 11',
    period: 'Dec 2026',
    title: 'SIH Grand Finale 🏆',
    desc: '36-hour non-stop national hackathon finale at assigned nodal centers across India!',
    icon: '🏆',
    color: 'from-red-500 via-amber-500 to-yellow-500',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  },
];

const ALL_18_THEME_SETS = [
  {
    id: 1,
    title: 'Fitness, Space Tech & Heritage',
    image: '/sih-2026/sih-theme-1.png',
    themes: [
      { name: 'Fitness & Sports', desc: 'Ideas that can boost fitness activities and assist in keeping fit.' },
      { name: 'Space Technology', desc: 'For use in travel or activities beyond Earth’s atmosphere, for purposes such as spaceflight or space exploration.' },
      { name: 'Heritage & Culture', desc: 'Ideas that showcase the rich cultural heritage and traditions of India.' },
    ],
  },
  {
    id: 2,
    title: 'MedTech, Agriculture & Smart Vehicles',
    image: '/sih-2026/sih-theme-2.png',
    themes: [
      { name: 'MedTech / BioTech / HealthTech', desc: 'Cutting-edge technology in these sectors continues to be in demand. Recent shifts in healthcare trends, growing populations also present an array of opportunities for innovation.' },
      { name: 'Agriculture, FoodTech & Rural Development', desc: 'Developing solutions, keeping in mind the need to enhance the primary sector of India - Agriculture and to manage and process our agriculture produce.' },
      { name: 'Smart Vehicles', desc: 'Creating intelligent devices to improve commutation sector.' },
    ],
  },
  {
    id: 3,
    title: 'Logistics, Robotics & Clean Tech',
    image: '/sih-2026/sih-theme-3.png',
    themes: [
      { name: 'Transportation & Logistics', desc: 'Submit your ideas to address the growing pressures on the city’s resources, transport networks, and logistic infrastructure.' },
      { name: 'Robotics and Drones', desc: 'There is a need to design drones and robots that can solve some of the pressing challenges of India such as handling medical emergencies, search and rescue operations, etc.' },
      { name: 'Clean & Green Technology', desc: 'Solutions could be in the form of waste segregation, disposal, and improve sanitization system.' },
    ],
  },
  {
    id: 4,
    title: 'Tourism, Energy & Blockchain',
    image: '/sih-2026/sih-theme-4.png',
    themes: [
      { name: 'Tourism', desc: 'A solution/idea that can boost the current situation of the tourism industries including hotels, travel and others.' },
      { name: 'Renewable / Sustainable Energy', desc: 'Innovative ideas that help manage and generate renewable /sustainable sources more efficiently.' },
      { name: 'Blockchain & Cybersecurity', desc: 'Provide ideas in a decentralized and distributed ledger technology used to store digital information that powers cryptocurrencies and NFTs and can radically change multiple sectors.' },
    ],
  },
  {
    id: 5,
    title: 'Smart Education, Disaster Mgmt & Games',
    image: null,
    themes: [
      { name: 'Smart Education', desc: 'Smart education, a concept that describes learning in digital age. It enables learners to learn more effectively, efficiently, flexibly and comfortably.' },
      { name: 'Disaster Management', desc: 'Disaster management includes ideas related to risk mitigation, Planning and management before, after or during a disaster.' },
      { name: 'Games & Toys', desc: 'Challenge your creative mind to conceptualize and develop unique toys and games based on our civilization, history, and culture etc.' },
    ],
  },
  {
    id: 6,
    title: 'Miscellaneous, FinTech & Automation',
    image: null,
    themes: [
      { name: 'Miscellaneous', desc: 'Technology ideas in tertiary sectors like Hospitality, Entertainment and Retail.' },
      { name: 'FinTech', desc: 'Challenges related to the financial services.' },
      { name: 'Smart Automation', desc: 'Ideas focused on the intelligent use of resources for transforming and advancements of technology with combining the artificial intelligence to explore more various sources and get valuable insights.' },
    ],
  },
];

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  const activePhase = SIH_MILESTONES[activePhaseIndex];

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
        className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center z-10 max-w-6xl mx-auto space-y-16"
      >
        {/* Notice Banner: Official PS Status */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 text-xs sm:text-sm text-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-2.5 text-left">
            <span className="text-xl">📢</span>
            <div>
              <strong className="font-bold block">Official SIH 2026 Problem Statements Notice</strong>
              <span className="opacity-90">Official PS are not released yet. Platform tracks are configured with all 18 official SIH Themes.</span>
            </div>
          </div>
          <a
            href="https://sih.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-3.5 py-1.5 text-xs font-bold transition-all"
          >
            ↗ SIH Portal
          </a>
        </motion.div>

        {/* Header Branding */}
        <div className="space-y-4 max-w-3xl">
          <motion.span
            variants={itemVariants}
            className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary border border-primary/20"
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

        {/* FEATURE 1: Custom Animated SIH 2026 Interactive Timeline Flow */}
        <motion.div
          variants={itemVariants}
          className="w-full glass-card rounded-3xl p-6 sm:p-8 border border-card-border text-left space-y-8 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-card-border pb-4">
            <div>
              <span className="text-xs font-bold text-primary tracking-wider uppercase">Interactive Milestone Roadmap</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-0.5">
                Smart India Hackathon 2026 Timeline Flow
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-1">
                Explore the 11 key milestone phases from SPOC registration to the SIH Grand Finale.
              </p>
            </div>
          </div>

          {/* Stepper Navigation Pills Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Milestone Timeline Steps ({activePhaseIndex + 1} of 11)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePhaseIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activePhaseIndex === 0}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-card border border-card-border disabled:opacity-40 hover:bg-card-border transition-colors cursor-pointer"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhaseIndex((prev) => Math.min(SIH_MILESTONES.length - 1, prev + 1))}
                  disabled={activePhaseIndex === SIH_MILESTONES.length - 1}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next Phase →
                </button>
              </div>
            </div>

            {/* Stepper Buttons Gallery */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {SIH_MILESTONES.map((item, index) => {
                const isActive = index === activePhaseIndex;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActivePhaseIndex(index)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                      isActive
                        ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                        : 'bg-background/40 border-card-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.phase}
                      </span>
                      <span className="text-base">{item.icon}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted block">{item.period}</span>
                      <span className="text-xs font-bold text-foreground truncate block mt-0.5">{item.title}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Active Phase Spotlight Spotlight Box */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePhase.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-card/90 to-background/80 border border-primary/30 space-y-4 shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-card-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-3 bg-primary/10 rounded-2xl border border-primary/20">{activePhase.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${activePhase.badgeColor}`}>
                        {activePhase.phase}
                      </span>
                      <span className="text-xs font-bold text-primary">{activePhase.period}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">{activePhase.title}</h3>
                  </div>
                </div>

                <span className="text-xs text-muted bg-background/60 border border-card-border px-3 py-1.5 rounded-xl self-start sm:self-auto font-semibold">
                  Phase {activePhase.id} of 11
                </span>
              </div>

              <p className="text-sm sm:text-base text-muted leading-relaxed max-w-3xl">
                {activePhase.desc}
              </p>

              {/* Animated Milestone Progress Indicator */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-primary">SIH 2026 Progress Flow</span>
                  <span className="text-muted">{Math.round(((activePhaseIndex + 1) / 11) * 100)}% Completed</span>
                </div>
                <div className="h-2.5 w-full bg-background/80 rounded-full overflow-hidden border border-card-border">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((activePhaseIndex + 1) / 11) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary via-accent to-emerald-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* FEATURE 2: Official SIH 2026 Themes Gallery (18 Themes) */}
        <motion.div
          variants={itemVariants}
          className="w-full glass-card rounded-3xl p-6 sm:p-8 border border-card-border text-left space-y-6 shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-card-border pb-4">
            <div>
              <span className="text-xs font-bold text-accent tracking-wider uppercase">Official Categories</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-0.5">
                Official SIH 2026 Themes (All 18 Categories)
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-1">
                "No problem is too big... No idea is too small" — Official SIH theme descriptions.
              </p>
            </div>

            {/* Theme Set Switcher Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_18_THEME_SETS.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    activeSlide === idx
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                      : 'bg-card border-card-border text-muted hover:text-foreground'
                  }`}
                >
                  Set {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Active Theme Set Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  ✨ Theme Set {activeSlide + 1}: <span className="text-primary">{ALL_18_THEME_SETS[activeSlide].title}</span>
                </h3>
              </div>

              {/* 3 Theme Cards Grid matching official SIH card layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ALL_18_THEME_SETS[activeSlide].themes.map((t) => (
                  <motion.div
                    key={t.name}
                    whileHover={{ y: -4 }}
                    className="p-6 bg-background/60 rounded-2xl border border-card-border hover:border-primary/40 space-y-3 shadow-lg flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg font-bold">
                        💡
                      </div>
                      <h4 className="text-base font-extrabold text-foreground">{t.name}</h4>
                      <p className="text-xs text-muted leading-relaxed">{t.desc}</p>
                    </div>
                    <div className="pt-3 border-t border-card-border/60">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Official SIH Theme</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full"
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
