'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { animate, createTimeline, stagger } from 'animejs';

// SIH Milestones
const SIH_MILESTONES = [
  {
    id: 1,
    phase: 'Phase 01',
    period: 'Jun - Aug 2026',
    title: 'Registration of SPOCs',
    desc: 'Institutional Single Point of Contact (SPOC) registration and college onboarding on the official SIH portal.',
    icon: '📝',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    id: 2,
    phase: 'Phase 02',
    period: 'Jun - Aug 2026',
    title: 'Internal Hackathon',
    desc: 'Campus-wide internal hackathon at GL Bajaj to screen, mentor, and select the top student teams.',
    icon: '🚀',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 3,
    phase: 'Phase 03',
    period: 'Jul - Aug 2026',
    title: 'SIH PS Launch',
    desc: 'Official nationwide release of problem statements across 18 ministries and industrial themes.',
    icon: '🌐',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    id: 4,
    phase: 'Phase 04',
    period: 'Jul - Aug 2026',
    title: 'Report Upload',
    desc: 'Internal hackathon evaluation reports and top team nomination details uploaded to SIH portal.',
    icon: '📊',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 5,
    phase: 'Phase 05',
    period: 'Aug - Sept 2026',
    title: 'Idea Nomination',
    desc: 'Official submission of executive PPTs, architecture diagrams, and prototype videos on SIH portal.',
    icon: '💡',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    id: 6,
    phase: 'Phase 06',
    period: 'Sep - Oct 2026',
    title: 'Idea Screening',
    desc: 'Rigorous multi-round evaluation of submitted proposals by national jury panels & ministry experts.',
    icon: '🔎',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 7,
    phase: 'Phase 07',
    period: 'Oct 2026',
    title: 'Result Publication',
    desc: 'Official publication of shortlisted finalist teams for the Smart India Hackathon Grand Finale.',
    icon: '📢',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    id: 8,
    phase: 'Phase 08',
    period: 'Nov 2026',
    title: 'Finalist Alert',
    desc: 'Dispatch of official finalist letters, nodal center assignments, and logistical instructions.',
    icon: '✉️',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 9,
    phase: 'Phase 09',
    period: 'Nov 2026',
    title: 'Training Sessions',
    desc: 'Intensive faculty mentorship, technical bootcamps, and mock presentation drills at GL Bajaj.',
    icon: '🎓',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    id: 10,
    phase: 'Phase 10',
    period: 'Nov 2026',
    title: 'Roster Announcement',
    desc: 'Final roster confirmation and travel preparation for teams heading to national nodal centers.',
    icon: '📣',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 11,
    phase: 'Phase 11',
    period: 'Dec 2026',
    title: 'SIH Grand Finale 🏆',
    desc: '36-hour non-stop national hackathon finale at assigned nodal centers across India!',
    icon: '🏆',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  },
];

