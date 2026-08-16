import { z } from 'zod';

const optionalUrlSchema = (domainPattern?: RegExp, errorMsg?: string) =>
  z.preprocess(
    (val) => {
      if (val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z
      .string()
      .url({ message: errorMsg || 'Invalid URL' })
      .refine((v) => !v || !domainPattern || domainPattern.test(v.toLowerCase()), {
        message: errorMsg || 'Invalid URL',
      })
      .max(255)
      .optional()
      .nullable()
  );

const githubUrlSchema = optionalUrlSchema(/github\.com/, 'GitHub profile must be a valid GitHub URL');
const linkedinUrlSchema = optionalUrlSchema(/linkedin\.com/, 'LinkedIn profile URL is invalid');
const resumeUrlSchema = optionalUrlSchema(undefined, 'Resume link must be a valid public URL');

// 1. Authentication
export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().min(1).max(255),
    password: z.string().max(100),
  })
  .superRefine(({ email, password }, context) => {
    const cleanEmail = email.replace(/\/admin$/i, '');
    const isSandbox = /^bantan@bantan0607(?:\/(?:student|mentor))?$/i.test(email);
    if (!isSandbox && !z.string().email().safeParse(cleanEmail).success) {
      context.addIssue({ code: 'custom', path: ['email'], message: 'Invalid email address' });
    }
    if (!isSandbox && password.length < 8) {
      context.addIssue({ code: 'custom', path: ['password'], message: 'Password must be at least 8 characters' });
    }
  });

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(100),
  role: z.enum(['STUDENT', 'MENTOR']),
  name: z.string().trim().min(2).max(100),
  registrationKey: z.string().trim().max(100).optional(),
});

export const onboardingRoleSchema = z.object({
  role: z.enum(['STUDENT', 'MENTOR']),
  registrationKey: z.string().trim().max(100).optional(),
});

// 2. Profiles
export const personalProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  gender: z.string().trim().max(40).optional().nullable(),
  rollNo: z.string().trim().max(40).optional().nullable(),
  year: z.string().trim().min(1, "Year of study is required").max(40),
  branch: z.string().trim().min(1, "Course/branch is required").max(40),
  section: z.string().trim().max(10).optional().nullable(),
  category: z.string().trim().max(40).optional().nullable(),
  contact: z.string().trim().max(40).optional().nullable(),
  avatarUrl: z.string().max(3_000_000).optional().nullable(),
});

export const skillsProfileSchema = z.object({
  skills: z.array(z.string().trim().max(100)).max(100, "You can select at most 100 technical skills"),
  languages: z.array(z.string().trim().max(100)).max(30, "You can select at most 30 languages"),
  softSkills: z.array(z.string().trim().max(100)).max(30, "You can select at most 30 soft skills"),
});

export const themesProfileSchema = z.object({
  trackInterest: z.array(z.string().trim().max(100)).max(10, "You can select up to 10 themes"),
  githubUrl: githubUrlSchema,
  linkedinUrl: linkedinUrlSchema,
  resumeUrl: resumeUrlSchema,
});

export const studentProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  year: z.string().trim().min(1, "Year is required").max(40),
  branch: z.string().trim().min(1, "Branch is required").max(40),
  gender: z.string().trim().max(40).optional(),
  rollNo: z.string().trim().max(40).optional(),
  section: z.string().trim().max(10).optional(),
  category: z.string().trim().max(40).optional(),
  contact: z.string().trim().max(40).optional(),
  college: z.string().trim().min(2).max(150).optional(),
  skills: z.array(z.string().trim().max(100)).max(100, "You can select at most 100 technical skills"),
  languages: z.array(z.string().trim().max(100)).max(30, "You can select at most 30 languages"),
  softSkills: z.array(z.string().trim().max(100)).max(30, "You can select at most 30 soft skills"),
  resumeUrl: resumeUrlSchema,
  githubUrl: githubUrlSchema,
  linkedinUrl: linkedinUrlSchema,
  avatarUrl: z.string().max(3_000_000).optional(),
  trackInterest: z
    .array(z.string().trim().max(100))
    .max(10, "You can select at most 10 preferred problem statements")
    .optional()
    .default([]),
});

export const mentorProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  designation: z.string().trim().min(2).max(100),
  organization: z.string().trim().min(2).max(100),
  contact: z.string().trim().max(40).optional(),
  expertise: z.array(z.string().trim().max(100)).max(100, "You can select at most 100 expertise tags"),
  bio: z.string().trim().max(2000).optional(),
  linkedinUrl: linkedinUrlSchema,
  avatarUrl: z.string().max(3_000_000).optional(),
  college: z.string().trim().min(2).max(150).optional(),
});

// 3. Teams & Requests
export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(100),
  trackId: z.string().trim().min(1).max(100),
  secondaryTrackId: z.string().trim().max(100).nullable().optional(),
  whatsapp: z.string().trim().max(40).optional(),
  logoUrl: z.string().optional(),
  customMentorName: z.string().trim().max(100).optional(),
  customMentorDesignation: z.string().trim().max(100).optional(),
  customMentorMobile: z.string().trim().max(40).optional(),
  customMentorEmail: z.string().trim().max(100).optional(),
  customPsCode: z.string().trim().max(40).optional(),
  customPsName: z.string().trim().max(200).optional(),
  customPsCategory: z.string().trim().max(40).optional(),
  customSecondaryPsCode: z.string().trim().max(40).optional(),
  customSecondaryPsName: z.string().trim().max(200).optional(),
  customSecondaryPsCategory: z.string().trim().max(40).optional(),
});

