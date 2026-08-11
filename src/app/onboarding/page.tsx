'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import Navbar from '@/components/layout/Navbar';
import { useSession } from '@/lib/session';
import { Container, OnboardingSkeleton } from '@/components/ui';
import {
  Aurora,
  Field,
  SelectField,
  PremiumButton,
  Reveal,
  SplitText,
  DURATION,
  EASE,
  SPRING,
} from '@/components/motion';
import { logger } from '@/lib/logger';
import { userFacingMessage } from '@/lib/errors';

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

const STANDARD_SKILL_POOL = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Next.js', 'HTML', 'CSS',
  'Tailwind', 'Vue', 'Angular', 'Express', 'Django', 'Go', 'Java', 'Spring Boot',
  'PostgreSQL', 'MongoDB', 'Docker', 'Figma', 'Adobe XD', 'Canva', 'Prototyping',
  'Wireframing', 'User Research', 'Git', 'Machine Learning', 'OpenCV', 'TensorFlow',
  'PyTorch', 'REST APIs', 'Cloud Computing', 'SQL', 'Flutter', 'React Native', 'AWS',
  'Kubernetes', 'Cybersecurity', 'C++', 'C#', 'Rust',
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
  'Sanskrit', 'Punjabi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Malayalam',
  'Gujarati', 'Marathi', 'Urdu', 'Assamese', 'Kashmiri', 'Konkani', 'Nepali', 'Odia',
];