// SIH Themes
const ALL_18_THEME_SETS = [
  {
    id: 1,
    title: 'Fitness, Space Tech & Heritage',
    themes: [
      { name: 'Fitness & Sports', desc: 'Ideas that can boost fitness activities and assist in keeping fit.' },
      { name: 'Space Technology', desc: 'For use in travel or activities beyond Earth’s atmosphere, for purposes such as spaceflight or space exploration.' },
      { name: 'Heritage & Culture', desc: 'Ideas that showcase the rich cultural heritage and traditions of India.' },
    ],
  },
  {
    id: 2,
    title: 'MedTech, Agriculture & Smart Vehicles',
    themes: [
      { name: 'MedTech / BioTech / HealthTech', desc: 'Cutting-edge technology in these sectors continues to be in demand. Recent shifts in healthcare trends, growing populations also present an array of opportunities for innovation.' },
      { name: 'Agriculture, FoodTech & Rural Development', desc: 'Developing solutions, keeping in mind the need to enhance the primary sector of India - Agriculture and to manage and process our agriculture produce.' },
      { name: 'Smart Vehicles', desc: 'Creating intelligent devices to improve commutation sector.' },
    ],
  },
  {
    id: 3,
    title: 'Logistics, Robotics & Clean Tech',
    themes: [
      { name: 'Transportation & Logistics', desc: 'Submit your ideas to address the growing pressures on the city’s resources, transport networks, and logistic infrastructure.' },
      { name: 'Robotics and Drones', desc: 'There is a need to design drones and robots that can solve some of the pressing challenges of India such as handling medical emergencies, search and rescue operations, etc.' },
      { name: 'Clean & Green Technology', desc: 'Solutions could be in the form of waste segregation, disposal, and improve sanitization system.' },
    ],
  },
  {
    id: 4,
    title: 'Tourism, Energy & Blockchain',
    themes: [
      { name: 'Tourism', desc: 'A solution/idea that can boost the current situation of the tourism industries including hotels, travel and others.' },
      { name: 'Renewable / Sustainable Energy', desc: 'Innovative ideas that help manage and generate renewable /sustainable sources more efficiently.' },
      { name: 'Blockchain & Cybersecurity', desc: 'Provide ideas in a decentralized and distributed ledger technology used to store digital information that powers cryptocurrencies and NFTs and can radically change multiple sectors.' },
    ],
  },
  {
    id: 5,
    title: 'Smart Education, Disaster Mgmt & Games',
    themes: [
      { name: 'Smart Education', desc: 'Smart education, a concept that describes learning in digital age. It enables learners to learn more effectively, efficiently, flexibly and comfortably.' },
      { name: 'Disaster Management', desc: 'Disaster management includes ideas related to risk mitigation, Planning and management before, after or during a disaster.' },
      { name: 'Games & Toys', desc: 'Challenge your creative mind to conceptualize and develop unique toys and games based on our civilization, history, and culture etc.' },
    ],
  },
  {
    id: 6,
    title: 'Miscellaneous, FinTech & Automation',
    themes: [
      { name: 'Miscellaneous', desc: 'Technology ideas in tertiary sectors like Hospitality, Entertainment and Retail.' },
      { name: 'FinTech', desc: 'Challenges related to the financial services.' },
      { name: 'Smart Automation', desc: 'Ideas focused on the intelligent use of resources for transforming and advancements of technology with combining the artificial intelligence to explore more various sources and get valuable insights.' },
    ],
  },
];