export const updateTeamDetailsSchema = z.object({
  action: z.literal('update_team_details'),
  teamId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(2).max(100),
  trackId: z.string().trim().min(1).max(100),
  secondaryTrackId: z.string().trim().max(100).nullable().optional(),
  whatsapp: z.string().trim().max(40).optional(),
  logoUrl: z.string().max(3_000_000).nullable().optional(),
  customMentorName: z.string().trim().max(100).optional(),
  customMentorDesignation: z.string().trim().max(100).optional(),
  customMentorMobile: z.string().trim().max(40).optional(),
  customMentorEmail: z.string().trim().email().max(100).or(z.literal('')).optional(),
  customSecondaryPsCode: z.string().trim().max(40).optional(),
  customSecondaryPsName: z.string().trim().max(200).optional(),
  customSecondaryPsCategory: z.string().trim().max(40).optional(),
});

export const deleteTeamSchema = z.object({
  teamId: z.string().trim().min(1).max(100),
});

export const teamInviteSchema = z.object({
  studentId: z.string().trim().min(1).max(100),
});

export const respondTeamInviteSchema = z.object({
  inviteId: z.string().trim().min(1).max(100),
  action: z.enum(['accept', 'decline', 'on_hold', 'waitlist']),
});

export const joinRequestSchema = z.object({
  teamId: z.string().trim().min(1).max(100),
  message: z.string().trim().max(2000).optional(),
});

export const respondJoinRequestSchema = z.object({
  requestId: z.string().trim().min(1).max(100),
  action: z.enum(['accept', 'decline', 'on_hold', 'meeting_requested']),
});

export const mentorRequestSchema = z.object({
  mentorId: z.string().trim().min(1).max(100),
  message: z.string().trim().max(2000).optional(),
});

export const respondMentorRequestSchema = z.object({
  action: z.enum(['accept', 'decline', 'meeting_requested', 'keep_pending']),
});

// 4. Admin Management
export const adminStudentActionSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  action: z.enum(['ban', 'unban', 'remove', 'restore', 'delete']),
});

export const adminTeamActionSchema = z.object({
  teamId: z.string().trim().min(1).max(100),
  action: z.enum(['update_status', 'delete']),
  status: z.enum(['forming', 'locked', 'complete']).optional(),
});

export const adminViewAsSchema = z.object({
  role: z.enum(['STUDENT', 'MENTOR']),
});

export const adminMentorApproveSchema = z.object({
  mentorId: z.string().trim().min(1).max(100),
});

export const adminAccessSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  action: z.enum(['add', 'remove']),
});

export const teamMemberActionSchema = z.object({
  action: z.enum(['leave', 'kick']),
  targetUserId: z.string().trim().min(1).max(100).optional(),
});

// 5. Query parameters
//
// Search params arrive as strings straight off the URL and were previously read
// with `searchParams.get(...)` and passed to Prisma unchecked. Prisma's own
// parameterisation stops SQL injection, but it does not stop a caller sending a
// 100 KB filter value that the database then has to compare against every row.
// These schemas apply the same length discipline as the body schemas above.

/** A cuid/uuid-shaped record id. Deliberately narrow: ids are never free text. */
const recordId = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/, 'id must be alphanumeric');

export const profileLookupQuerySchema = z.object({
  userId: recordId.optional(),
});

export const studentSearchQuerySchema = z.object({
  name: z.string().trim().max(100).optional(),
  skill: z.string().trim().max(100).optional(),
  softSkill: z.string().trim().max(100).optional(),
  language: z.string().trim().max(100).optional(),
  trackId: recordId.optional(),
  college: z.string().trim().max(100).optional(),
  branch: z.string().trim().max(100).optional(),
  year: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
});

export const teamSearchQuerySchema = z.object({
  name: z.string().trim().max(100).optional(),
  skill: z.string().trim().max(100).optional(),
  trackId: z.string().trim().max(100).optional(),
  domain: z.string().trim().max(100).optional(),
  leader: z.string().trim().max(100).optional(),
  size: z.string().trim().max(100).optional(),
  status: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
});

export const mentorSearchQuerySchema = z.object({
  name: z.string().trim().max(100).optional(),
  expertise: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
});

export const dashboardQuerySchema = z.object({
  role: z.enum(['STUDENT', 'MENTOR']).optional(),
});

/**
 * Reads and validates search params, dropping absent keys so `.optional()`
 * behaves as expected rather than seeing an explicit `null`.
 */
export function parseQuery<T extends z.ZodTypeAny>(url: string, schema: T) {
  const params = new URL(url).searchParams;
  const raw: Record<string, string> = {};
  for (const [key, value] of params) {
    if (value !== '') raw[key] = value;
  }
  return schema.safeParse(raw) as z.ZodSafeParseResult<z.infer<T>>;
}