/** Palette-legal category identities — differentiated by fill weight, not hue. */
const CATEGORY_STYLES = {
  'Frontend Web': {
    swatch: '#72383D',
    active: 'border-transparent bg-primary text-on-accent',
    inactive:
      'border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.06)] text-primary hover:bg-[rgba(114,56,61,0.12)]',
  },
  'Backend & DB': {
    swatch: '#AC9C8D',
    active: 'border-transparent bg-clay text-ink',
    inactive:
      'border-[rgba(172,156,141,0.7)] bg-[rgba(172,156,141,0.14)] text-foreground hover:bg-[rgba(172,156,141,0.28)]',
  },
  'AI & Cloud & Tools': {
    swatch: '#322D29',
    active: 'border-transparent bg-foreground text-on-accent',
    inactive:
      'border-[rgba(50,45,41,0.28)] bg-[rgba(50,45,41,0.05)] text-foreground hover:bg-[rgba(50,45,41,0.1)]',
  },
  'Design & Prototyping': {
    swatch: '#8A444A',
    active: 'border-[rgba(114,56,61,0.85)] bg-[rgba(114,56,61,0.16)] text-primary',
    inactive:
      'border-dashed border-[rgba(114,56,61,0.35)] bg-transparent text-body hover:border-[rgba(114,56,61,0.6)]',
  },
  'General & Soft Skills': {
    swatch: '#D1C7BD',
    active: 'border-[rgba(172,156,141,0.9)] bg-[rgba(209,199,189,0.75)] text-foreground',
    inactive:
      'border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.6)] text-body hover:border-[rgba(172,156,141,0.9)]',
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_STYLES;

const getSkillCategory = (skill: string): CategoryKey => {
  const s = skill.toLowerCase();
  if (
    s.includes('react') || s.includes('html') || s.includes('css') || s.includes('tailwind') ||
    s.includes('vue') || s.includes('angular') || s.includes('next') || s.includes('frontend')
  ) {
    return 'Frontend Web';
  }
  if (
    s.includes('node') || s.includes('express') || s.includes('python') || s.includes('django') ||
    s.includes('go') || s.includes('java') || s.includes('spring') || s.includes('postgres') ||
    s.includes('mongo') || s.includes('sql') || s.includes('backend')
  ) {
    return 'Backend & DB';
  }
  if (
    s.includes('machine') || s.includes('learning') || s.includes('opencv') || s.includes('tensor') ||
    s.includes('pytorch') || s.includes('docker') || s.includes('cloud') || s.includes('aws') ||
    s.includes('kubernetes') || s.includes('git') || s.includes('api') || s.includes('cyber') ||
    s.includes('rust') || s.includes('c++') || s.includes('c#')
  ) {
    return 'AI & Cloud & Tools';
  }
  if (
    s.includes('figma') || s.includes('adobe') || s.includes('canva') || s.includes('proto') ||
    s.includes('wire') || s.includes('research') || s.includes('design') || s.includes('ux') ||
    s.includes('ui') || s.includes('video') || s.includes('ppt')
  ) {
    return 'Design & Prototyping';
  }
  return 'General & Soft Skills';
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

const DOMAIN_SWATCH = {
  Engineering: '#72383D',
  Design: '#AC9C8D',
  Communication: '#322D29',
} as const;

const CONTROL =
  'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.65)] px-4 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.95)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]';

const SELECT = `${CONTROL} cursor-pointer appearance-none`;

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-[rgba(209,199,189,0.7)] pb-4">
      <p className="text-label uppercase text-primary">{eyebrow}</p>
      <h2 className="mt-1 text-heading text-foreground">{title}</h2>
    </div>
  );
}

function Labelled({
  label,
  required = true,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-label uppercase text-muted">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-caption text-muted">{hint}</span>}
    </label>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [session, setSession] = useState<{
    user: { name: string; role: string; email?: string } | null;
    status: string;
  } | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const [studentForm, setStudentForm] = useState({
    name: '',
    year: '',
    branch: '',
    gender: '',
    rollNo: '',
    section: '',
    category: '',
    contact: '',
    college: '',
    githubUrl: '',
    linkedinUrl: '',
    resumeUrl: '',
    avatarUrl: '',
    trackInterest: [] as string[],
  });

  const [lockedSkills, setLockedSkills] = useState<string[]>([]);
  const [customSkillsText, setCustomSkillsText] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  const [hoveredDomain, setHoveredDomain] =
    useState<'Engineering' | 'Design' | 'Communication'>('Engineering');

  const [hoveredTrack, setHoveredTrack] = useState<Track | null>(null);

  const [languages, setLanguages] = useState<{
    [key: string]: 'Basic' | 'Moderate' | 'Fluent' | null;
  }>({ English: null, Hindi: null });

  const [selectedSoftSkills, setSelectedSoftSkills] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCustomSectionInput, setShowCustomSectionInput] = useState(false);  const [roleChosen, setRoleChosen] = useState<'STUDENT' | 'MENTOR' | null>(null);
  const [mentorKey, setMentorKey] = useState('');
  const [showMentorKeyInput, setShowMentorKeyInput] = useState(false);
  const [showKeyErrorPopup, setShowKeyErrorPopup] = useState(false);
  const [clickedRole, setClickedRole] = useState<'STUDENT' | 'MENTOR' | null>(null);

  const handleSelectStudent = async () => {
    if (clickedRole) return;
    setClickedRole('STUDENT');
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/onboarding-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'STUDENT' }),
      });
      if (!res.ok) throw new Error('Failed to set role');
      
      setRoleChosen('STUDENT');
      setSession((prev) => prev ? { ...prev, user: prev.user ? { ...prev.user, role: 'STUDENT' } : null } : null);
    } catch (err) {
      setError('Failed to select role. Please try again.');
      setClickedRole(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyMentorKey = async () => {
    if (clickedRole) return;
    setClickedRole('MENTOR');
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/onboarding-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'MENTOR', registrationKey: mentorKey }),
      });
      
      if (!res.ok) {
        setShowKeyErrorPopup(true);
        setClickedRole(null);
        return;
      }
      
      setRoleChosen('MENTOR');
      setSession((prev) => prev ? { ...prev, user: prev.user ? { ...prev.user, role: 'MENTOR' } : null } : null);
    } catch (err) {
      setError('Verification failed. Please try again.');
      setClickedRole(null);
    } finally {
      setSubmitting(false);
    }
  };

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
      if (isStudent) {
        setStudentForm((previous) => ({ ...previous, avatarUrl: String(reader.result) }));
      } else {
        setMentorForm((previous) => ({ ...previous, avatarUrl: String(reader.result) }));
      }
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const [mentorForm, setMentorForm] = useState({
    name: '',
    designation: '',
    organization: 'GL Bajaj Group of Institutions',
    contact: '',
    expertiseInput: '',
    bio: '',
    linkedinUrl: '',
    avatarUrl: '',
    college: '',
  });

  const softSkillsOptions = [
    'PPT Making',
    'Public Speaking/Presenting',
    'Technical Writing',
    'UI/UX Design',
    'Video Editing',
    'Management',
  ];
  const branchOptions = ['B.Tech CSE', 'B.Tech CSE (AI/ML)', 'B.Tech CS', 'MBA'];
  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

  useEffect(() => {
    async function initOnboarding() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const editMode = searchParams.get('edit') === 'true';
        setIsEditMode(editMode);

        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();

        if (!meData.authenticated) {
          router.push('/login');
          return;
        }

        setSession({ user: meData.user, status: 'authenticated' });
        if (editMode || meData.user.isOnboarded) {
          setRoleChosen(meData.user.role);
        }

        const profileRoute = meData.user.role === 'STUDENT' ? '/api/profile/student' : '/api/profile/mentor';
        const profileRes = await fetch(profileRoute);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const prof = profileData.profile;
          if (prof) {
            if (meData.user.role === 'STUDENT') {
              setStudentForm({
                name: prof.name || meData.user.name || '',
                year: prof.year || '',
                branch: prof.branch || '',
                gender: prof.gender || '',
                rollNo: prof.rollNo || '',
                section: prof.section || '',
                category: prof.category || '',
                contact: prof.contact || '',
                college: prof.college || meData.user.college || '',
                githubUrl: prof.githubUrl || '',
                linkedinUrl: prof.linkedinUrl || '',
                resumeUrl: prof.resumeUrl || '',
                avatarUrl: prof.avatarUrl || '',
                trackInterest: prof.trackInterest || [],
              });
              if (Array.isArray(prof.skills) && prof.skills.length > 0) {
                setLockedSkills(prof.skills);
              }
              if (Array.isArray(prof.softSkills) && prof.softSkills.length > 0) {
                setSelectedSoftSkills(prof.softSkills);
              }
              if (Array.isArray(prof.languages) && prof.languages.length > 0) {
                const langMap: { [key: string]: 'Basic' | 'Moderate' | 'Fluent' | null } = {
                  English: null,
                  Hindi: null,
                };
                prof.languages.forEach((item: string) => {
                  const match = item.match(/^(.+?)\s*\((Basic|Moderate|Fluent)\)$/);
                  if (match) {
                    langMap[match[1]] = match[2] as 'Basic' | 'Moderate' | 'Fluent';
                  }
                });
                setLanguages(langMap);
              }
            } else {
              setMentorForm({
                name: prof.name || meData.user.name || '',
                designation: prof.designation || '',
                organization: prof.organization || 'GL Bajaj Group of Institutions',
                contact: prof.contact || '',
                expertiseInput: Array.isArray(prof.expertise) ? prof.expertise.join(', ') : '',
                bio: prof.bio || '',
                linkedinUrl: prof.linkedinUrl || '',
                avatarUrl: prof.avatarUrl || '',
                college: meData.user.college || '',
              });
            }
          }
        }

        if (meData.user.isOnboarded && !editMode) {
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
        // Silently failing here left the wizard with no tracks to choose from
        // and no explanation, which reads as the form being broken.
        logger.error('Onboarding init failed', err);
        setError('Could not load your profile options. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    }

    initOnboarding();
  }, [router]);

  const validateStudentStep1 = () => {
    if (!studentForm.avatarUrl || !studentForm.avatarUrl.startsWith('data:image/')) {
      setError('Profile photo is mandatory. Please upload a clear photo of yourself.');
      return false;
    }
    if (!studentForm.name.trim()) {
      setError('Full name is mandatory. Please enter your name.');
      return false;
    }
    if (!studentForm.gender) {
      setError('Gender selection is mandatory. Please select your gender.');
      return false;
    }
    if (!studentForm.college) {
      setError('Campus is mandatory. Please select your campus.');
      return false;
    }
    if (!studentForm.rollNo.trim()) {
      setError('University roll number is mandatory. Please enter your roll number.');
      return false;
    }
    if (!studentForm.year) {
      setError('Year of study is mandatory. Please select your year of study.');
      return false;
    }
    if (!studentForm.branch) {
      setError('Course is mandatory. Please select your course.');
      return false;
    }
    if (!studentForm.section.trim()) {
      setError('Section is mandatory. Please enter or select your section.');
      return false;
    }
    if (!studentForm.category) {
      setError('Category is mandatory. Please select your category.');
      return false;
    }
    if (!studentForm.contact.trim()) {
      setError('Contact number is mandatory. Please enter your mobile number.');
      return false;
    }
    if (!studentForm.college) {
      setError('Campus is mandatory. Please select your campus.');
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
    if (totalSkills.length > 100) {
      setError('You can select at most 100 technical skills.');
      return false;
    }

    const selectedLangs = Object.entries(languages).filter(([, lvl]) => lvl !== null);
    if (selectedLangs.length === 0) {
      setError('Language fluency is mandatory. Please specify fluency for at least one language.');
      return false;
    }
    if (selectedLangs.length > 30) {
      setError('You can select at most 30 languages.');
      return false;
    }

    if (selectedSoftSkills.length === 0) {
      setError('Presenting / Soft skills are mandatory. Please select at least one skill.');
      return false;
    }
    if (selectedSoftSkills.length > 30) {
      setError('You can select at most 30 soft skills.');
      return false;
    }

    setError('');
    return true;
  };

  const validateStudentStep3 = () => {
    if (studentForm.trackInterest.length !== 2) {
      setError('Exactly 2 preferred problem statements are required.');
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
    if (!mentorForm.college) {
      setError('Campus selection is mandatory. Please select your campus.');
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
    if (!mentorForm.contact.trim()) {
      setError('Phone / Mobile number is mandatory. Please enter your contact number.');
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
    const expertise = mentorForm.expertiseInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');
    if (expertise.length > 100) {
      setError('You can select at most 100 expertise tags.');
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
      .filter(([, level]) => level !== null)
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
          category: studentForm.category,
          contact: studentForm.contact.trim(),
          college: studentForm.college,
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

      await refresh();
      router.push('/dashboard');
    } catch (err) {
      setError(userFacingMessage(err, 'An error occurred while saving profile.'));
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
          contact: mentorForm.contact.trim(),
          expertise,
          bio: mentorForm.bio.trim(),
          linkedinUrl: mentorForm.linkedinUrl.trim(),
          avatarUrl: mentorForm.avatarUrl || null,
          college: mentorForm.college,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      await refresh();
      router.push('/dashboard');
    } catch (err) {
      setError(userFacingMessage(err, 'An error occurred while saving profile.'));
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

    setLockedSkills(Array.from(new Set([...lockedSkills, ...newItems])));
    setCustomSkillsText('');
    setSkillSearch('');
    setError('');
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

  const getOverallSkillBalance = () => {
    const activeLangs = Object.entries(languages)
      .filter(([, lvl]) => lvl !== null)
      .map(([lang]) => lang);
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

    return {
      total,
      engineering: { count: eng, pct: Math.round((eng / total) * 100) },
      design: { count: des, pct: Math.round((des / total) * 100) },
      communication: { count: comm, pct: Math.round((comm / total) * 100) },
    };
  };

  const getSubBreakdown = (categoryKey: string) => {
    const activeLangs = Object.entries(languages)
      .filter(([, lvl]) => lvl !== null)
      .map(([lang]) => lang);
    const allSelected = [...lockedSkills, ...selectedSoftSkills, ...activeLangs];
    if (allSelected.length === 0) return [];

    if (categoryKey === 'Engineering') {
      const frontend = lockedSkills.filter((s) => getSkillCategory(s) === 'Frontend Web');
      const backend = lockedSkills.filter((s) => getSkillCategory(s) === 'Backend & DB');
      const aiInfra = lockedSkills.filter((s) => getSkillCategory(s) === 'AI & Cloud & Tools');
      const engTotal = frontend.length + backend.length + aiInfra.length || 1;

      return [
        {
          name: 'Frontend Web',
          count: frontend.length,
          pct: Math.round((frontend.length / engTotal) * 100),
          color: CATEGORY_STYLES['Frontend Web'].swatch,
        },
        {
          name: 'Backend & DB',
          count: backend.length,
          pct: Math.round((backend.length / engTotal) * 100),
          color: CATEGORY_STYLES['Backend & DB'].swatch,
        },
        {
          name: 'AI, Cloud & Tools',
          count: aiInfra.length,
          pct: Math.round((aiInfra.length / engTotal) * 100),
          color: CATEGORY_STYLES['AI & Cloud & Tools'].swatch,
        },
      ];
    }

    if (categoryKey === 'Design') {
      const designSkills = [...lockedSkills, ...selectedSoftSkills].filter(
        (s) => getSkillCategory(s) === 'Design & Prototyping'
      );
      return [
        {
          name: 'UI/UX & Prototyping',
          count: designSkills.length,
          pct: 100,
          color: CATEGORY_STYLES['Design & Prototyping'].swatch,
        },
      ];
    }

    const softs = selectedSoftSkills.filter((s) => getSkillCategory(s) === 'General & Soft Skills');
    const commTotal = softs.length + activeLangs.length || 1;

    return [
      {
        name: 'Public Speaking & Mgmt',
        count: softs.length,
        pct: Math.round((softs.length / commTotal) * 100),
        color: '#322D29',
      },
      {
        name: 'Multilingual Fluency',
        count: activeLangs.length,
        pct: Math.round((activeLangs.length / commTotal) * 100),
        color: '#AC9C8D',
      },
    ];
  };

  const overallBalance = getOverallSkillBalance();
  const availableSkillPool = Array.from(new Set([...STANDARD_SKILL_POOL, ...lockedSkills]));
  const filteredSkillPool = availableSkillPool.filter((skill) =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Navbar />
        <main className="flex-1">
          <OnboardingSkeleton />
        </main>
      </div>
    );
  }

  const isStudent = roleChosen ? roleChosen === 'STUDENT' : session?.user?.role === 'STUDENT';
  const fluencyMap = { Basic: '33%', Moderate: '66%', Fluent: '100%' };

  const STEPS = isStudent
    ? [
        { n: 1, label: 'Academic', caption: 'Identity and enrolment' },
        { n: 2, label: 'Skills & fluency', caption: 'Stack, languages, soft skills' },
        { n: 3, label: 'Preferences', caption: 'Problem statements and links' },
      ]
    : [
        { n: 1, label: 'Professional', caption: 'Name, role, department' },
        { n: 2, label: 'Expertise & bio', caption: 'Domains, biography, links' },
      ];

  const lastStep = STEPS[STEPS.length - 1].n;

  if (!roleChosen && !isEditMode) {
    return (
      <div className="relative min-h-screen overflow-visible bg-background text-foreground">
        <header className="section-warm relative overflow-hidden">
          <Aurora variant="warm" spotlight />
          <div aria-hidden className="grid-lines absolute inset-0" />
          <Container width="narrow" className="relative flex items-center justify-between py-5">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/Logo/NexaSphere Icon without Background.png"
                alt=""
                className="size-7 object-contain"
              />
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground">
                SIH@GLBGOI
              </span>
            </Link>
          </Container>
          <Container width="narrow" className="relative pb-12 pt-6 text-center">
            <SplitText
              as="h1"
              text="Welcome! Choose your path."
              className="text-title text-foreground"
              delay={0.08}
            />
            <Reveal delay={0.3} className="mt-3">
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
                Select your role to configure your workspace. Students can browse teams and mentors, while mentors can guide and evaluate teams.
              </p>
            </Reveal>
          </Container>
        </header>

        <main className="surface-sunken py-12">
          <Container width="narrow" className="max-w-2xl">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Student Card */}
              <m.div
                whileHover={clickedRole ? undefined : { y: -4 }}
                whileTap={clickedRole ? undefined : { scale: 0.97 }}
                animate={clickedRole === 'STUDENT' ? { scale: 0.96, borderColor: 'var(--primary, #72383D)' } : {}}
                transition={SPRING.snappy}
                onClick={clickedRole ? undefined : handleSelectStudent}
                className={`surface-raised rounded-3xl p-6 border flex flex-col justify-between transition-colors duration-250 ${
                  clickedRole === 'STUDENT'
                    ? 'border-primary shadow-[0_0_15px_rgba(114,56,61,0.15)] pointer-events-none'
                    : 'border-[rgba(209,199,189,0.7)] hover:border-primary cursor-pointer'
                }`}
              >
                <div>
                  <div className="size-12 rounded-2xl bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center mb-4">
                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Student</h3>
                  <p className="text-sm text-muted mt-2 leading-relaxed">
                    Build or join a team, view the problem statements index, and request mentors for guidance.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2.5 text-sm font-bold text-primary">
                  {clickedRole === 'STUDENT' ? (
                    <>
                      <span className="animate-pulse">Opening Student Onboarding...</span>
                      <span className="relative flex size-4 items-center justify-center">
                        <span className="absolute size-full rounded-full border-2 border-primary/20" />
                        <span className="absolute size-full rounded-full border-2 border-t-primary animate-spin" />
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Start Student Onboarding</span>
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </div>
              </m.div>

              {/* Mentor Card */}
              <m.div
                whileHover={clickedRole ? undefined : { y: -4 }}
                whileTap={clickedRole ? undefined : { scale: 0.97 }}
                animate={clickedRole === 'MENTOR' ? { scale: 0.96, borderColor: 'var(--primary, #72383D)' } : {}}
                transition={SPRING.snappy}
                onClick={clickedRole ? undefined : () => setShowMentorKeyInput(true)}
                className={`surface-raised rounded-3xl p-6 border flex flex-col justify-between transition-colors duration-250 ${
                  clickedRole === 'MENTOR'
                    ? 'border-primary shadow-[0_0_15px_rgba(114,56,61,0.15)] pointer-events-none'
                    : 'border-[rgba(209,199,189,0.7)] hover:border-primary cursor-pointer'
                }`}
              >
                <div>
                  <div className="size-12 rounded-2xl bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center mb-4">
                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Mentor</h3>
                  <p className="text-sm text-muted mt-2 leading-relaxed">
                    Guide student teams, review project descriptions, and manage mentorship requests.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2.5 text-sm font-bold text-primary">
                  {clickedRole === 'MENTOR' ? (
                    <>
                      <span className="animate-pulse">Opening Mentor Registration...</span>
                      <span className="relative flex size-4 items-center justify-center">
                        <span className="absolute size-full rounded-full border-2 border-primary/20" />
                        <span className="absolute size-full rounded-full border-2 border-t-primary animate-spin" />
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Register as Mentor</span>
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </div>
              </m.div>
            </div>

            {/* Mentor Key Prompt Modal/Section */}
            <AnimatePresence>
              {showMentorKeyInput && (
                <m.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-8 surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.85)]"
                >
                  <h4 className="text-lg font-bold text-foreground">Mentor Verification</h4>
                  <p className="text-xs text-muted mt-1">
                    To register as a mentor, please provide the Mentor Secret Key provided by the admin.
                  </p>
                  
                  <div className="mt-4 space-y-4">
                    <Field
                      label="Mentor Secret Key"
                      type="password"
                      value={mentorKey}
                      onChange={(e) => setMentorKey(e.target.value)}
                    />
                    
                    <div className="flex gap-3 justify-end">
                      <PremiumButton variant="ghost" onClick={() => setShowMentorKeyInput(false)}>
                        Cancel
                      </PremiumButton>
                      <PremiumButton onClick={handleVerifyMentorKey} loading={submitting}>
                        Verify & Continue
                      </PremiumButton>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            {/* Error Popup Alert Modal */}
            <AnimatePresence>
              {showKeyErrorPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                  <m.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="surface-raised max-w-md w-full rounded-3xl p-6 border border-[rgba(114,56,61,0.35)] shadow-2xl space-y-4 text-center"
                  >
                    <div className="size-12 rounded-full bg-[rgba(114,56,61,0.09)] text-primary mx-auto flex items-center justify-center">
                      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Invalid Secret Key</h3>
                    <p className="text-sm text-muted leading-relaxed">
                      The key you entered is incorrect. Please contact the SIH GL Bajaj team to obtain a valid Mentor Registration Key.
                    </p>
                    <PremiumButton onClick={() => setShowKeyErrorPopup(false)} className="w-full">
                      Close
                    </PremiumButton>
                  </m.div>
                </div>
              )}
            </AnimatePresence>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── SLIM BRAND BAR ── */}
      <header className="section-warm relative overflow-hidden">
        <Aurora variant="warm" spotlight />
        <div aria-hidden className="grid-lines absolute inset-0" />

        <Container width="narrow" className="relative flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/Logo/NexaSphere Icon without Background.png"
              alt=""
              className="size-7 object-contain"
            />
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground">
              SIH@GLBGOI
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-label uppercase text-muted">
              {isEditMode ? `${isStudent ? 'Student' : 'Mentor'} profile` : `${isStudent ? 'Student' : 'Mentor'} onboarding`}
            </span>
            {isEditMode && (
              <PremiumButton
                variant="glass"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-xs"
              >
                Close
              </PremiumButton>
            )}
          </div>
        </Container>

        <Container width="narrow" className="relative pb-12">
          <SplitText
            key={isEditMode ? "edit" : "complete"}
            as="h1"
            text={isEditMode ? "Edit your profile." : "Complete your profile."}
            className="text-title text-foreground"
            delay={0.08}
          />
          <Reveal delay={0.3} className="mt-3">
            <p className="max-w-xl text-sm leading-relaxed text-muted">
              {isEditMode
                ? "Update your profile details, technical stack, or project preferences here."
                : "Everything here feeds team matching, mentor routing and the roster views. Every field is required unless marked optional."}
            </p>
          </Reveal>
        </Container>
      </header>

      {/* ── STICKY STEP RAIL ── */}
      <div className="sticky top-0 z-30 border-y border-[rgba(209,199,189,0.75)] bg-[rgba(239,233,225,0.82)] backdrop-blur-xl">
        <Container width="narrow" as="nav" aria-label="Onboarding progress">
          <ol className="marquee-mask flex gap-2 overflow-x-auto py-3">
            {STEPS.map((s) => {
              const active = step === s.n;
              const done = step > s.n;
              return (
                <li key={s.n} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => done && setStep(s.n)}
                    disabled={!done && !active}
                    aria-current={active ? 'step' : undefined}
                    className={`relative flex items-center gap-2.5 rounded-full px-4 py-2 transition-colors duration-250 ${
                      active
                        ? 'text-on-accent'
                        : done
                          ? 'text-primary hover:text-[var(--primary-hover)]'
                          : 'cursor-default text-muted'
                    }`}
                  >
                    {active && (
                      <m.span
                        layoutId="onboardingStepPill"
                        transition={SPRING.snappy}
                        className="absolute inset-0 rounded-full bg-primary shadow-[0_6px_20px_rgba(114,56,61,0.26)]"
                      />
                    )}
                    <span
                      className={`relative z-10 grid size-5 place-items-center rounded-full text-caption font-black ${
                        active
                          ? 'bg-white/20 text-on-accent'
                          : done
                            ? 'bg-[rgba(114,56,61,0.14)] text-primary'
                            : 'bg-[rgba(209,199,189,0.7)] text-muted'
                      }`}
                    >
                      {done ? <Icon icon={Check} size="xs" /> : s.n}
                    </span>
                    <span className="relative z-10 whitespace-nowrap text-xs font-bold">
                      {s.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div
            aria-hidden
            className="h-0.5 overflow-hidden rounded-full bg-[rgba(209,199,189,0.8)]"
          >
            <m.div
              className="h-full rounded-full bg-gradient-to-r from-[#AC9C8D] to-primary"
              animate={{ scaleX: step / lastStep }}
              initial={{ scaleX: 1 / lastStep }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: DURATION.card, ease: EASE.outExpo }}
            />
          </div>
        </Container>
      </div>

      <main id="main" className="surface-sunken">
        <Container width="narrow" className="py-10">
          <AnimatePresence initial={false}>
            {error && (
              <m.div
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                className="overflow-hidden"
              >
                <div className="mb-5 rounded-2xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.07)] px-5 py-3.5 text-sm font-semibold text-primary">
                  {error}
                </div>
              </m.div>
            )}
          </AnimatePresence>

          <div className="surface-raised rounded-3xl p-6 sm:p-9">
            <AnimatePresence mode="wait" initial={false}>
              {/* ═══ STUDENT · STEP 1 ═══ */}
              {isStudent && step === 1 && (
                <m.div
                  key="s1"
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                  transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                  className="space-y-6"
                >
                  <SectionHeading eyebrow="Step one" title="Academic information" />

                  {/* profile photo */}
                  <div>
                    <span className="mb-1.5 block text-label font-bold uppercase tracking-wider text-foreground">
                      Professional Passport-Size Photograph <span className="text-primary">*</span>
                    </span>
                    <p className="mb-3 text-xs leading-relaxed text-muted">
                      Upload a clear, professional passport-size photograph. This photo will be used on your SIH profile and team-related views.
                    </p>

                    {studentForm.avatarUrl ? (
                      <div className="flex flex-col items-center gap-5 rounded-2xl border border-[rgba(209,199,189,0.8)] bg-[rgba(239,233,225,0.5)] p-4 sm:flex-row">
                        <div className="size-24 shrink-0 overflow-hidden rounded-2xl border-2 border-[rgba(114,56,61,0.5)] shadow-[0_10px_30px_rgba(50,45,41,0.14)]">
                          <img
                            src={studentForm.avatarUrl}
                            alt="Uploaded professional photograph preview"
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.1)] px-2.5 py-0.5 text-caption font-bold text-primary">
                            <Check className="size-3" /> Photograph Uploaded
                          </span>
                          <p className="text-xs leading-relaxed text-muted">
                            This photo appears on your card across team search and roster views.
                          </p>
                          <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
                            <label className="cursor-pointer rounded-lg border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] px-3 py-1.5 text-caption font-bold text-primary transition-colors duration-250 hover:bg-[rgba(114,56,61,0.15)]">
                              Change photo
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="sr-only"
                                onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setStudentForm({ ...studentForm, avatarUrl: '' })}
                              className="rounded-lg border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.7)] px-3 py-1.5 text-caption font-bold text-body transition-colors duration-250 hover:text-primary"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <m.label
                          whileHover={{ y: -3 }}
                          transition={SPRING.snappy}
                          className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(114,56,61,0.4)] bg-[rgba(239,233,225,0.45)] p-8 text-center transition-colors duration-250 hover:border-primary hover:bg-[rgba(248,246,242,0.75)]"
                        >
                          <span className="mb-3 grid size-12 place-items-center rounded-full bg-[rgba(114,56,61,0.09)] text-primary transition-transform duration-250 group-hover:scale-110">
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" aria-hidden>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                stroke="currentColor"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            Upload Professional Photograph *
                          </span>
                          <span className="mt-1 text-caption text-muted">
                            PNG, JPG or WEBP (Max 1.5 MB)
                          </span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="sr-only"
                            onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                          />
                        </m.label>
                        <div className="flex items-center gap-2 rounded-xl border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.05)] px-3.5 py-2 text-xs font-semibold text-primary">
                          <span>⚠️</span>
                          <span>Please upload your professional passport-size photograph to continue.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Full name"
                      autoComplete="name"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    />
                    <SelectField
                      label="Gender"
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    >
                      <option value="">Select gender</option>
                      {genderOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <SelectField
                    label="Which campus are you from?"
                    value={studentForm.college}
                    onChange={(e) => setStudentForm({ ...studentForm, college: e.target.value })}
                  >
                    <option value="">Select campus</option>
                    <option value="GL Bajaj Mathura">GL Bajaj Mathura</option>
                    <option value="GL Bajaj Noida">GL Bajaj Noida</option>
                  </SelectField>

                  <Field
                    label="University roll number"
                    value={studentForm.rollNo}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                    hint="e.g. 2100970100045"
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <SelectField
                      label="Year of study"
                      value={studentForm.year}
                      onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                    >
                      <option value="">Select year</option>
                      {yearOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Course"
                      value={studentForm.branch}
                      onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                    >
                      <option value="">Select course</option>
                      {branchOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Section"
                      value={showCustomSectionInput ? 'Other' : studentForm.section}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other') {
                          setShowCustomSectionInput(true);
                          setStudentForm({ ...studentForm, section: '' });
                        } else {
                          setShowCustomSectionInput(false);
                          setStudentForm({ ...studentForm, section: val });
                        }
                      }}
                    >
                      <option value="">Select section</option>
                      {sectionOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          Section {opt}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </SelectField>
                  </div>

                  {showCustomSectionInput && (
                    <Field
                      label="Write your section"
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      hint="e.g. J, K, etc."
                    />
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Category"
                      value={studentForm.category}
                      onChange={(e) => setStudentForm({ ...studentForm, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {['General', 'OBC', 'SC', 'ST'].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </SelectField>
                    <Field
                      label="Contact number (Mobile)"
                      value={studentForm.contact}
                      onChange={(e) => setStudentForm({ ...studentForm, contact: e.target.value })}
                      hint="e.g. 9999999999"
                    />
                  </div>

                  <div className="flex justify-end border-t border-[rgba(209,199,189,0.7)] pt-5">
                    <PremiumButton
                      magnetic={false}
                      onClick={() => {
                        if (validateStudentStep1()) setStep(2);
                      }}
                    >
                      Continue
                    </PremiumButton>
                  </div>
                </m.div>
              )}

              {/* ═══ STUDENT · STEP 2 ═══ */}
              {isStudent && step === 2 && (
                <m.div
                  key="s2"
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                  transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                  className="space-y-6"
                >
                  <SectionHeading eyebrow="Step two" title="Skills, languages and fluency" />

                  {/* skill search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or add a skill — React, Python, Flutter, Go…"
                      aria-label="Search or add a skill"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (skillSearch.trim()) handleAddCustomSkill(skillSearch);
                        }
                      }}
                      className={`${CONTROL} pr-32`}
                    />
                    <AnimatePresence>
                      {skillSearch.trim() && (
                        <m.button
                          type="button"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: DURATION.micro, ease: EASE.outExpo }}
                          onClick={() => handleAddCustomSkill(skillSearch)}
                          className="absolute right-1.5 top-1.5 rounded-lg bg-primary px-3 py-1.5 text-caption font-bold text-on-accent shadow-[0_4px_14px_rgba(114,56,61,0.25)]"
                        >
                          Add “{skillSearch.trim()}”
                        </m.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* selected skills */}
                  {lockedSkills.length > 0 && (
                    <div className="rounded-2xl border border-[rgba(209,199,189,0.75)] bg-[rgba(239,233,225,0.5)] p-3.5">
                      <span className="mb-2 block text-label uppercase text-muted">
                        Selected ({lockedSkills.length}) — click to remove
                      </span>
                      <m.div layout className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {lockedSkills.map((skill) => (
                            <m.button
                              key={skill}
                              type="button"
                              layout
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={SPRING.snappy}
                              onClick={() => toggleSkillTile(skill)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-caption font-bold ${
                                CATEGORY_STYLES[getSkillCategory(skill)].active
                              }`}
                            >
                              {skill}
                              <span aria-hidden className="opacity-70">
                                ×
                              </span>
                            </m.button>
                          ))}
                        </AnimatePresence>
                      </m.div>
                    </div>
                  )}

                  {/* pool */}
                  <div>
                    <span className="mb-2 block text-label uppercase text-muted">
                      Skill pool — click to toggle
                    </span>
                    <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-[rgba(209,199,189,0.75)] bg-[rgba(239,233,225,0.4)] p-3.5">
                      {filteredSkillPool.length > 0 ? (
                        filteredSkillPool.map((skill) => {
                          const isSelected = lockedSkills.includes(skill);
                          const style = CATEGORY_STYLES[getSkillCategory(skill)];
                          return (
                            <m.button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkillTile(skill)}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.96 }}
                              transition={SPRING.snappy}
                              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors duration-250 ${
                                isSelected ? style.active : style.inactive
                              }`}
                            >
                              {skill}
                            </m.button>
                          );
                        })
                      ) : (
                        <div className="w-full py-5 text-center">
                          <p className="mb-3 text-xs text-muted">
                            Nothing in the pool matches “{skillSearch}”.
                          </p>
                          <PremiumButton
                            size="sm"
                            magnetic={false}
                            onClick={() => handleAddCustomSkill(skillSearch)}
                          >
                            Add it as a custom skill
                          </PremiumButton>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* recommendations */}
                  <AnimatePresence initial={false}>
                    {getRecommendations().length > 0 && (
                      <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-2xl border border-[rgba(172,156,141,0.6)] bg-[rgba(172,156,141,0.14)] p-3.5">
                          <span className="mb-2 block text-label uppercase text-primary">
                            Pairs well with your stack
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {getRecommendations().map((rec) => (
                              <m.button
                                key={rec}
                                type="button"
                                whileHover={{ y: -2 }}
                                transition={SPRING.snappy}
                                onClick={() => toggleSkillTile(rec)}
                                className="rounded-lg border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.75)] px-2.5 py-1 text-caption font-semibold text-foreground transition-colors duration-250 hover:border-[rgba(114,56,61,0.35)] hover:text-primary"
                              >
                                + {rec}
                              </m.button>
                            ))}
                          </div>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>

                  {/* custom skills */}
                  <div>
                    <span className="mb-1.5 block text-label uppercase text-muted">
                      Add several at once — comma separated
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="OpenCV, Solidity, Three.js…"
                        aria-label="Custom skills, comma separated"
                        value={customSkillsText}
                        onChange={(e) => setCustomSkillsText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSkill();
                          }
                        }}
                        className={CONTROL}
                      />
                      <PremiumButton
                        variant="glass"
                        size="sm"
                        magnetic={false}
                        onClick={() => handleAddCustomSkill()}
                        className="shrink-0"
                      >
                        Add
                      </PremiumButton>
                    </div>
                  </div>

                  {/* balance donut */}
                  {overallBalance.total > 0 && (
                    <div className="flex flex-col items-center gap-7 rounded-3xl border border-[rgba(209,199,189,0.8)] bg-[rgba(239,233,225,0.55)] p-5 md:flex-row">
                      <div className="relative grid size-36 shrink-0 place-items-center">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="rgba(209,199,189,0.85)"
                            strokeWidth="3"
                          />
                          {(
                            [
                              ['Engineering', overallBalance.engineering.pct, 0],
                              ['Design', overallBalance.design.pct, overallBalance.engineering.pct],
                              [
                                'Communication',
                                overallBalance.communication.pct,
                                overallBalance.engineering.pct + overallBalance.design.pct,
                              ],
                            ] as const
                          ).map(
                            ([domain, pct, offset]) =>
                              pct > 0 && (
                                <m.circle
                                  key={domain}
                                  cx="18"
                                  cy="18"
                                  r="15.915"
                                  fill="transparent"
                                  stroke={DOMAIN_SWATCH[domain]}
                                  strokeDasharray={`${pct} ${100 - pct}`}
                                  strokeDashoffset={`-${offset}`}
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredDomain(domain)}
                                  animate={{ strokeWidth: hoveredDomain === domain ? 4.6 : 3.4 }}
                                  transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
                                />
                              )
                          )}
                        </svg>
                        <div className="pointer-events-none absolute text-center">
                          <span className="block text-2xl font-extrabold leading-none tracking-tight text-foreground">
                            {overallBalance.total}
                          </span>
                          <span className="mt-0.5 block text-label uppercase text-muted">
                            signals
                          </span>
                        </div>
                      </div>

                      <div className="w-full flex-1 space-y-3">
                        <div className="flex items-center justify-between border-b border-[rgba(209,199,189,0.8)] pb-2">
                          <span className="text-xs font-bold text-foreground">
                            Overall domain split
                          </span>
                          <span className="text-caption text-muted">
                            Hover a row to drill in
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {(
                            [
                              ['Engineering', 'Engineering & code', overallBalance.engineering],
                              ['Design', 'Design & UI/UX', overallBalance.design],
                              [
                                'Communication',
                                'Communication & soft skills',
                                overallBalance.communication,
                              ],
                            ] as const
                          ).map(([key, label, value]) => (
                            <div
                              key={key}
                              onMouseEnter={() => setHoveredDomain(key)}
                              className={`cursor-pointer rounded-xl border p-2.5 transition-colors duration-250 ${
                                hoveredDomain === key
                                  ? 'border-[rgba(114,56,61,0.35)] bg-[rgba(248,246,242,0.9)]'
                                  : 'border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.45)]'
                              }`}
                            >
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-caption font-bold text-foreground">
                                  <span
                                    aria-hidden
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: DOMAIN_SWATCH[key] }}
                                  />
                                  {label}
                                </span>
                                <span className="text-caption font-bold text-primary">
                                  {value.count} ({value.pct}%)
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(209,199,189,0.85)]">
                                <m.div
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor: DOMAIN_SWATCH[key],
                                    transformOrigin: 'left',
                                  }}
                                  animate={{ scaleX: value.pct / 100 }}
                                  transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="min-h-[104px] rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.85)] p-3.5">
                          <span className="mb-2 block text-label uppercase text-primary">
                            {hoveredDomain} breakdown
                          </span>
                          <AnimatePresence mode="wait" initial={false}>
                            <m.div
                              key={hoveredDomain}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 4 }}
                              transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
                              className="space-y-1.5"
                            >
                              {getSubBreakdown(hoveredDomain).map((sub) => (
                                <div
                                  key={sub.name}
                                  className="flex items-center justify-between text-caption"
                                >
                                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <span
                                      aria-hidden
                                      className="size-2 rounded-full"
                                      style={{ backgroundColor: sub.color }}
                                    />
                                    {sub.name}
                                  </span>
                                  <span className="font-bold text-muted">
                                    {sub.count} · {sub.pct}%
                                  </span>
                                </div>
                              ))}
                            </m.div>
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* languages */}
                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-label uppercase text-muted">
                        Language fluency <span className="text-primary">*</span>
                      </span>
                      <select
                        aria-label="Add a language"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !languages[val]) {
                            setLanguages({ ...languages, [val]: null });
                          }
                          e.target.value = '';
                        }}
                        className="cursor-pointer rounded-lg border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.7)] px-3 py-1.5 text-caption font-semibold text-foreground outline-none transition-colors duration-250 hover:border-[rgba(114,56,61,0.35)]"
                      >
                        <option value="">+ Add language</option>
                        {OFFICIAL_LANGUAGES.filter((lang) => !languages[lang]).map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>

                    <m.div layout className="grid gap-3 sm:grid-cols-2">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {Object.entries(languages).map(([lang, level]) => (
                          <m.div
                            key={lang}
                            layout
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                            className={`relative rounded-2xl border p-4 transition-colors duration-250 ${
                              level
                                ? 'border-[rgba(114,56,61,0.32)] bg-[rgba(114,56,61,0.05)]'
                                : 'border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.5)]'
                            }`}
                          >
                            {lang !== 'English' && lang !== 'Hindi' && (
                              <button
                                type="button"
                                aria-label={`Remove ${lang}`}
                                onClick={() => {
                                  const updated = { ...languages };
                                  delete updated[lang];
                                  setLanguages(updated);
                                }}
                                className="absolute right-3 top-3 text-xs font-bold text-muted transition-colors duration-250 hover:text-primary"
                              >
                                ×
                              </button>
                            )}

                            <div className="mb-2.5 flex items-center justify-between pr-5">
                              <span className="text-sm font-bold text-foreground">{lang}</span>
                              {level && (
                                <span className="text-label uppercase text-primary">
                                  {level}
                                </span>
                              )}
                            </div>

                            <div className="mb-3 grid grid-cols-3 gap-1.5">
                              {(['Basic', 'Moderate', 'Fluent'] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => setLanguages({ ...languages, [lang]: lvl })}
                                  className={`relative rounded-lg py-1.5 text-caption font-bold transition-colors duration-250 ${
                                    level === lvl
                                      ? 'text-on-accent'
                                      : 'text-muted hover:text-primary'
                                  }`}
                                >
                                  {level === lvl && (
                                    <m.span
                                      layoutId={`fluency-${lang}`}
                                      transition={SPRING.snappy}
                                      className="absolute inset-0 rounded-lg bg-primary"
                                    />
                                  )}
                                  <span className="relative z-10">{lvl}</span>
                                </button>
                              ))}
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-[rgba(209,199,189,0.85)]">
                              <m.div
                                initial={{ width: 0 }}
                                animate={{ width: level ? fluencyMap[level] : 0 }}
                                transition={SPRING.soft}
                                className="h-full rounded-full bg-gradient-to-r from-[#AC9C8D] to-primary"
                              />
                            </div>
                          </m.div>
                        ))}
                      </AnimatePresence>
                    </m.div>
                  </div>

                  {/* soft skills */}
                  <div>
                    <span className="mb-2.5 block text-label uppercase text-muted">
                      Presenting &amp; soft skills <span className="text-primary">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {softSkillsOptions.map((opt) => {
                        const isSelected = selectedSoftSkills.includes(opt);
                        return (
                          <m.button
                            key={opt}
                            type="button"
                            onClick={() => toggleSoftSkill(opt)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            transition={SPRING.snappy}
                            aria-pressed={isSelected}
                            className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-colors duration-250 ${
                              isSelected
                                ? 'border-transparent bg-foreground text-on-accent'
                                : 'border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.6)] text-body hover:border-[rgba(50,45,41,0.35)] hover:text-foreground'
                            }`}
                          >
                            {opt}
                          </m.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between border-t border-[rgba(209,199,189,0.7)] pt-5">
                    <PremiumButton variant="ghost" magnetic={false} onClick={() => setStep(1)}>
                      Back
                    </PremiumButton>
                    <PremiumButton
                      magnetic={false}
                      onClick={() => {
                        if (validateStudentStep2()) setStep(3);
                      }}
                    >
                      Continue
                    </PremiumButton>
                  </div>
                </m.div>
              )}

              {/* ═══ STUDENT · STEP 3 ═══ */}
              {isStudent && step === 3 && (
                <m.div
                  key="s3"
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                  transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                  className="space-y-6"
                >
                  <SectionHeading eyebrow="Step three" title="Preferences and links" />

                  <div>
                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-label uppercase text-muted">
                        Preferred problem statements <span className="text-primary">*</span>
                      </span>
                      <span className="rounded-full border border-[rgba(114,56,61,0.24)] bg-[rgba(114,56,61,0.08)] px-2.5 py-0.5 text-caption font-bold text-primary">
                        {studentForm.trackInterest.length} / 2 selected
                      </span>
                    </div>

                    <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[rgba(172,156,141,0.65)] bg-[rgba(172,156,141,0.16)] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-caption font-semibold leading-relaxed text-body">
                        Official SIH 2026 statements are not published yet — these are reference
                        tracks built from the official themes.
                      </p>
                      <a
                        href="https://sih.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border border-[rgba(114,56,61,0.3)] bg-[rgba(248,246,242,0.7)] px-2.5 py-1 text-caption font-bold text-primary transition-colors duration-250 hover:bg-[rgba(248,246,242,0.95)]"
                      >
                        SIH portal <Icon icon={ArrowUpRight} size="xs" />
                      </a>
                    </div>

                    <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-[rgba(209,199,189,0.75)] bg-[rgba(239,233,225,0.4)] p-3">
                      {tracks.map((track) => {
                        const isSelected = studentForm.trackInterest.includes(track.id);
                        return (
                          <div
                            key={track.id}
                            role="checkbox"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onMouseEnter={() => setHoveredTrack(track)}
                            onFocus={() => setHoveredTrack(track)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                (e.currentTarget as HTMLDivElement).click();
                              }
                            }}
                            onClick={() => {
                              if (isSelected) {
                                setStudentForm({
                                  ...studentForm,
                                  trackInterest: studentForm.trackInterest.filter(
                                    (t) => t !== track.id
                                  ),
                                });
                                setError('');
                              } else {
                                if (studentForm.trackInterest.length >= 2) {
                                  setError('Exactly 2 problem statements must be selected.');
                                  return;
                                }
                                setStudentForm({
                                  ...studentForm,
                                  trackInterest: [...studentForm.trackInterest, track.id],
                                });
                                setError('');
                              }
                            }}
                            className={`flex cursor-pointer flex-col justify-between gap-2 rounded-xl border p-3 transition-colors duration-250 sm:flex-row sm:items-center ${
                              isSelected
                                ? 'border-[rgba(114,56,61,0.45)] bg-[rgba(114,56,61,0.07)]'
                                : 'border-[rgba(209,199,189,0.75)] bg-[rgba(248,246,242,0.55)] hover:border-[rgba(114,56,61,0.3)]'
                            }`}
                          >
                            <div className="flex min-w-0 items-start gap-2.5">
                              <span
                                aria-hidden
                                className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors duration-250 ${
                                  isSelected
                                    ? 'border-transparent bg-primary text-on-accent'
                                    : 'border-[rgba(172,156,141,0.9)] bg-transparent text-transparent'
                                }`}
                              >
                                <Icon icon={Check} size="xs" strokeWidth={3} />
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded border border-[rgba(114,56,61,0.28)] bg-[rgba(114,56,61,0.08)] px-1.5 py-0.5 font-mono text-caption font-bold text-primary">
                                    {track.problemStatementCode}
                                  </span>
                                  <span className="text-xs font-bold text-foreground">
                                    {track.name}
                                  </span>
                                </div>
                                {track.organization && (
                                  <p className="mt-0.5 text-caption text-muted">
                                    {track.organization} · {track.category}
                                  </p>
                                )}
                              </div>
                            </div>

                            {track.sihUrl && (
                              <a
                                href={track.sihUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 self-end text-caption font-bold text-primary transition-colors duration-250 hover:text-[var(--primary-hover)] sm:self-center"
                              >
                                Official <Icon icon={ArrowUpRight} size="xs" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      {hoveredTrack && (
                        <m.div
                          key={hoveredTrack.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
                          className="mt-3 space-y-2 rounded-2xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.85)] p-4"
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-[rgba(209,199,189,0.75)] pb-2">
                            <span className="font-mono text-caption font-bold text-primary">
                              {hoveredTrack.problemStatementCode}
                            </span>
                            <span className="rounded-full border border-[rgba(172,156,141,0.65)] bg-[rgba(172,156,141,0.2)] px-2 py-0.5 text-caption font-bold text-foreground">
                              {hoveredTrack.category}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-foreground">{hoveredTrack.name}</p>
                          <p className="text-xs leading-relaxed text-muted">
                            {hoveredTrack.description}
                          </p>
                          <div className="flex items-center justify-between pt-1 text-caption">
                            <span className="text-muted">
                              Ministry ·{' '}
                              <strong className="font-bold text-foreground">
                                {hoveredTrack.organization}
                              </strong>
                            </span>
                            {hoveredTrack.sihUrl && (
                              <a
                                href={hoveredTrack.sihUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-primary hover:underline"
                              >
                                Open SIH portal <Icon icon={ArrowUpRight} size="xs" />
                              </a>
                            )}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="GitHub profile"
                      type="url"
                      value={studentForm.githubUrl}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, githubUrl: e.target.value })
                      }
                      hint="https://github.com/username"
                    />
                    <Field
                      label="LinkedIn profile"
                      type="url"
                      value={studentForm.linkedinUrl}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, linkedinUrl: e.target.value })
                      }
                      hint="https://linkedin.com/in/username"
                    />
                  </div>

                  <Field
                    label="Resume link (optional)"
                    type="url"
                    value={studentForm.resumeUrl}
                    onChange={(e) => setStudentForm({ ...studentForm, resumeUrl: e.target.value })}
                    hint="Make sure the sharing link is public."
                  />

                  <div className="flex justify-between border-t border-[rgba(209,199,189,0.7)] pt-5">
                    <PremiumButton variant="ghost" magnetic={false} onClick={() => setStep(2)}>
                      Back
                    </PremiumButton>
                    <PremiumButton
                      magnetic={false}
                      loading={submitting}
                      onClick={handleStudentSubmit}
                    >
                      Complete onboarding
                    </PremiumButton>
                  </div>
                </m.div>
              )}

              {/* ═══ MENTOR · STEP 1 ═══ */}
              {!isStudent && step === 1 && (
                <m.div
                  key="m1"
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                  transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                  className="space-y-5"
                >
                  <SectionHeading eyebrow="Step one" title="Professional information" />

                  {/* profile photo */}
                  <div className="space-y-2">
                    <span className="text-label uppercase text-muted">
                      Profile photo (Optional)
                    </span>

                    {mentorForm.avatarUrl ? (
                      <div className="flex flex-col items-center gap-5 rounded-2xl border border-[rgba(209,199,189,0.8)] bg-[rgba(239,233,225,0.5)] p-4 sm:flex-row">
                        <div className="size-24 shrink-0 overflow-hidden rounded-2xl border-2 border-[rgba(114,56,61,0.5)] shadow-[0_10px_30px_rgba(50,45,41,0.14)]">
                          <img
                            src={mentorForm.avatarUrl}
                            alt="Uploaded profile preview"
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <span className="inline-flex items-center rounded-full border border-[rgba(172,156,141,0.7)] bg-[rgba(172,156,141,0.2)] px-2.5 py-0.5 text-caption font-bold text-foreground">
                            Photo active
                          </span>
                          <p className="text-xs leading-relaxed text-muted">
                            This photo appears on your card across the mentor directory.
                          </p>
                          <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
                            <label className="cursor-pointer rounded-lg border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] px-3 py-1.5 text-caption font-bold text-primary transition-colors duration-250 hover:bg-[rgba(114,56,61,0.15)]">
                              Change photo
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setMentorForm({ ...mentorForm, avatarUrl: '' })}
                              className="rounded-lg border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.7)] px-3 py-1.5 text-caption font-bold text-body transition-colors duration-250 hover:text-primary"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <m.label
                        whileHover={{ y: -3 }}
                        transition={SPRING.snappy}
                        className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(172,156,141,0.75)] bg-[rgba(239,233,225,0.45)] p-8 text-center transition-colors duration-250 hover:border-[rgba(114,56,61,0.5)] hover:bg-[rgba(248,246,242,0.75)]"
                      >
                        <span className="mb-3 grid size-12 place-items-center rounded-full bg-[rgba(114,56,61,0.09)] text-primary transition-transform duration-250 group-hover:scale-110">
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              stroke="currentColor"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          Upload your profile photo
                        </span>
                        <span className="mt-1 text-caption text-muted">
                          JPEG, PNG or WEBP up to 1.5 MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                        />
                      </m.label>
                    )}
                  </div>

                  <Field
                    label="Full name"
                    autoComplete="name"
                    value={mentorForm.name}
                    onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                  />

                  <SelectField
                    label="Which campus are you from?"
                    value={mentorForm.college}
                    onChange={(e) => setMentorForm({ ...mentorForm, college: e.target.value })}
                  >
                    <option value="">Select campus</option>
                    <option value="GL Bajaj Mathura">GL Bajaj Mathura</option>
                    <option value="GL Bajaj Noida">GL Bajaj Noida</option>
                  </SelectField>
                  <Field
                    label="Designation or role"
                    value={mentorForm.designation}
                    onChange={(e) => setMentorForm({ ...mentorForm, designation: e.target.value })}
                    hint="Assistant Professor, Tech Lead, …"
                  />
                  <Field
                    label="Organization or department"
                    value={mentorForm.organization}
                    onChange={(e) => setMentorForm({ ...mentorForm, organization: e.target.value })}
                  />

                  <Field
                    label="Phone / Mobile number *"
                    type="tel"
                    value={mentorForm.contact}
                    onChange={(e) => setMentorForm({ ...mentorForm, contact: e.target.value })}
                    hint="Used for team communication when mutually accepted."
                  />

                  <div className="flex justify-end border-t border-[rgba(209,199,189,0.7)] pt-5">
                    <PremiumButton
                      magnetic={false}
                      onClick={() => {
                        if (validateMentorStep1()) setStep(2);
                      }}
                    >
                      Continue
                    </PremiumButton>
                  </div>
                </m.div>
              )}

              {/* ═══ MENTOR · STEP 2 ═══ */}
              {!isStudent && step === 2 && (
                <m.div
                  key="m2"
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                  transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                  className="space-y-5"
                >
                  <SectionHeading eyebrow="Step two" title="Expertise and biography" />

                  <Field
                    label="Expertise tags"
                    value={mentorForm.expertiseInput}
                    onChange={(e) =>
                      setMentorForm({ ...mentorForm, expertiseInput: e.target.value })
                    }
                    hint="Comma separated — Machine Learning, Blockchain, IoT"
                  />

                  <Labelled label="Short biography">
                    <textarea
                      rows={4}
                      placeholder="Mentorship domain, past projects guided…"
                      value={mentorForm.bio}
                      onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                      className={`${CONTROL} resize-y`}
                    />
                  </Labelled>

                  <Field
                    label="LinkedIn profile"
                    type="url"
                    value={mentorForm.linkedinUrl}
                    onChange={(e) => setMentorForm({ ...mentorForm, linkedinUrl: e.target.value })}
                    hint="https://linkedin.com/in/username"
                  />

                  <div className="flex justify-between border-t border-[rgba(209,199,189,0.7)] pt-5">
                    <PremiumButton variant="ghost" magnetic={false} onClick={() => setStep(1)}>
                      Back
                    </PremiumButton>
                    <PremiumButton
                      magnetic={false}
                      loading={submitting}
                      onClick={handleMentorSubmit}
                    >
                      Complete onboarding
                    </PremiumButton>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </Container>
      </main>
    </div>
  );
}