// Interactive Scroll-Assembly Shape Logo
function ScrollAssemblyLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });

  const shape1X = useTransform(scrollYProgress, [0, 0.7], [-120, 0]);
  const shape1Y = useTransform(scrollYProgress, [0, 0.7], [-80, 0]);
  const shape1Rotate = useTransform(scrollYProgress, [0, 0.7], [-240, 0]);
  const shape1Scale = useTransform(scrollYProgress, [0, 0.7], [0.6, 1]);

  const shape2X = useTransform(scrollYProgress, [0, 0.7], [140, 0]);
  const shape2Y = useTransform(scrollYProgress, [0, 0.7], [-100, 0]);
  const shape2Rotate = useTransform(scrollYProgress, [0, 0.7], [180, 0]);
  const shape2Scale = useTransform(scrollYProgress, [0, 0.7], [0.5, 1]);

  const shape3X = useTransform(scrollYProgress, [0, 0.7], [-160, 0]);
  const shape3Y = useTransform(scrollYProgress, [0, 0.7], [120, 0]);
  const shape3Rotate = useTransform(scrollYProgress, [0, 0.7], [120, 0]);
  const shape3Scale = useTransform(scrollYProgress, [0, 0.7], [0.4, 1]);

  const shape4X = useTransform(scrollYProgress, [0, 0.7], [150, 0]);
  const shape4Y = useTransform(scrollYProgress, [0, 0.7], [110, 0]);
  const shape4Rotate = useTransform(scrollYProgress, [0, 0.7], [-150, 0]);
  const shape4Scale = useTransform(scrollYProgress, [0, 0.7], [0.7, 1]);

  const centerScale = useTransform(scrollYProgress, [0, 0.7], [0.3, 1.1]);
  const centerRotate = useTransform(scrollYProgress, [0, 0.7], [0, 360]);

  return (
    <div ref={containerRef} className="w-full max-w-[400px] h-[360px] relative flex items-center justify-center pointer-events-none select-none">
      <div className="absolute inset-0 bg-primary/10 rounded-full filter blur-[60px]" />
      
      {/* SHAPE 1: Left-Top Arc */}
      <motion.div
        style={{ x: shape1X, y: shape1Y, rotate: shape1Rotate, scale: shape1Scale }}
        className="absolute w-[180px] h-[180px] border-t-4 border-l-4 border-primary rounded-tl-full opacity-80 filter drop-shadow-[0_0_15px_rgba(114,56,61,0.4)]"
      />

      {/* SHAPE 2: Right-Top Diagonal Bar */}
      <motion.div
        style={{ x: shape2X, y: shape2Y, rotate: shape2Rotate, scale: shape2Scale }}
        className="absolute w-[80px] h-[8px] bg-gradient-to-r from-accent to-primary rounded-full opacity-80 filter drop-shadow-[0_0_10px_rgba(172,156,141,0.4)]"
      />

      {/* SHAPE 3: Left-Bottom Geometric Cross */}
      <motion.div
        style={{ x: shape3X, y: shape3Y, rotate: shape3Rotate, scale: shape3Scale }}
        className="absolute w-[36px] h-[36px] flex items-center justify-center"
      >
        <div className="w-[8px] h-[36px] bg-primary rounded-full absolute filter drop-shadow-[0_0_8px_rgba(114,56,61,0.5)]" />
        <div className="w-[36px] h-[8px] bg-primary rounded-full absolute filter drop-shadow-[0_0_8px_rgba(114,56,61,0.5)]" />
      </motion.div>

      {/* SHAPE 4: Right-Bottom Orbital Ring Segment */}
      <motion.div
        style={{ x: shape4X, y: shape4Y, rotate: shape4Rotate, scale: shape4Scale }}
        className="absolute w-[200px] h-[200px] border-b-4 border-r-4 border-dashed border-accent rounded-br-full opacity-70"
      />

      {/* CORE OBJECT: Center Sphere */}
      <motion.div
        style={{ scale: centerScale, rotate: centerRotate }}
        className="absolute w-[100px] h-[100px] rounded-full border border-primary/40 bg-gradient-to-br from-card/60 to-background/30 backdrop-blur-md flex items-center justify-center shadow-[inset_0_2px_8px_rgba(255,255,255,0.05)] border-white/10"
      >
        <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-tr from-primary to-accent animate-pulse flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(114,56,61,0.6)]">
          <span className="text-foreground text-xs font-bold font-mono">N</span>
        </div>
        <div className="absolute w-[70px] h-[70px] rounded-full border border-dashed border-primary animate-[spin_10s_linear_infinite]" />
      </motion.div>

      <motion.div
        style={{ opacity: useTransform(scrollYProgress, [0.6, 0.8], [0, 0.8]) }}
        className="absolute w-[280px] h-[280px] border border-white/5 rounded-full"
      />
    </div>
  );
}

// Inline Animated GL Bajaj Crest Logo
function GLBgoiLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={`${className} text-primary`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.circle 
        cx="50" cy="50" r="42" 
        stroke="currentColor" strokeWidth="2.5" strokeDasharray="10 6"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <motion.circle 
        cx="50" cy="50" r="34" 
        stroke="var(--color-accent)" strokeWidth="1.5"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <path d="M50 20L30 45H42V75H58V45H70L50 20Z" fill="currentColor" opacity="0.15" />
      <path d="M50 20L30 45H42V75H58V45H70L50 20Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="50" cy="45" r="4" fill="var(--color-accent)" />
    </svg>
  );
}

