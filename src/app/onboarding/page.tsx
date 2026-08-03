'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { animate } from 'animejs';

interface Track {
  id: string;
  name: string;
  problemStatementCode: string;
  organization?: string;
  category?: string;
  description?: string;
  sihUrl?: string;
  youtubeUrl?: string;
}

// Flat pool of standard technical and engineering skills
const STANDARD_SKILL_POOL = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Next.js', 'HTML', 'CSS',
  'Tailwind', 'Vue', 'Angular', 'Express', 'Django', 'Go', 'Java', 'Spring Boot',
  'PostgreSQL', 'MongoDB', 'Docker', 'Figma', 'Adobe XD', 'Canva', 'Prototyping',
  'Wireframing', 'User Research', 'Git', 'Machine Learning', 'OpenCV', 'TensorFlow',
  'PyTorch', 'REST APIs', 'Cloud Computing', 'SQL', 'Flutter', 'React Native', 'AWS',
  'Kubernetes', 'Cybersecurity', 'C++', 'C#', 'Rust'
];

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

// Helper to classify skill into category and return distinct vibrant theme styling
const getSkillCategoryStyle = (skill: string) => {
  const s = skill.toLowerCase();
  if (s.includes('react') || s.includes('html') || s.includes('css') || s.includes('tailwind') || s.includes('vue') || s.includes('angular') || s.includes('next') || s.includes('frontend')) {
    return {
      category: 'Frontend Web',
      color: '#38bdf8',
      activeBg: 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.35)]',
      inactiveBg: 'bg-card/80 border-card-border text-muted hover:border-cyan-500/40 hover:text-cyan-200',
    };
  }
  if (s.includes('node') || s.includes('express') || s.includes('python') || s.includes('django') || s.includes('go') || s.includes('java') || s.includes('spring') || s.includes('postgres') || s.includes('mongo') || s.includes('sql') || s.includes('backend')) {
    return {
      category: 'Backend & DB',
      color: '#34d399',
      activeBg: 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.35)]',
      inactiveBg: 'bg-card/80 border-card-border text-muted hover:border-emerald-500/40 hover:text-emerald-200',
    };
  }
  if (s.includes('machine') || s.includes('learning') || s.includes('opencv') || s.includes('tensor') || s.includes('pytorch') || s.includes('docker') || s.includes('cloud') || s.includes('aws') || s.includes('kubernetes') || s.includes('git') || s.includes('api') || s.includes('cyber') || s.includes('rust') || s.includes('c++') || s.includes('c#')) {
    return {
      category: 'AI & Cloud & Tools',
      color: '#c084fc',
      activeBg: 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(192,132,252,0.35)]',
      inactiveBg: 'bg-card/80 border-card-border text-muted hover:border-purple-500/40 hover:text-purple-200',
    };
  }
  if (s.includes('figma') || s.includes('adobe') || s.includes('canva') || s.includes('proto') || s.includes('wire') || s.includes('research') || s.includes('design') || s.includes('ux') || s.includes('ui') || s.includes('video') || s.includes('ppt')) {
    return {
      category: 'Design & Prototyping',
      color: '#f472b6',
      activeBg: 'bg-pink-500/20 border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.35)]',
      inactiveBg: 'bg-card/80 border-card-border text-muted hover:border-pink-500/40 hover:text-pink-200',
    };
  }
  return {
    category: 'General & Soft Skills',
    color: '#818cf8',
    activeBg: 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-[0_0_12px_rgba(129,140,248,0.35)]',
    inactiveBg: 'bg-card/80 border-card-border text-muted hover:border-indigo-500/40 hover:text-indigo-200',
  };
};

const classifySkillDomain = (name: string): 'Engineering' | 'Design' | 'Communication' => {
  const n = name.toLowerCase();
  if (
    n.includes('figma') || n.includes('design') || n.includes('ux') ||
    n.includes('ui') || n.includes('adobe') || n.includes('canva') ||
    n.includes('wireframe') || n.includes('prototype') || n.includes('editing') ||
    n.includes('ppt')
  ) {
    return 'Design';
  }
  if (
    n.includes('speaking') || n.includes('writing') || n.includes('management') ||
    n.includes('english') || n.includes('hindi') || n.includes('sanskrit') ||
    n.includes('punjabi') || n.includes('tamil') || n.includes('telugu') ||
    n.includes('bengali') || n.includes('marathi') || n.includes('gujarati') ||
    n.includes('kannada') || n.includes('malayalam')
  ) {
    return 'Communication';
  }
  return 'Engineering';
};

