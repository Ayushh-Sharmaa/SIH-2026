import { z } from 'zod';

// Helper for optional URLs or empty strings
const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().url().max(255).optional());

// 1. Authentication
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(100),
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
export const studentProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  year: z.string().trim().min(1).max(40),
  branch: z.string().trim().min(1).max(40),
  gender: z.string().trim().max(40).optional(),
  rollNo: z.string().trim().max(40).optional(),
  section: z.string().trim().max(10).optional(),
  skills: z.array(z.string().trim().max(100)).max(30),
  languages: z.array(z.string().trim().max(100)).max(30),
  softSkills: z.array(z.string().trim().max(100)).max(30),
  resumeUrl: optionalUrl,
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  avatarUrl: z.string().max(3_000_000).optional(),
  trackInterest: z.array(z.string().trim().max(100)).max(30),
});

export const mentorProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  designation: z.string().trim().min(2).max(100),
  organization: z.string().trim().min(2).max(100),
  expertise: z.array(z.string().trim().max(100)).max(30),
  capacity: z.number().int().min(1).max(10),
  bio: z.string().trim().max(2000).optional(),
  linkedinUrl: optionalUrl,
});

// 3. Teams & Requests
export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(100),
  trackId: z.string().trim().min(1).max(100),
  whatsapp: z.string().trim().max(40).optional(),
});

export const teamInviteSchema = z.object({
  studentId: z.string().trim().min(1).max(100),
});

export const respondTeamInviteSchema = z.object({
  inviteId: z.string().trim().min(1).max(100),
  action: z.enum(['accept', 'decline', 'hold']),
});

export const joinRequestSchema = z.object({
  teamId: z.string().trim().min(1).max(100),
  message: z.string().trim().max(2000).optional(),
});

export const respondJoinRequestSchema = z.object({
  requestId: z.string().trim().min(1).max(100),
  action: z.enum(['accept', 'decline']),
});

export const mentorRequestSchema = z.object({
  mentorId: z.string().trim().min(1).max(100),
  message: z.string().trim().max(2000).optional(),
});

export const respondMentorRequestSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

// 4. Admin Management
export const adminStudentActionSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  action: z.enum(['ban', 'unban', 'remove', 'restore']),
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
  name: z.string().optional(),
  skill: z.string().trim().max(100).optional(),
  softSkill: z.string().trim().max(100).optional(),
  language: z.string().trim().max(100).optional(),
  trackId: recordId.optional(),
});

export const teamSearchQuerySchema = z.object({
  name: z.string().optional(),
  skill: z.string().optional(),
  trackId: z.string().optional(),
});

export const mentorSearchQuerySchema = z.object({
  name: z.string().optional(),
  expertise: z.string().trim().max(100).optional(),
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