// Inline Animated NexaSphere Logo
function NexaSphereLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={`${className}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nexaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#72383d" />
          <stop offset="100%" stopColor="#ac9c8d" />
        </linearGradient>
      </defs>
      <motion.polygon
        points="50,12 85,32 85,72 50,92 15,72 15,32"
        stroke="url(#nexaGrad)"
        strokeWidth="3.5"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.circle
        cx="50"
        cy="50"
        r="24"
        stroke="#ac9c8d"
        strokeWidth="2.5"
        strokeDasharray="6 4"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <circle cx="50" cy="50" r="14" fill="url(#nexaGrad)" className="filter drop-shadow-[0_0_8px_rgba(114,56,61,0.5)]" />
    </svg>
  );
}

function MilestoneIcon({ id, className = "w-5 h-5" }: { id: number; className?: string }) {
  switch (id) {
    case 1:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case 2:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 3:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    case 4:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 5:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 6:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case 7:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 8:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 9:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        </svg>
      );
    case 10:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      );
    case 11:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
        </svg>
      );
    default:
      return null;
  }
}

// Skeleton Loader Component for Timeline
function TimelineSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-3 rounded-2xl border border-card-border bg-card/40 h-24 flex flex-col justify-between animate-pulse">
          <div className="flex justify-between items-center w-full">
            <div className="h-4 w-12 bg-card-border rounded" />
            <div className="h-6 w-6 bg-card-border rounded-full" />
          </div>
          <div>
            <div className="h-2.5 w-16 bg-card-border rounded mb-2" />
            <div className="h-3 w-24 bg-card-border rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const activePhase = SIH_MILESTONES[activePhaseIndex];

  // AnimeJS Mount Entry Animations
  useEffect(() => {
    createTimeline()
      .add('.anime-reveal', {
        opacity: [0, 1],
        y: [20, 0],
        duration: 600,
        ease: 'outQuad',
        delay: stagger(80)
      })
      .add('.anime-step-btn', {
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 500,
        ease: 'outQuad',
        delay: stagger(40)
      }, '<0.25');
  }, [timelineLoading]);

  // Handler to simulate timeline loading state
  const handleSimulateLoad = () => {
    setTimelineLoading(true);
    setTimeout(() => {
      setTimelineLoading(false);
    }, 1500);
  };

  // AnimeJS interactive spring scaling functions on Hover
  const handleScaleHoverEnter = (e: React.MouseEvent<HTMLElement>) => {
    animate(e.currentTarget, {
      scale: 1.025,
      duration: 250,
      ease: 'outQuad'
    });
  };

  const handleScaleHoverLeave = (e: React.MouseEvent<HTMLElement>) => {
    animate(e.currentTarget, {
      scale: 1,
      duration: 250,
      ease: 'outQuad'
    });
  };

  const handleCTAEnter = (e: React.MouseEvent<HTMLElement>) => {
    animate(e.currentTarget, {
      scale: 1.04,
      y: -2,
      duration: 300,
      ease: 'outQuad'
    });
  };

  const handleCTALeave = (e: React.MouseEvent<HTMLElement>) => {
    animate(e.currentTarget, {
      scale: 1,
      y: 0,
      duration: 300,
      ease: 'outQuad'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden font-sans dot-grid">
      
      {/* Background atmospheric blobs */}
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
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[150px] pointer-events-none"
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
        className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-accent/8 rounded-full filter blur-[150px] pointer-events-none"
      />

      {/* HEADER NAVBAR */}
      <header className="border-b border-card-border bg-card/30 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative p-1 rounded-xl bg-card-border/10 border border-card-border/20 backdrop-blur-sm flex items-center justify-center">
                <img src="/Logo/GL-BAJAJ-LOGO-3.png" className="w-8 h-8 object-contain" alt="GL Bajaj Logo" />
              </div>
              <div className="h-6 w-px bg-card-border/60" />
              <div className="relative p-1 rounded-xl bg-card-border/10 border border-card-border/20 backdrop-blur-sm flex items-center justify-center">
                <img src="/Logo/NexaSphere Icon without Background.png" className="w-8 h-8 object-contain" alt="NexaSphere Logo" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:neon-text-glow transition-all leading-none">
                  SIH@GLBGOI
                </span>
                <span className="text-[7px] text-muted tracking-wider uppercase font-semibold mt-0.5">
                  by NexaSphere
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold text-muted hover:text-foreground px-3.5 py-1.5 transition-colors cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onMouseEnter={handleScaleHoverEnter}
                onMouseLeave={handleScaleHoverLeave}
                className="rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all cursor-pointer"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-24 z-10">
        
        {/* Notice Banner */}
        <div className="anime-reveal w-full max-w-4xl mx-auto rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs sm:text-sm text-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 text-left">
            <span className="p-2 bg-amber-500/10 rounded-xl animate-pulse text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </span>
            <div>
              <strong className="font-bold block text-amber-200">Official SIH 2026 Problem Statements Notice</strong>
              <span className="opacity-80 text-xs leading-relaxed">Official PS are not released yet. Platform tracks are configured with all 18 official SIH Themes.</span>
            </div>
          </div>
          <a
            href="https://sih.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold transition-all"
          >
            ↗ SIH Portal
          </a>
        </div>

        {/* HERO SECTION WITH SCROLL-ASSEMBLY ANIMATION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[50vh]">
          {/* Left Column: Branding Details */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="anime-reveal inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              <img src="/Logo/GL-BAJAJ-LOGO-3.png" className="w-5 h-5 object-contain" alt="GL Bajaj Logo" />
              <span>Internal Hackathon Portal 2026</span>
            </div>
            
            <h1 className="anime-reveal text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] bg-gradient-to-r from-primary via-accent to-emerald-300 bg-clip-text text-transparent animate-gradient">
              SIH@GLBGOI
            </h1>
            
            <p className="anime-reveal text-base sm:text-lg text-muted max-w-[55ch] leading-relaxed">
              Streamline team formation, detect skill gaps, and match with verified mentors. The official internal hackathon platform of GL Bajaj Group of Institutions, Mathura.
            </p>

            <div className="anime-reveal flex flex-col sm:flex-row gap-4 w-full max-w-sm pt-2">
              <Link
                href="/login"
                onMouseEnter={handleCTAEnter}
                onMouseLeave={handleCTALeave}
                className="flex-1 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all text-center cursor-pointer"
              >
                Enter Portal
              </Link>
              <Link
                href="/signup"
                onMouseEnter={handleCTAEnter}
                onMouseLeave={handleCTALeave}
                className="flex-1 rounded-xl bg-card border border-card-border px-6 py-3.5 text-sm font-bold text-foreground transition-all text-center cursor-pointer"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Right Column: Scroll-Assembly Shape Logo */}
          <div className="anime-reveal lg:col-span-5 flex flex-col items-center justify-center relative py-8">
            <ScrollAssemblyLogo />
            <span className="text-[10px] text-muted font-mono tracking-widest uppercase mt-4 animate-pulse">
              ↓ Scroll down to assemble logo
            </span>
          </div>
        </section>

        {/* LOGO WALL: Credibility strip */}
        <section className="border-y border-card-border/60 py-6 my-12 bg-card/10 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Organised by</span>
            <div className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
              <img src="/Logo/GL-BAJAJ-LOGO-2.png" className="h-10 object-contain" alt="GL Bajaj Logo" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-black tracking-tight text-foreground leading-none">GL Bajaj</span>
                <span className="text-[8px] text-muted font-mono uppercase tracking-wider -mt-0.5">Group of Institutions</span>
              </div>
            </div>
            <div className="h-px sm:h-8 w-12 sm:w-px bg-card-border" />
            <div className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
              <img src="/Logo/nexasphere-logo.png" className="h-8 object-contain" alt="NexaSphere Logo" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-black tracking-tight text-foreground leading-none">NexaSphere</span>
                <span className="text-[8px] text-muted font-mono uppercase tracking-wider -mt-0.5">Hackathon Dev-suite</span>
              </div>
            </div>
          </div>
        </section>

        {/* TIMELINE ROADMAP WITH INTEGRATED SKELETON LOADERS */}
        <section className="anime-reveal w-full glass-card rounded-3xl p-6 sm:p-8 border border-card-border text-left space-y-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-card-border pb-4">
            <div>
              <span className="text-xs font-bold text-primary tracking-wider uppercase">Milestone Roadmap</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-0.5">
                SIH 2026 Timeline Phases
              </h2>
            </div>
            <button
              onClick={handleSimulateLoad}
              disabled={timelineLoading}
              className="text-xs font-semibold text-accent hover:text-cyan-400 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
            >
              {timelineLoading ? 'Simulating...' : '🔄 Simulate Skeleton Loading'}
            </button>
          </div>

          {timelineLoading ? (
            <TimelineSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Timeline Horizontal Stepper Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {SIH_MILESTONES.map((item, index) => {
                  const isActive = index === activePhaseIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePhaseIndex(index)}
                      className={`anime-step-btn p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                        isActive
                          ? 'bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-primary/50 shadow-lg shadow-primary/5'
                          : 'bg-background/20 border-card-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                          {item.phase}
                        </span>
                        <MilestoneIcon id={item.id} className="w-4 h-4 text-foreground/80" />
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold text-muted block">{item.period}</span>
                        <span className="text-[11px] font-extrabold text-foreground truncate block mt-0.5">{item.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Milestone Card Box */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePhase.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl bg-card/60 border border-card-border space-y-4 shadow-xl"
                >
                  <div className="flex items-center gap-3 border-b border-card-border pb-3">
                    <span className="p-2.5 bg-primary/10 rounded-xl"><MilestoneIcon id={activePhase.id} className="w-5 h-5 text-primary" /></span>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary">{activePhase.phase}</span>
                      <h3 className="text-lg font-bold text-foreground">{activePhase.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    {activePhase.desc}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-muted bg-background/40 p-2.5 rounded-lg border border-card-border/60">
                    <span>Expected Timeline: <strong>{activePhase.period}</strong></span>
                    <span className="text-primary font-bold">● active</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* 18 OFFICIAL SIH THEMES SLIDER BENTO */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-primary tracking-wider uppercase">SIH Themes & Domains</span>
            <h2 className="text-3xl font-extrabold text-foreground animate-reveal">
              Official Smart India Hackathon Tracks
            </h2>
            <p className="text-sm text-muted max-w-xl mx-auto animate-reveal">
              Explore the 18 official ministries themes configured directly inside the NexaSphere dev-suite portal.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Theme Navigation List (Bento left column) */}
            <div className="lg:col-span-4 space-y-2.5">
              {ALL_18_THEME_SETS.map((item, index) => {
                const isActive = index === activeSlide;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSlide(index)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                      isActive
                        ? 'bg-gradient-to-r from-card to-primary/5 border-primary text-foreground font-bold shadow-md'
                        : 'bg-card/40 border-card-border text-muted hover:text-foreground hover:border-card-border/80'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-semibold truncate">{item.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isActive ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-card-border text-muted'}`}>
                      Set 0{item.id}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Theme Detail Grid (Bento right column) */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {ALL_18_THEME_SETS[activeSlide].themes.map((theme, i) => (
                    <div
                      key={theme.name}
                      onMouseEnter={handleScaleHoverEnter}
                      onMouseLeave={handleScaleHoverLeave}
                      className="p-5 rounded-2xl border border-card-border bg-card/60 shadow-xl flex flex-col justify-between h-48 text-left transition-all duration-300"
                    >
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-accent tracking-wider uppercase font-mono">Theme 0{i + 1}</span>
                        <h3 className="text-sm font-extrabold text-foreground line-clamp-2">{theme.name}</h3>
                      </div>
                      <p className="text-xs text-muted leading-relaxed line-clamp-3">
                        {theme.desc}
                      </p>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-card-border/60 bg-card/20 py-8 text-center text-xs text-muted relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 sm:gap-4 justify-center">
            <div className="relative p-1 rounded-xl bg-card-border/10 border border-card-border/20 backdrop-blur-sm flex items-center justify-center">
              <img src="/Logo/GL-BAJAJ-LOGO-3.png" className="w-6 h-6 object-contain" alt="GL Bajaj Logo" />
            </div>
            <div className="h-4 w-px bg-card-border/60" />
            <div className="relative p-1 rounded-xl bg-card-border/10 border border-card-border/20 backdrop-blur-sm flex items-center justify-center">
              <img src="/Logo/NexaSphere Icon without Background.png" className="w-6 h-6 object-contain" alt="NexaSphere Logo" />
            </div>
            <span className="font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SIH@GLBGOI
            </span>
          </div>
          <span>&copy; 2026 NexaSphere. Supported by GL Bajaj Group of Institutions, Mathura.</span>
        </div>
      </footer>
    </div>
  );
}