export default function OnboardingPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Student form state - complete academic & personal details
  const [studentForm, setStudentForm] = useState({
    name: '',
    year: '',
    branch: '',
    gender: '',
    rollNo: '',
    section: '',
    githubUrl: '',
    linkedinUrl: '',
    resumeUrl: '',
    avatarUrl: '', // Profile photo upload
    trackInterest: [] as string[],
  });

  // Selected Technical Skills
  const [lockedSkills, setLockedSkills] = useState<string[]>([]);
  const [customSkillsText, setCustomSkillsText] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  // Hover state for domain breakdown (defaults to Engineering to maintain fixed height)
  const [hoveredDomain, setHoveredDomain] = useState<'Engineering' | 'Design' | 'Communication'>('Engineering');

  // Active track preview for hover summary in Step 3
  const [hoveredTrack, setHoveredTrack] = useState<Track | null>(null);

  // Language & Fluency State
  const [languages, setLanguages] = useState<{ [key: string]: 'Basic' | 'Moderate' | 'Fluent' | null }>({
    English: null,
    Hindi: null,
  });

  // Selected Soft Skills
  const [selectedSoftSkills, setSelectedSoftSkills] = useState<string[]>([]);

  const handleAvatarUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, WEBP) for your profile photo.');
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
  const branchOptions = ['CSE', 'CSE (AI/ML)', 'CS'];
  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

  useEffect(() => {
    async function initOnboarding() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const isEditMode = searchParams.get('edit') === 'true';

        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();

        if (!meData.authenticated) {
          router.push('/login');
          return;
        }

        setSession(meData.user);

        // Pre-fill profile data from dashboard API
        const dashRes = await fetch('/api/dashboard');
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          const prof = dashData.profile;
          if (prof) {
            if (meData.user.role === 'STUDENT') {
              setStudentForm({
                name: prof.name || meData.user.name || '',
                year: prof.year || '',
                branch: prof.branch || '',
                gender: prof.gender || '',
                rollNo: prof.rollNo || '',
                section: prof.section || '',
                githubUrl: prof.githubUrl || '',
                linkedinUrl: prof.linkedinUrl || '',
                resumeUrl: prof.resumeUrl || '',
                avatarUrl: prof.avatarUrl || '', // Preserves uploaded avatar URL
                trackInterest: prof.trackInterest || [],
              });
              if (Array.isArray(prof.skills) && prof.skills.length > 0) {
                setLockedSkills(prof.skills);
              }
              if (Array.isArray(prof.softSkills) && prof.softSkills.length > 0) {
                setSelectedSoftSkills(prof.softSkills);
              }
              if (Array.isArray(prof.languages) && prof.languages.length > 0) {
                const langMap: { [key: string]: 'Basic' | 'Moderate' | 'Fluent' | null } = { English: null, Hindi: null };
                prof.languages.forEach((item: string) => {
                  const match = item.match(/^(.+?)\s*\((Basic|Moderate|Fluent)\)$/);
                  if (match) {
                    langMap[match[1]] = match[2] as any;
                  }
                });
                setLanguages(langMap);
              }
            } else {
              setMentorForm({
                name: prof.name || meData.user.name || '',
                designation: prof.designation || '',
                organization: prof.organization || 'GL Bajaj Group of Institutions',
                expertiseInput: Array.isArray(prof.expertise) ? prof.expertise.join(', ') : '',
                capacity: prof.capacity || 2,
                bio: prof.bio || '',
                linkedinUrl: prof.linkedinUrl || '',
              });
            }
          }
        }

        if (meData.user.isOnboarded && !isEditMode) {
          router.push('/dashboard');
          return;
        }

        const tracksRes = await fetch('/api/tracks');
        const tracksData = await tracksRes.json();
        if (tracksData.success) {
          setTracks(tracksData.tracks);
          if (tracksData.tracks.length > 0) {
            setHoveredTrack(tracksData.tracks[0]);
          }
        }
      } catch (err) {
        console.error('Onboarding init failed:', err);
      } finally {
        setLoading(false);
      }
    }

    initOnboarding();
  }, [router]);

  // Anime.js motion trigger whenever selected skills change
  useEffect(() => {
    if (typeof window !== 'undefined' && step === 2) {
      animate('.pie-chart-glow', {
        scale: [0.98, 1.02, 1],
        opacity: [0.8, 1],
        duration: 400,
        ease: 'outQuad',
      });
    }
  }, [lockedSkills, selectedSoftSkills, languages, step]);

  // Strict Validation logic for Student Form
  const validateStudentStep1 = () => {
    if (!studentForm.avatarUrl || !studentForm.avatarUrl.startsWith('data:image/')) {
      setError('Profile photo is mandatory. Please upload a clear photo of yourself.');
      return false;
    }
    if (!studentForm.name.trim()) {
      setError('Name is mandatory. Please enter your full name.');
      return false;
    }
    if (!studentForm.gender) {
      setError('Gender is mandatory. Please select your gender.');
      return false;
    }
    if (!studentForm.rollNo.trim()) {
      setError('University Roll Number is mandatory. Please enter your roll number.');
      return false;
    }
    if (!studentForm.year) {
      setError('Year of Study is mandatory. Please select your year of study.');
      return false;
    }
    if (!studentForm.branch) {
      setError('Academic Branch is mandatory. Please select your academic branch.');
      return false;
    }
    if (!studentForm.section) {
      setError('Section is mandatory. Please select your section.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStudentStep2 = () => {
    const custom = customSkillsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');
    const totalSkills = Array.from(new Set([...lockedSkills, ...custom]));

    if (totalSkills.length === 0) {
      setError('Technical skills are mandatory. Please select or add at least one skill.');
      return false;
    }

    const selectedLangs = Object.entries(languages).filter(([_, lvl]) => lvl !== null);
    if (selectedLangs.length === 0) {
      setError('Language fluency is mandatory. Please specify fluency for at least one language.');
      return false;
    }

    if (selectedSoftSkills.length === 0) {
      setError('Presenting / Soft skills are mandatory. Please select at least one skill.');
      return false;
    }

    setError('');
    return true;
  };

  const validateStudentStep3 = () => {
    if (studentForm.trackInterest.length === 0) {
      setError('Preferred Problem Statements are mandatory. Please select at least one track.');
      return false;
    }
    if (!studentForm.githubUrl.trim()) {
      setError('GitHub profile URL is mandatory. Please enter your GitHub link.');
      return false;
    }
    if (!studentForm.linkedinUrl.trim()) {
      setError('LinkedIn profile URL is mandatory. Please enter your LinkedIn link.');
      return false;
    }

    setError('');
    return true;
  };

  const validateMentorStep1 = () => {
    if (!mentorForm.name.trim()) {
      setError('Name is mandatory. Please enter your full name.');
      return false;
    }
    if (!mentorForm.designation.trim()) {
      setError('Designation is mandatory. Please enter your designation/role.');
      return false;
    }
    if (!mentorForm.organization.trim()) {
      setError('Organization is mandatory. Please enter your organization/department.');
      return false;
    }
    setError('');
    return true;
  };

  const validateMentorStep2 = () => {
    if (!mentorForm.expertiseInput.trim()) {
      setError('Expertise tags are mandatory. Please enter your areas of expertise.');
      return false;
    }
    if (!mentorForm.capacity || mentorForm.capacity < 1) {
      setError('Mentoring capacity is mandatory.');
      return false;
    }
    if (!mentorForm.bio.trim()) {
      setError('Short biography is mandatory. Please enter a brief bio.');
      return false;
    }
    if (!mentorForm.linkedinUrl.trim()) {
      setError('LinkedIn profile URL is mandatory. Please enter your LinkedIn link.');
      return false;
    }
    setError('');
    return true;
  };

  const handleStudentSubmit = async () => {
    if (!validateStudentStep3()) return;

    setError('');
    setSubmitting(true);

    const custom = customSkillsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');
    const finalSkills = Array.from(new Set([...lockedSkills, ...custom]));

    const formattedLanguages = Object.entries(languages)
      .filter(([_, level]) => level !== null)
      .map(([lang, level]) => `${lang} (${level})`);

    try {
      const res = await fetch('/api/profile/student', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentForm.name.trim(),
          year: studentForm.year,
          branch: studentForm.branch,
          gender: studentForm.gender,
          rollNo: studentForm.rollNo.trim(),
          section: studentForm.section,
          skills: finalSkills,
          languages: formattedLanguages,
          softSkills: selectedSoftSkills,
          resumeUrl: studentForm.resumeUrl.trim(),
          githubUrl: studentForm.githubUrl.trim(),
          linkedinUrl: studentForm.linkedinUrl.trim(),
          avatarUrl: studentForm.avatarUrl,
          trackInterest: studentForm.trackInterest,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile.');
      setSubmitting(false);
    }
  };

  const handleMentorSubmit = async () => {
    if (!validateMentorStep2()) return;

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
          name: mentorForm.name.trim(),
          designation: mentorForm.designation.trim(),
          organization: mentorForm.organization.trim(),
          expertise,
          capacity: mentorForm.capacity,
          bio: mentorForm.bio.trim(),
          linkedinUrl: mentorForm.linkedinUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile.');
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

  const handleAddCustomSkill = (skillInput?: string) => {
    const textToAdd = (skillInput || customSkillsText).trim();
    if (!textToAdd) return;
    const newItems = textToAdd
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');

    const updated = Array.from(new Set([...lockedSkills, ...newItems]));
    setLockedSkills(updated);
    setCustomSkillsText('');
    setSkillSearch('');
    setError('');

    animate('.custom-add-badge', {
      scale: [0.5, 1.2, 1],
      duration: 350,
      ease: 'outBack',
    });
  };

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
    return Array.from(recommended).slice(0, 6);
  };

  // Comprehensive overall skills balance across ALL selected skills, soft skills, & active languages
  const getOverallSkillBalance = () => {
    const activeLangs = Object.entries(languages).filter(([_, lvl]) => lvl !== null).map(([lang]) => lang);
    const allSelected = [...lockedSkills, ...selectedSoftSkills, ...activeLangs];

    if (allSelected.length === 0) {
      return {
        total: 0,
        engineering: { count: 0, pct: 0 },
        design: { count: 0, pct: 0 },
        communication: { count: 0, pct: 0 },
      };
    }

    let eng = 0;
    let des = 0;
    let comm = 0;

    allSelected.forEach((item) => {
      const domain = classifySkillDomain(item);
      if (domain === 'Engineering') eng++;
      else if (domain === 'Design') des++;
      else comm++;
    });

    const total = allSelected.length;
    const engPct = Math.round((eng / total) * 100);
    const desPct = Math.round((des / total) * 100);
    const commPct = Math.round((comm / total) * 100);

    return {
      total,
      engineering: { count: eng, pct: engPct },
      design: { count: des, pct: desPct },
      communication: { count: comm, pct: commPct },
    };
  };

  // Sub-breakdown for hover pop-out on Donut Slices (Frontend vs Backend vs AI vs Soft Skills)
  const getSubBreakdown = (categoryKey: string) => {
    const activeLangs = Object.entries(languages).filter(([_, lvl]) => lvl !== null).map(([lang]) => lang);
    const allSelected = [...lockedSkills, ...selectedSoftSkills, ...activeLangs];
    if (allSelected.length === 0) return [];

    if (categoryKey === 'Engineering') {
      const frontend = lockedSkills.filter((s) => getSkillCategoryStyle(s).category === 'Frontend Web');
      const backend = lockedSkills.filter((s) => getSkillCategoryStyle(s).category === 'Backend & DB');
      const aiInfra = lockedSkills.filter((s) => getSkillCategoryStyle(s).category === 'AI & Cloud & Tools');
      const engTotal = frontend.length + backend.length + aiInfra.length || 1;

      return [
        { name: 'Frontend Web', count: frontend.length, pct: Math.round((frontend.length / engTotal) * 100), color: '#38bdf8' },
        { name: 'Backend & DB', count: backend.length, pct: Math.round((backend.length / engTotal) * 100), color: '#34d399' },
        { name: 'AI, Cloud & Tools', count: aiInfra.length, pct: Math.round((aiInfra.length / engTotal) * 100), color: '#c084fc' },
      ];
    }

    if (categoryKey === 'Design') {
      const designSkills = [...lockedSkills, ...selectedSoftSkills].filter((s) => getSkillCategoryStyle(s).category === 'Design & Prototyping');
      return [
        { name: 'UI/UX & Prototyping', count: designSkills.length, pct: 100, color: '#f472b6' },
      ];
    }

    // Communication & Soft Skills
    const softs = selectedSoftSkills.filter((s) => getSkillCategoryStyle(s).category === 'General & Soft Skills');
    const commTotal = softs.length + activeLangs.length || 1;

    return [
      { name: 'Public Speaking & Mgmt', count: softs.length, pct: Math.round((softs.length / commTotal) * 100), color: '#818cf8' },
      { name: 'Multilingual Fluency', count: activeLangs.length, pct: Math.round((activeLangs.length / commTotal) * 100), color: '#fbbf24' },
    ];
  };

  const overallBalance = getOverallSkillBalance();
  const availableSkillPool = Array.from(new Set([...STANDARD_SKILL_POOL, ...lockedSkills]));
  const filteredSkillPool = availableSkillPool.filter((skill) =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg font-semibold animate-pulse text-muted">Loading onboarding wizard...</p>
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
      {/* Dynamic ambient glow backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl space-y-8 z-10">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-sm text-muted">
            Configure your {isStudent ? 'student' : 'mentor'} identity for SIH@GLBGOI
          </p>
          <p className="mt-1 text-xs text-primary font-medium">
            * All fields are mandatory to build a complete profile
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-card-border relative overflow-hidden">
          {error && (
            <div className="mb-6 rounded-lg bg-red-950/60 p-4 text-sm font-medium text-red-300 border border-red-800/50 flex items-center gap-2">
              <span className="text-red-400 font-bold">⚠️ Error:</span> {error}
            </div>
          )}

          {isStudent ? (
            /* Student Onboarding Form */
            <div className="space-y-6">
              {/* Step Indicators with Kinetic Line */}
              <div className="relative mb-8">
                <div className="flex justify-between items-center relative z-10">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center space-x-2 bg-card/80 px-3 py-1 rounded-full border border-card-border">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                          step === s ? 'bg-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' : step > s ? 'bg-green-600 text-white' : 'bg-card border border-card-border text-muted'
                        }`}
                      >
                        {s}
                      </motion.div>
                      <span className={`text-xs font-semibold ${step === s ? 'text-primary' : 'text-muted'}`}>
                        {s === 1 ? 'Academic' : s === 2 ? 'Skills & Fluency' : 'Preferences'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-bold text-foreground">Academic Information</h3>
                    
                    {/* Mandatory Profile Photo Upload with Showcase / Preview */}
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                        Profile Photo <span className="text-red-400">*</span>
                      </label>

                      {studentForm.avatarUrl ? (
                        /* Showcase uploaded profile photo preview */
                        <div className="p-4 bg-background/40 border border-card-border rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary shadow-lg bg-card flex-shrink-0">
                            {/* eslint-disable-next-html-element-suppression */}
                            <img
                              src={studentForm.avatarUrl}
                              alt="Uploaded profile preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 space-y-1 text-center sm:text-left">
                            <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-400 border border-green-500/20">
                              ✓ Photo Active & Preserved
                            </span>
                            <p className="text-xs text-foreground font-semibold">Your custom profile photo will be displayed across team search and cards.</p>
                            <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                              <label className="cursor-pointer text-xs font-semibold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-1.5 rounded-lg transition-colors inline-block">
                                Change Photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setStudentForm({ ...studentForm, avatarUrl: '' })}
                                className="text-xs font-semibold bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Interactive mandatory photo upload dropzone */
                        <label className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-card-border hover:border-primary/60 bg-background/30 rounded-2xl cursor-pointer transition-all duration-300">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-foreground">Click to Upload Your Profile Photo <span className="text-red-400">*</span></span>
                          <span className="text-xs text-muted mt-1">Mandatory photo upload (JPEG, PNG, WEBP up to 1.5 MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                          />
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={studentForm.name}
                          onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-all"
                        />
                      </div>

                      {/* Gender Selection */}
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Gender <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={studentForm.gender}
                          onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="" className="bg-card text-muted">Select Gender *</option>
                          {genderOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-card text-foreground">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* University Roll No */}
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        University Roll Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2100970100045"
                        value={studentForm.rollNo}
                        onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Year of Study <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={studentForm.year}
                          onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="" className="bg-card text-muted">Select Year *</option>
                          {yearOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-card text-foreground">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Academic Branch <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={studentForm.branch}
                          onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="" className="bg-card text-muted">Select Branch *</option>
                          {branchOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-card text-foreground">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Section Selection */}
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Section <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={studentForm.section}
                          onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="" className="bg-card text-muted">Select Section *</option>
                          {sectionOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-card text-foreground">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (validateStudentStep1()) setStep(2);
                        }}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer shadow-lg shadow-primary/25 transition-all"
                      >
                        Next Step →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-foreground">Skills & Fluency Breakdown</h3>
                      <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                        {lockedSkills.length} Technical Skills Selected
                      </span>
                    </div>

                    {/* Technical Skills Selection Pool & Real-Time Filter */}
                    <div className="space-y-4">
                      {/* Search Bar with Live Filter & Instant Add */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search or add skills (e.g. React, Python, Flutter, Go)..."
                          value={skillSearch}
                          onChange={(e) => setSkillSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (skillSearch.trim()) {
                                handleAddCustomSkill(skillSearch);
                              }
                            }
                          }}
                          className="w-full rounded-xl bg-background/50 border border-card-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary pr-32 transition-all shadow-inner"
                        />
                        {skillSearch.trim() && (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddCustomSkill(skillSearch)}
                            className="absolute right-2 top-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1"
                          >
                            + Add "{skillSearch.trim()}"
                          </motion.button>
                        )}
                      </div>

                      {/* Selected Skills Chips Row with Category-Specific Color Themes */}
                      {lockedSkills.length > 0 && (
                        <div className="p-3 bg-card/60 border border-card-border rounded-xl space-y-1.5">
                          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">
                            Your Selected Skills ({lockedSkills.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scroll">
                            {lockedSkills.map((skill) => {
                              const style = getSkillCategoryStyle(skill);
                              return (
                                <motion.span
                                  key={skill}
                                  layout
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  className={`custom-add-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${style.activeBg} cursor-pointer`}
                                  onClick={() => toggleSkillTile(skill)}
                                >
                                  ✓ {skill}
                                  <span className="hover:text-red-300 font-extrabold text-sm ml-0.5">×</span>
                                </motion.span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Unified Scrollable Skill Pool with Category Differentiated Styles */}
                      <div>
                        <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
                          Available Skill Pool (Click to select/unselect):
                        </span>
                        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto border border-card-border rounded-xl p-3.5 bg-background/30 custom-scroll">
                          {filteredSkillPool.length > 0 ? (
                            filteredSkillPool.map((skill) => {
                              const isSelected = lockedSkills.includes(skill);
                              const style = getSkillCategoryStyle(skill);
                              return (
                                <motion.button
                                  key={skill}
                                  type="button"
                                  onClick={() => toggleSkillTile(skill)}
                                  whileHover={{ scale: 1.06, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isSelected ? style.activeBg : style.inactiveBg
                                  }`}
                                >
                                  {isSelected && <span className="text-xs">✓</span>}
                                  {skill}
                                </motion.button>
                              );
                            })
                          ) : (
                            <div className="w-full text-center py-4">
                              <p className="text-xs text-muted font-medium mb-2">No matching standard skill found for "{skillSearch}"</p>
                              <button
                                type="button"
                                onClick={() => handleAddCustomSkill(skillSearch)}
                                className="text-xs font-bold bg-primary text-white px-4 py-1.5 rounded-lg shadow cursor-pointer hover:bg-primary-hover transition-all"
                              >
                                + Add Custom Skill "{skillSearch}"
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {getRecommendations().length > 0 && (
                        <div className="p-3 bg-accent/5 rounded-xl border border-accent/20 space-y-1.5">
                          <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Recommended for your stack</span>
                          <div className="flex flex-wrap gap-1.5">
                            {getRecommendations().map((rec) => (
                              <motion.button
                                key={rec}
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                onClick={() => toggleSkillTile(rec)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-background/50 border border-card-border hover:border-accent/40 rounded-lg text-foreground transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>+</span> {rec}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Skills Text Input */}
                      <div>
                        <span className="text-xs font-bold text-muted block mb-1">Type Custom Skills (Press Enter or use commas)</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. OpenCV, Solidity, Three.js..."
                            value={customSkillsText}
                            onChange={(e) => setCustomSkillsText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomSkill();
                              }
                            }}
                            className="flex-1 rounded-xl bg-background/50 border border-card-border px-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary placeholder-muted"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomSkill()}
                            className="px-4 py-2 text-xs font-bold bg-card border border-card-border hover:bg-card-border/50 text-foreground rounded-xl transition-all cursor-pointer"
                          >
                            + Add Skill
                          </button>
                        </div>
                      </div>

                      {/* STABLE, FIXED-HEIGHT Overall Skills Balance Donut / Pie Chart & Domain Split */}
                      {overallBalance.total > 0 && (
                        <div className="pie-chart-glow p-5 bg-background/50 border border-card-border rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-xl">
                          {/* SVG Donut Chart */}
                          <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#27272a" strokeWidth="3" />
                              
                              {/* Engineering Arc */}
                              {overallBalance.engineering.pct > 0 && (
                                <circle
                                  cx="18" cy="18" r="15.915"
                                  fill="transparent"
                                  stroke="#6366f1"
                                  strokeWidth={hoveredDomain === 'Engineering' ? 4.5 : 3.5}
                                  strokeDasharray={`${overallBalance.engineering.pct} ${100 - overallBalance.engineering.pct}`}
                                  strokeDashoffset="0"
                                  className="transition-all duration-200 cursor-pointer"
                                  onMouseEnter={() => setHoveredDomain('Engineering')}
                                />
                              )}
                              
                              {/* Design Arc */}
                              {overallBalance.design.pct > 0 && (
                                <circle
                                  cx="18" cy="18" r="15.915"
                                  fill="transparent"
                                  stroke="#ec4899"
                                  strokeWidth={hoveredDomain === 'Design' ? 4.5 : 3.5}
                                  strokeDasharray={`${overallBalance.design.pct} ${100 - overallBalance.design.pct}`}
                                  strokeDashoffset={`-${overallBalance.engineering.pct}`}
                                  className="transition-all duration-200 cursor-pointer"
                                  onMouseEnter={() => setHoveredDomain('Design')}
                                />
                              )}
                              
                              {/* Communication Arc */}
                              {overallBalance.communication.pct > 0 && (
                                <circle
                                  cx="18" cy="18" r="15.915"
                                  fill="transparent"
                                  stroke="#14b8a6"
                                  strokeWidth={hoveredDomain === 'Communication' ? 4.5 : 3.5}
                                  strokeDasharray={`${overallBalance.communication.pct} ${100 - overallBalance.communication.pct}`}
                                  strokeDashoffset={`-${overallBalance.engineering.pct + overallBalance.design.pct}`}
                                  className="transition-all duration-200 cursor-pointer"
                                  onMouseEnter={() => setHoveredDomain('Communication')}
                                />
                              )}
                            </svg>

                            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                              <span className="skill-balance-counter text-xl font-extrabold text-foreground leading-none">{overallBalance.total}</span>
                              <span className="text-[9px] font-bold text-muted uppercase mt-0.5">Skills</span>
                            </div>
                          </div>

                          {/* Domain Percentage Breakdown Rows & FIXED-HEIGHT Breakdown Panel */}
                          <div className="flex-1 w-full space-y-3">
                            <div className="flex justify-between items-center border-b border-card-border pb-1.5">
                              <span className="text-xs font-bold text-foreground">Overall Skill Domain Split:</span>
                              <span className="text-[10px] text-muted font-semibold">
                                Hover rows to switch breakdown
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              {/* Engineering Row */}
                              <div
                                onMouseEnter={() => setHoveredDomain('Engineering')}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  hoveredDomain === 'Engineering'
                                    ? 'bg-primary/10 border-primary/40 shadow-sm'
                                    : 'bg-card/40 border-card-border hover:bg-card-border/30'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
                                    <span className="w-2.5 h-2.5 bg-primary rounded-full" /> Engineering & Code
                                  </span>
                                  <span className="font-bold text-primary">{overallBalance.engineering.count} ({overallBalance.engineering.pct}%)</span>
                                </div>
                                <div className="w-full h-2 bg-card-border rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${overallBalance.engineering.pct}%` }}
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                  />
                                </div>
                              </div>

                              {/* Design Row */}
                              <div
                                onMouseEnter={() => setHoveredDomain('Design')}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  hoveredDomain === 'Design'
                                    ? 'bg-pink-500/10 border-pink-500/40 shadow-sm'
                                    : 'bg-card/40 border-card-border hover:bg-card-border/30'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
                                    <span className="w-2.5 h-2.5 bg-pink-500 rounded-full" /> Design & UI/UX
                                  </span>
                                  <span className="font-bold text-pink-400">{overallBalance.design.count} ({overallBalance.design.pct}%)</span>
                                </div>
                                <div className="w-full h-2 bg-card-border rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${overallBalance.design.pct}%` }}
                                    className="h-full bg-pink-500 rounded-full transition-all duration-300"
                                  />
                                </div>
                              </div>

                              {/* Communication & Soft Skills Row */}
                              <div
                                onMouseEnter={() => setHoveredDomain('Communication')}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  hoveredDomain === 'Communication'
                                    ? 'bg-teal-500/10 border-teal-500/40 shadow-sm'
                                    : 'bg-card/40 border-card-border hover:bg-card-border/30'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
                                    <span className="w-2.5 h-2.5 bg-teal-500 rounded-full" /> Communication & Soft Skills
                                  </span>
                                  <span className="font-bold text-teal-400">{overallBalance.communication.count} ({overallBalance.communication.pct}%)</span>
                                </div>
                                <div className="w-full h-2 bg-card-border rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${overallBalance.communication.pct}%` }}
                                    className="h-full bg-teal-500 rounded-full transition-all duration-300"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* RESERVED FIXED-HEIGHT Breakdown Box (Prevents Layout Shifting) */}
                            <div className="min-h-[105px] mt-3 p-3 bg-card border border-card-border rounded-xl shadow-lg flex flex-col justify-center">
                              <span className="text-[10px] text-primary font-bold uppercase tracking-wider block mb-1">
                                🔍 Granular {hoveredDomain} Breakdown:
                              </span>
                              <div className="space-y-1.5">
                                {getSubBreakdown(hoveredDomain).map((sub) => (
                                  <div key={sub.name} className="flex items-center justify-between text-[11px]">
                                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                                      {sub.name}
                                    </span>
                                    <span className="font-bold" style={{ color: sub.color }}>
                                      {sub.count} skills ({sub.pct}%)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Language Fluency Section */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-foreground">
                          Language Fluency <span className="text-red-400">*</span>
                        </label>
                        
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !languages[val]) {
                              setLanguages({ ...languages, [val]: null });
                            }
                            e.target.value = '';
                          }}
                          className="bg-card border border-card-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:outline-none cursor-pointer hover:border-primary/40 transition-colors"
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
                                  ? 'bg-amber-500/5 border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.05)]'
                                  : 'bg-background/20 border-card-border hover:border-card-border/80'
                              }`}
                            >
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
                                {level && <span className="text-xs text-amber-400 font-semibold">{level}</span>}
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 mb-3">
                                {['Basic', 'Moderate', 'Fluent'].map((lvl) => (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setLanguages({ ...languages, [lang]: lvl as any })}
                                    className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                      level === lvl
                                        ? 'bg-amber-500 border-amber-500 text-black font-extrabold shadow-sm'
                                        : 'bg-card border-card-border text-muted hover:text-foreground'
                                    }`}
                                  >
                                    {lvl}
                                  </button>
                                ))}
                              </div>

                              <motion.div
                                layout
                                className="w-full h-2.5 bg-card-border rounded-full overflow-hidden relative border border-card-border"
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: level ? fluencyMap[level] : 0 }}
                                  transition={{ type: 'spring', stiffness: 60, damping: 10 }}
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                                />
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Soft Skills badges grid */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Presenting & Soft Skills <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {softSkillsOptions.map((opt) => {
                          const isSelected = selectedSoftSkills.includes(opt);
                          return (
                            <motion.button
                              key={opt}
                              type="button"
                              onClick={() => toggleSoftSkill(opt)}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.96 }}
                              className={`py-2.5 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-[0_0_15px_rgba(129,140,248,0.15)] font-bold'
                                  : 'bg-background/30 border-card-border text-muted hover:border-card-border/80 hover:text-foreground'
                              }`}
                            >
                              {isSelected && '✓ '}
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
                        ← Back
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (validateStudentStep2()) setStep(3);
                        }}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer shadow-lg shadow-primary/25 transition-all"
                      >
                        Next Step →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-bold text-foreground">Preferences & Social Links</h3>

                    {/* Rich Interactive SIH Problem Statements Section */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <label className="block text-sm font-medium text-foreground">
                          Preferred SIH Problem Statements <span className="text-red-400">*</span>
                        </label>
                        <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                          {studentForm.trackInterest.length} / 2 Selected (Max 2 PS)
                        </span>
                      </div>

                      {/* Official PS Not Released Notice Banner */}
                      <div className="mb-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📢</span>
                          <span className="font-semibold">
                            Official SIH 2026 Problem Statements are not out yet. Showing reference tracks based on official SIH themes.
                          </span>
                        </div>
                        <a
                          href="https://sih.gov.in/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          ↗ SIH Portal
                        </a>
                      </div>

                      {/* Problem Statement Selection List */}
                      <div className="space-y-2.5 max-h-60 overflow-y-auto border border-card-border rounded-xl p-3 bg-background/30 custom-scroll">
                        {tracks.map((track) => {
                          const isSelected = studentForm.trackInterest.includes(track.id);
                          return (
                            <div
                              key={track.id}
                              onMouseEnter={() => setHoveredTrack(track)}
                              onClick={() => {
                                if (isSelected) {
                                  setStudentForm({
                                    ...studentForm,
                                    trackInterest: studentForm.trackInterest.filter((t) => t !== track.id),
                                  });
                                  setError('');
                                } else {
                                  if (studentForm.trackInterest.length >= 2) {
                                    setError('Maximum 2 problem statements can be selected per team.');
                                    return;
                                  }
                                  setStudentForm({
                                    ...studentForm,
                                    trackInterest: [...studentForm.trackInterest, track.id],
                                  });
                                  setError('');
                                }
                              }}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-primary/10 border-primary shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                  : 'bg-card/40 border-card-border hover:border-primary/40'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by outer div
                                  className="rounded border-card-border text-primary bg-background/50 focus:ring-primary mt-1 pointer-events-none"
                                />
                                <div className="space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-extrabold text-primary bg-primary/15 px-2 py-0.5 rounded border border-primary/30">
                                      {track.problemStatementCode}
                                    </span>
                                    <span className="text-xs font-bold text-foreground">
                                      {track.name}
                                    </span>
                                  </div>
                                  {track.organization && (
                                    <p className="text-[11px] text-muted font-medium">
                                      🏛️ {track.organization} • <span className="text-accent">{track.category}</span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {track.sihUrl && (
                                  <a
                                    href={track.sihUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] font-bold bg-background/60 hover:bg-card border border-card-border px-2.5 py-1 rounded text-primary hover:text-white transition-colors flex items-center gap-1"
                                  >
                                    ↗ Official SIH
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Active Hovered PS Summary Box */}
                      {hoveredTrack && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-4 bg-card/80 border border-primary/40 rounded-xl space-y-2 shadow-xl"
                        >
                          <div className="flex justify-between items-center border-b border-card-border pb-1.5">
                            <span className="text-xs font-extrabold text-primary flex items-center gap-1.5">
                              🔍 Problem Statement Details: {hoveredTrack.problemStatementCode}
                            </span>
                            <span className="text-[10px] text-accent font-bold px-2 py-0.5 bg-accent/10 rounded-full border border-accent/20">
                              {hoveredTrack.category}
                            </span>
                          </div>
                          <p className="text-xs text-foreground font-semibold">{hoveredTrack.name}</p>
                          <p className="text-xs text-muted leading-relaxed">{hoveredTrack.description}</p>
                          <div className="pt-1 flex justify-between items-center text-[11px]">
                            <span className="text-muted font-medium">Ministry / Org: <strong className="text-foreground">{hoveredTrack.organization}</strong></span>
                            {hoveredTrack.sihUrl && (
                              <a
                                href={hoveredTrack.sihUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-bold"
                              >
                                Open SIH Portal ↗
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          GitHub Profile <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://github.com/username"
                          value={studentForm.githubUrl}
                          onChange={(e) => setStudentForm({ ...studentForm, githubUrl: e.target.value })}
                          className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary placeholder-muted"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          LinkedIn Profile <span className="text-red-400">*</span>
                        </label>
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
                      <label className="block text-sm font-medium text-foreground">
                        Resume Link <span className="text-muted text-xs font-normal">(Optional)</span>
                      </label>
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
                        ← Back
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStudentSubmit}
                        disabled={submitting}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-50 shadow-lg shadow-primary/25 transition-all"
                      >
                        {submitting ? 'Saving Profile...' : 'Complete Onboarding'}
                      </motion.button>
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
                  <div key={s} className="flex items-center space-x-2 bg-card/80 px-3 py-1 rounded-full border border-card-border">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                        step === s ? 'bg-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' : step > s ? 'bg-green-600 text-white' : 'bg-card border border-card-border text-muted'
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
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-foreground">Professional Info</h3>

                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={mentorForm.name}
                        onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Designation / Role <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Assistant Professor / Tech Lead"
                        value={mentorForm.designation}
                        onChange={(e) => setMentorForm({ ...mentorForm, designation: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary placeholder-muted"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Organization / Dept <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={mentorForm.organization}
                        onChange={(e) => setMentorForm({ ...mentorForm, organization: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (validateMentorStep1()) setStep(2);
                        }}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer shadow-lg shadow-primary/25 transition-all"
                      >
                        Next Step →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="mentorStep2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-foreground">Expertise & Stated Capacity</h3>

                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Expertise Tags <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Machine Learning, Blockchain, IoT, App Development (comma separated)"
                        value={mentorForm.expertiseInput}
                        onChange={(e) => setMentorForm({ ...mentorForm, expertiseInput: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Max Team Mentoring Capacity <span className="text-red-400">*</span>
                      </label>
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
                      <label className="block text-sm font-medium text-foreground">
                        Short Biography <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        placeholder="Brief details about your mentorship domain or past projects guided..."
                        rows={3}
                        value={mentorForm.bio}
                        onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                        className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        LinkedIn Profile <span className="text-red-400">*</span>
                      </label>
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
                        ← Back
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleMentorSubmit}
                        disabled={submitting}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-50 shadow-lg shadow-primary/25 transition-all"
                      >
                        {submitting ? 'Saving Profile...' : 'Complete Onboarding'}
                      </motion.button>
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
