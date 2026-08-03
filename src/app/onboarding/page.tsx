'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Track {
  id: string;
  name: string;
  problemStatementCode: string;
}

// Predefined Avatars with high-end tech themes
const AVATAR_PRESETS = [
  { id: 'hacker', name: 'Cyber Hacker', emoji: '🥷', color: 'from-cyan-500 to-blue-500' },
  { id: 'developer', name: 'Tech Dev', emoji: '💻', color: 'from-blue-500 to-indigo-500' },
  { id: 'designer', name: 'UI Designer', emoji: '🎨', color: 'from-pink-500 to-rose-500' },
  { id: 'scientist', name: 'AI Scientist', emoji: '🧪', color: 'from-emerald-500 to-teal-500' },
  { id: 'manager', name: 'Team Lead', emoji: '👑', color: 'from-amber-500 to-yellow-500' },
  { id: 'writer', name: 'Tech Writer', emoji: '✍️', color: 'from-teal-500 to-blue-600' },
];

// Categorized Technical Skills
const SKILL_CATEGORIES = {
  Frontend: ['React', 'HTML', 'CSS', 'JavaScript', 'Next.js', 'Tailwind', 'Vue', 'Angular', 'TypeScript'],
  Backend: ['Node.js', 'Express', 'Python', 'Django', 'Go', 'Java', 'Spring Boot', 'PostgreSQL', 'MongoDB', 'Docker'],
  'UI/UX': ['Figma', 'Adobe XD', 'Canva', 'Prototyping', 'Wireframing', 'User Research'],
  Others: ['Git', 'Machine Learning', 'OpenCV', 'TensorFlow', 'PyTorch', 'REST APIs', 'Cloud Computing', 'SQL'],
};

// Skill recommendations dictionary
const SKILL_RECOMMENDATIONS: { [key: string]: string[] } = {
  react: ['Tailwind', 'Next.js', 'TypeScript', 'JavaScript'],
  html: ['CSS', 'JavaScript', 'Tailwind'],
  css: ['HTML', 'Tailwind', 'Figma'],
  javascript: ['React', 'Node.js', 'TypeScript', 'Git'],
  'next.js': ['React', 'TypeScript', 'Tailwind', 'Node.js'],
  figma: ['UI/UX Design', 'Canva', 'Prototyping', 'CSS'],
  python: ['Machine Learning', 'Django', 'SQL', 'TensorFlow'],
  'node.js': ['Express', 'PostgreSQL', 'MongoDB', 'JavaScript'],
  git: ['Docker', 'Next.js', 'React', 'APIs'],
};

const OFFICIAL_LANGUAGES = [
  'Sanskrit', 'Punjabi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Malayalam', 'Gujarati', 'Marathi', 'Urdu', 'Assamese', 'Kashmiri', 'Konkani', 'Nepali', 'Odia'
];

