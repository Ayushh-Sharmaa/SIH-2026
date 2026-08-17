/**
 * Canonical Technical, Soft Skills and Language Catalogs for SIH@GLBGOI.
 *
 * Provides authoritative definitions, display labels, and normalization
 * utilities for fast, deterministic search across profile attributes.
 */

export const STANDARD_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'JavaScript',
  'TypeScript',
  'Next.js',
  'HTML',
  'CSS',
  'Tailwind',
  'Vue',
  'Angular',
  'Express',
  'Django',
  'Go',
  'Java',
  'Spring Boot',
  'PostgreSQL',
  'MongoDB',
  'Docker',
  'Figma',
  'Git',
  'Machine Learning',
  'REST APIs',
  'Cloud Computing',
  'SQL',
  'Flutter',
  'React Native',
  'AWS',
  'Kubernetes',
  'Cybersecurity',
  'User Research',
  'Wireframing',
  'Prototyping',
  'UI/UX Design',
  'Canva',
  'Adobe XD',
  'C++',
  'OpenCV',
  'PyTorch',
  'TensorFlow',
  'Solidity',
  'GraphQL',
] as const;

export const SOFT_SKILLS_OPTIONS = [
  'Communication',
  'Leadership',
  'Problem Solving',
  'Teamwork',
  'PPT Making',
  'Public Speaking/Presenting',
  'Technical Writing',
  'UI/UX Design',
  'Video Editing',
  'Management',
] as const;

export const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Punjabi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
] as const;

const SKILL_SYNONYMS: Record<string, string[]> = {
  ml: ['Machine Learning', 'AI/ML', 'Machine learning', 'ML'],
  ai: ['AI/ML', 'Artificial Intelligence', 'AI', 'Machine Learning'],
  'ai/ml': ['AI/ML', 'Machine Learning', 'AI', 'ML'],
  'machine learning': ['Machine Learning', 'AI/ML', 'ML', 'Machine learning'],
  js: ['JavaScript', 'Javascript', 'JS'],
  ts: ['TypeScript', 'Typescript', 'TS'],
  py: ['Python', 'python'],
  cpp: ['C++', 'CPP', 'c++'],
  'c++': ['C++', 'CPP', 'cpp'],
  react: ['React', 'React.js', 'ReactJS', 'React Native'],
  node: ['Node.js', 'NodeJS', 'Node'],
  'node.js': ['Node.js', 'NodeJS', 'Node'],
  next: ['Next.js', 'NextJS', 'Next'],
  'next.js': ['Next.js', 'NextJS', 'Next'],
  frontend: ['React', 'Next.js', 'Vue', 'Angular', 'HTML', 'CSS', 'Tailwind', 'JavaScript', 'TypeScript'],
  backend: ['Node.js', 'Express', 'Django', 'Spring Boot', 'Go', 'Java', 'Python', 'PostgreSQL', 'MongoDB'],
  database: ['PostgreSQL', 'MongoDB', 'SQL', 'MySQL'],
  db: ['PostgreSQL', 'MongoDB', 'SQL'],
  ui: ['UI/UX Design', 'Figma', 'Canva', 'Adobe XD', 'Prototyping', 'Wireframing'],
  'ui/ux': ['UI/UX Design', 'Figma', 'Canva', 'Adobe XD', 'Prototyping', 'Wireframing'],
  ux: ['UI/UX Design', 'User Research', 'Figma', 'Wireframing'],
};

/**
 * Resolves technical skill variations for robust PostgreSQL array matching.
 */
export function resolveSkillVariants(query: string): string[] {
  if (!query || !query.trim()) return [];
  const qClean = query.trim();
  const qLower = qClean.toLowerCase();
  const variants = new Set<string>([qClean]);

  // Check synonym mappings
  if (SKILL_SYNONYMS[qLower]) {
    for (const syn of SKILL_SYNONYMS[qLower]) {
      variants.add(syn);
    }
  }

  // Match from known standard skills
  for (const skill of STANDARD_SKILLS) {
    if (skill.toLowerCase() === qLower || skill.toLowerCase().includes(qLower)) {
      variants.add(skill);
    }
  }

  // Add standard casing variants
  variants.add(qLower);
  variants.add(qClean.toUpperCase());
  if (qClean.length > 0) {
    variants.add(qClean.charAt(0).toUpperCase() + qClean.slice(1).toLowerCase());
  }

  return Array.from(variants);
}

/**
 * Resolves soft skills query variations for PostgreSQL array matching.
 */
export function resolveSoftSkillVariants(query: string): string[] {
  if (!query || !query.trim()) return [];
  const qClean = query.trim();
  const qLower = qClean.toLowerCase();
  const variants = new Set<string>([qClean]);

  for (const ss of SOFT_SKILLS_OPTIONS) {
    if (ss.toLowerCase() === qLower || ss.toLowerCase().includes(qLower)) {
      variants.add(ss);
    }
  }

  variants.add(qLower);
  variants.add(qClean.toUpperCase());
  return Array.from(variants);
}

/**
 * Resolves spoken language query variations for PostgreSQL array matching.
 */
export function resolveLanguageVariants(query: string): string[] {
  if (!query || !query.trim()) return [];
  const qClean = query.trim();
  const qLower = qClean.toLowerCase();
  const variants = new Set<string>([qClean]);

  for (const lang of LANGUAGE_OPTIONS) {
    if (lang.toLowerCase() === qLower || lang.toLowerCase().includes(qLower)) {
      variants.add(lang);
      variants.add(`${lang} (Fluent)`);
      variants.add(`${lang} (Conversational)`);
      variants.add(`${lang} (Basic)`);
    }
  }

  variants.add(qLower);
  variants.add(qClean.toUpperCase());
  return Array.from(variants);
}
