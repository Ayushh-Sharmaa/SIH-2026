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

/**
 * Resolves a search term against canonical skill values and variations
 * to ensure deterministic, case-insensitive PostgreSQL array queries.
 */
export function resolveSkillVariants(query: string): string[] {
  if (!query || !query.trim()) return [];
  const qClean = query.trim();
  const qLower = qClean.toLowerCase();
  const variants = new Set<string>([qClean]);

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