export default function OnboardingPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Student form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    year: '3rd Year',
    branch: 'CSE',
    githubUrl: '',
    linkedinUrl: '',
    resumeUrl: '',
    avatarUrl: 'developer', // Default preset
    trackInterest: [] as string[],
  });

  // Skills state
  const [lockedSkills, setLockedSkills] = useState<string[]>([]);
  const [customSkillsText, setCustomSkillsText] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  // Detailed Language & Fluency State
  const [languages, setLanguages] = useState<{ [key: string]: 'Basic' | 'Moderate' | 'Fluent' | null }>({
    English: null,
    Hindi: null,
  });

  // Selected Soft Skills
  const [selectedSoftSkills, setSelectedSoftSkills] = useState<string[]>([]);

  const handleAvatarUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for your profile photo.');
      return;
    }
    if (file.size > 1_500_000) {
      setError('Please choose a photo smaller than 1.5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setStudentForm((previous) => ({ ...previous, avatarUrl: String(reader.result) }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // Mentor form state
  const [mentorForm, setMentorForm] = useState({
    name: '',
    designation: '',
    organization: 'GL Bajaj Group of Institutions',
    expertiseInput: '',
    capacity: 2,
    bio: '',
    linkedinUrl: '',
  });

  const softSkillsOptions = ['PPT Making', 'Public Speaking/Presenting', 'Technical Writing', 'UI/UX Design', 'Video Editing', 'Management'];
  const branchOptions = ['CSE', 'CSE (AIML)', 'CSE (DS)', 'CSE (IoT)', 'IT', 'CS', 'CS (AIML)'];
  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  useEffect(() => {
    async function initOnboarding() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();

        if (!meData.authenticated) {
          router.push('/login');
          return;
        }

        setSession(meData.user);

        if (meData.user.role === 'STUDENT') {
          setStudentForm((prev) => ({ ...prev, name: meData.user.name }));
        } else {
          setMentorForm((prev) => ({ ...prev, name: meData.user.name }));
        }

        if (meData.user.isOnboarded) {
          router.push('/dashboard');
          return;
        }

        const tracksRes = await fetch('/api/tracks');
        const tracksData = await tracksRes.json();
        if (tracksData.success) {
          setTracks(tracksData.tracks);
        }
      } catch (err) {
        console.error('Onboarding init failed:', err);
      } finally {
        setLoading(false);
      }
    }

    initOnboarding();
  }, [router]);

  const handleStudentSubmit = async () => {
    setError('');
    setSubmitting(true);

    // Merge locked skills and custom typed skills
    const custom = customSkillsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');
    const finalSkills = Array.from(new Set([...lockedSkills, ...custom]));

    // Format languages: e.g. ["English (Fluent)", "Hindi (Moderate)"]
    const formattedLanguages = Object.entries(languages)
      .filter(([_, level]) => level !== null)
      .map(([lang, level]) => `${lang} (${level})`);

    try {
      const res = await fetch('/api/profile/student', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentForm.name,
          year: studentForm.year,
          branch: studentForm.branch,
          skills: finalSkills,
          languages: formattedLanguages,
          softSkills: selectedSoftSkills,
          resumeUrl: studentForm.resumeUrl,
          githubUrl: studentForm.githubUrl,
          linkedinUrl: studentForm.linkedinUrl,
          avatarUrl: studentForm.avatarUrl,
          trackInterest: studentForm.trackInterest,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setSubmitting(false);
    }
  };

  const handleMentorSubmit = async () => {
    setError('');
    setSubmitting(true);

    const expertise = mentorForm.expertiseInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');

    try {
      const res = await fetch('/api/profile/mentor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mentorForm.name,
          designation: mentorForm.designation,
          organization: mentorForm.organization,
          expertise,
          capacity: mentorForm.capacity,
          bio: mentorForm.bio,
          linkedinUrl: mentorForm.linkedinUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setSubmitting(false);
    }
  };

  const toggleSoftSkill = (skill: string) => {
    if (selectedSoftSkills.includes(skill)) {
      setSelectedSoftSkills(selectedSoftSkills.filter((s) => s !== skill));
    } else {
      setSelectedSoftSkills([...selectedSoftSkills, skill]);
    }
  };

  const toggleSkillTile = (skill: string) => {
    if (lockedSkills.includes(skill)) {
      setLockedSkills(lockedSkills.filter((s) => s !== skill));
    } else {
      setLockedSkills([...lockedSkills, skill]);
    }
  };

  // Recommendations builder based on lockedSkills
  const getRecommendations = () => {
    const recommended = new Set<string>();
    lockedSkills.forEach((s) => {
      const list = SKILL_RECOMMENDATIONS[s.toLowerCase()];
      if (list) {
        list.forEach((rec) => {
          if (!lockedSkills.includes(rec)) {
            recommended.add(rec);
          }
        });
      }
    });
    return Array.from(recommended).slice(0, 5);
  };

  // Real-time skill chart calculations (Frontend, Backend, UIUX, Others)
  const getSkillCategoryCounts = () => {
    const counts = { Frontend: 0, Backend: 0, UIUX: 0, Others: 0 };
    lockedSkills.forEach((skill) => {
      if (SKILL_CATEGORIES.Frontend.includes(skill)) counts.Frontend++;
      else if (SKILL_CATEGORIES.Backend.includes(skill)) counts.Backend++;
      else if (SKILL_CATEGORIES['UI/UX'].includes(skill)) counts.UIUX++;
      else counts.Others++;
    });
    return counts;
  };

  const counts = getSkillCategoryCounts();
  const totalCounts = counts.Frontend + counts.Backend + counts.UIUX + counts.Others;

  // Chart SVG calculations
  const chartAngles = (() => {
    if (totalCounts === 0) return { frontend: 360, backend: 0, uiux: 0, others: 0 };
    return {
      frontend: (counts.Frontend / totalCounts) * 360,
      backend: (counts.Backend / totalCounts) * 360,
      uiux: (counts.UIUX / totalCounts) * 360,
      others: (counts.Others / totalCounts) * 360,
    };
  })();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg">Loading onboarding wizard...</p>
      </div>
    );
  }

  const isStudent = session?.role === 'STUDENT';
  const fluencyMap = {
    Basic: '33%',
    Moderate: '66%',
    Fluent: '100%',
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl space-y-8 z-10">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-sm text-muted">
            Configure your {isStudent ? 'student' : 'mentor'} identity for SIH@GLBGOI
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-card-border relative overflow-hidden">
          {error && (
            <div className="mb-6 rounded-lg bg-red-950/40 p-4 text-sm text-red-400 border border-red-900/30">
              {error}
            </div>
          )}

          {isStudent ? (
            /* Student Onboarding Form */
            <div className="space-y-6">
              {/* Step Indicators */}
              <div className="flex justify-between items-center mb-8 border-b border-card-border pb-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                        step === s ? 'bg-primary text-white' : step > s ? 'bg-green-600 text-white' : 'bg-card border border-card-border text-muted'
                      }`}
                    >
                      {s}
                    </div>
                    <span className={`text-xs font-semibold ${step === s ? 'text-primary' : 'text-muted'}`}>
                      {s === 1 ? 'Academic' : s === 2 ? 'Skills & Fluency' : 'Preferences'}
                    </span>
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-bold text-foreground">Academic Information</h3>
                    
                    {/* Tech Character Avatar Presets Selector */}
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider">Profile photo</label>
                        <label className="cursor-pointer text-xs font-semibold text-primary hover:text-primary-hover">
                          Upload your own
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => handleAvatarUpload(event.target.files?.[0])}
                          />
                        </label>
                      </div>
                      <p className="mb-3 text-xs text-muted">Use a square photo (up to 1.5 MB), or choose a preset below.</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {AVATAR_PRESETS.map((preset) => {
                          const isSelected = studentForm.avatarUrl === preset.id;
                          return (
                            <motion.button
                              key={preset.id}
                              type="button"
                              onClick={() => setStudentForm({ ...studentForm, avatarUrl: preset.id })}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? `bg-primary/5 border-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]`
                                  : 'bg-background/30 border-card-border hover:border-card-border/80'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${preset.color} flex items-center justify-center text-xl shadow-md`}>
                                {preset.emoji}
                              </div>
                              <span className="text-[9px] mt-1.5 font-bold text-foreground truncate max-w-full">{preset.name}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Name</label>
                      <input
                        type="text"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground">Year of Study</label>
                        <select
                          value={studentForm.year}
                          onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                        >
                          {yearOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-card text-foreground">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">Academic Branch</label>
                        <select
                          value={studentForm.branch}
                          onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                        >
                          {branchOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-card text-foreground">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => setStep(2)}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        Next Step
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-bold text-foreground">Skills & Language Fluency</h3>

                    {/* Technical Skills Categorized Tiles & Search */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-foreground">Technical Skills</label>
                        <span className="text-[10px] text-muted font-semibold">{lockedSkills.length} selected</span>
                      </div>

                      {/* Live search input */}
                      <input
                        type="text"
                        placeholder="Search standard skills (e.g. React, Python)..."
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        className="w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                      />

                      {/* Grid of categorized tiles */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-56 overflow-y-auto border border-card-border rounded-xl p-3 bg-background/20 custom-scroll">
                        {Object.entries(SKILL_CATEGORIES).map(([categoryName, skillsList]) => {
                          const filtered = skillsList.filter((s) => s.toLowerCase().includes(skillSearch.toLowerCase()));
                          if (filtered.length === 0) return null;
                          return (
                            <div key={categoryName} className="space-y-2">
                              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">{categoryName}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {filtered.map((skill) => {
                                  const isSelected = lockedSkills.includes(skill);
                                  return (
                                    <motion.button
                                      key={skill}
                                      type="button"
                                      onClick={() => toggleSkillTile(skill)}
                                      whileHover={{ scale: 1.05 }}
                                      className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                                          : 'bg-card border-card-border text-muted hover:border-primary/20 hover:text-foreground'
                                      }`}
                                    >
                                      {skill} {isSelected && '🔒'}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Recommendations */}
                      {getRecommendations().length > 0 && (
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-1.5">
                          <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Recommended for you</span>
                          <div className="flex flex-wrap gap-1.5">
                            {getRecommendations().map((rec) => (
                              <button
                                key={rec}
                                type="button"
                                onClick={() => toggleSkillTile(rec)}
                                className="px-2 py-0.5 text-[10px] bg-background/50 border border-card-border hover:border-primary/20 rounded-md text-foreground transition-all cursor-pointer"
                              >
                                + {rec}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Free-text Custom input */}
                      <div>
                        <span className="text-[10px] text-muted font-bold block mb-1">Add Custom Skills</span>
                        <input
                          type="text"
                          placeholder="Or type other skills (comma separated)"
                          value={customSkillsText}
                          onChange={(e) => setCustomSkillsText(e.target.value)}
                          className="w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary placeholder-muted"
                        />
                      </div>

                      {/* Dynamic Skill Donut/Pie Chart Visualization (non-competitive) */}
                      {lockedSkills.length > 0 && (
                        <div className="p-4 bg-background/50 border border-card-border rounded-xl flex flex-col sm:flex-row items-center gap-6">
                          {/* SVG Donut Chart */}
                          <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              {/* Empty baseline ring */}
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#27272a" strokeWidth="2.5" />
                              
                              {/* Frontend Ring */}
                              {chartAngles.frontend > 0 && (
                                <circle
                                  cx="18" cy="18" r="15.915"
                                  fill="transparent"
                                  stroke="#6366f1"
                                  strokeWidth="2.5"
                                  strokeDasharray={`${(chartAngles.frontend / 360) * 100} ${100 - (chartAngles.frontend / 360) * 100}`}
                                  strokeDashoffset="0"
                                />
                              )}

                              {/* Backend Ring */}
                              {chartAngles.backend > 0 && (
                                <circle
                                  cx="18" cy="18" r="15.915"
                                  fill="transparent"
                                  stroke="#a78bfa"
                                  strokeWidth="2.5"
                                  strokeDasharray={`${(chartAngles.backend / 360) * 100} ${100 - (chartAngles.backend / 360) * 100}`}
                                  strokeDashoffset={`-${((chartAngles.frontend) / 360) * 100}`}
                                />
                              )}

                              {/* UIUX Ring */}
                              {chartAngles.uiux > 0 && (
                                <circle
                                  cx="18" cy="18" r="15.915"
                                  fill="transparent"
                                  stroke="#ec4899"
                                  strokeWidth="2.5"
                                  strokeDasharray={`${(chartAngles.uiux / 360) * 100} ${100 - (chartAngles.uiux / 360) * 100}`}
                                  strokeDashoffset={`-${((chartAngles.frontend + chartAngles.backend) / 360) * 100}`}
                                />
                              )}

                              {/* Others Ring */}
                              {chartAngles.others > 0 && (
                                <circle
                                  cx="18" cy="18" r="15.915"
                                  fill="transparent"
                                  stroke="#14b8a6"
                                  strokeWidth="2.5"
                                  strokeDasharray={`${(chartAngles.others / 360) * 100} ${100 - (chartAngles.others / 360) * 100}`}
                                  strokeDashoffset={`-${((chartAngles.frontend + chartAngles.backend + chartAngles.uiux) / 360) * 100}`}
                                />
                              )}
                            </svg>
                            <div className="absolute text-[9px] font-bold text-muted uppercase">Balance</div>
                          </div>

                          <div className="flex-1 space-y-1.5 text-xs text-foreground">
                            <span className="font-bold text-muted block mb-1">Your Skills Balance:</span>
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-primary rounded-full" /> Frontend: {counts.Frontend}</span>
                              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-accent rounded-full" /> Backend: {counts.Backend}</span>
                              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-pink-500 rounded-full" /> UI/UX: {counts.UIUX}</span>
                              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-teal-500 rounded-full" /> Others: {counts.Others}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Language Fluency Section (English, Hindi open by default, dropdown select toggle to add others) */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-foreground">Language Fluency</label>
                        
                        {/* Dropdown to add official Indian language */}
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !languages[val]) {
                              setLanguages({ ...languages, [val]: null });
                            }
                            e.target.value = ''; // Reset dropdown selector
                          }}
                          className="bg-card border border-card-border text-xs rounded px-2.5 py-1 text-foreground focus:outline-none cursor-pointer"
                        >
                          <option value="">+ Add language</option>
                          {OFFICIAL_LANGUAGES.filter((lang) => !languages[lang]).map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(languages).map(([lang, level]) => {
                          return (
                            <div
                              key={lang}
                              className={`border rounded-xl p-4 transition-all duration-300 relative ${
                                level
                                  ? 'bg-primary/5 border-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                                  : 'bg-background/20 border-card-border hover:border-card-border/80'
                              }`}
                            >
                              {/* Remove language button */}
                              {lang !== 'English' && lang !== 'Hindi' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...languages };
                                    delete updated[lang];
                                    setLanguages(updated);
                                  }}
                                  className="absolute top-2 right-2 text-xs text-muted hover:text-red-400 font-bold"
                                >
                                  ×
                                </button>
                              )}

                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-foreground">{lang}</span>
                                {level && <span className="text-xs text-primary font-semibold">{level}</span>}
                              </div>

                              {/* Fluency level selectors */}
                              <div className="grid grid-cols-3 gap-1.5 mb-3">
                                {['Basic', 'Moderate', 'Fluent'].map((lvl) => (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setLanguages({ ...languages, [lang]: lvl as any })}
                                    className={`py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                                      level === lvl
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-card border-card-border text-muted hover:text-foreground'
                                    }`}
                                  >
                                    {lvl}
                                  </button>
                                ))}
                              </div>

                              {/* Fluency Animated Progress Meter */}
                              <motion.div
                                layout
                                className="w-full h-2.5 bg-card-border rounded-full overflow-hidden relative pop-out-hover border border-card-border"
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: level ? fluencyMap[level] : 0 }}
                                  transition={{ type: 'spring', stiffness: 60, damping: 10 }}
                                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                />
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Soft Skills badges grid */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Presenting & Soft Skills</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {softSkillsOptions.map((opt) => {
                          const isSelected = selectedSoftSkills.includes(opt);
                          return (
                            <motion.button
                              key={opt}
                              type="button"
                              onClick={() => toggleSoftSkill(opt)}
                              whileHover={{ scale: 1.025 }}
                              whileTap={{ scale: 0.975 }}
                              className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-accent/10 border-accent/40 text-accent shadow-[0_0_15px_rgba(167,139,250,0.05)]'
                                  : 'bg-background/30 border-card-border text-muted hover:border-card-border/80 hover:text-foreground'
                              }`}
                            >
                              {opt}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between border-t border-card-border/50">
                      <button
                        onClick={() => setStep(1)}
                        className="rounded-lg bg-card border border-card-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-background transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        Next Step
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-foreground">Preferences & Social Links</h3>

                    {/* Track Interest Selector */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Preferred SIH Problem Statements</label>
                      <div className="space-y-2 max-h-44 overflow-y-auto border border-card-border rounded-lg p-3 bg-background/30 custom-scroll">
                        {tracks.map((track) => (
                          <label key={track.id} className="flex items-start text-xs text-foreground cursor-pointer p-1.5 hover:bg-card-border/30 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={studentForm.trackInterest.includes(track.id)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...studentForm.trackInterest, track.id]
                                  : studentForm.trackInterest.filter((t) => t !== track.id);
                                setStudentForm({ ...studentForm, trackInterest: updated });
                              }}
                              className="rounded border-card-border text-primary bg-background/50 focus:ring-primary mr-2.5 mt-0.5"
                            />
                            <div>
                              <span className="font-semibold text-primary">{track.problemStatementCode}: </span>
                              {track.name}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground">GitHub Profile</label>
                        <input
                          type="url"
                          placeholder="https://github.com/username"
                          value={studentForm.githubUrl}
                          onChange={(e) => setStudentForm({ ...studentForm, githubUrl: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary placeholder-muted"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">LinkedIn Profile</label>
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/username"
                          value={studentForm.linkedinUrl}
                          onChange={(e) => setStudentForm({ ...studentForm, linkedinUrl: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary placeholder-muted"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Resume Link</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/... (Make link public)"
                        value={studentForm.resumeUrl}
                        onChange={(e) => setStudentForm({ ...studentForm, resumeUrl: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary placeholder-muted"
                      />
                    </div>

                    <div className="pt-4 flex justify-between border-t border-card-border/50">
                      <button
                        onClick={() => setStep(2)}
                        className="rounded-lg bg-card border border-card-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-background transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleStudentSubmit}
                        disabled={submitting}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        {submitting ? 'Saving Profile...' : 'Complete Onboarding'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Mentor Onboarding Form */
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-8 border-b border-card-border pb-4">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                        step === s ? 'bg-primary text-white' : step > s ? 'bg-green-600 text-white' : 'bg-card border border-card-border text-muted'
                      }`}
                    >
                      {s}
                    </div>
                    <span className={`text-xs font-semibold ${step === s ? 'text-primary' : 'text-muted'}`}>
                      {s === 1 ? 'Professional Info' : 'Expertise & Bio'}
                    </span>
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="mentorStep1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-foreground">Professional Info</h3>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Name</label>
                      <input
                        type="text"
                        value={mentorForm.name}
                        onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Designation / Role</label>
                      <input
                        type="text"
                        placeholder="Assistant Professor / Tech Lead"
                        value={mentorForm.designation}
                        onChange={(e) => setMentorForm({ ...mentorForm, designation: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary placeholder-muted"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Organization / Dept</label>
                      <input
                        type="text"
                        value={mentorForm.organization}
                        onChange={(e) => setMentorForm({ ...mentorForm, organization: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => setStep(2)}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        Next Step
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="mentorStep2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-foreground">Expertise & Stated Capacity</h3>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Expertise Tags</label>
                      <input
                        type="text"
                        placeholder="Machine Learning, Blockchain, IoT, App Development (comma separated)"
                        value={mentorForm.expertiseInput}
                        onChange={(e) => setMentorForm({ ...mentorForm, expertiseInput: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Max Team Mentoring Capacity</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={mentorForm.capacity}
                        onChange={(e) => setMentorForm({ ...mentorForm, capacity: parseInt(e.target.value) || 2 })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Short Biography</label>
                      <textarea
                        placeholder="Brief details about your mentorship domain or past projects guided..."
                        rows={3}
                        value={mentorForm.bio}
                        onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">LinkedIn Profile</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={mentorForm.linkedinUrl}
                        onChange={(e) => setMentorForm({ ...mentorForm, linkedinUrl: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary placeholder-muted"
                      />
                    </div>

                    <div className="pt-4 flex justify-between border-t border-card-border/50">
                      <button
                        onClick={() => setStep(1)}
                        className="rounded-lg bg-card border border-card-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-background transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleMentorSubmit}
                        disabled={submitting}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        {submitting ? 'Saving Profile...' : 'Complete Onboarding'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
