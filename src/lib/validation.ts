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
  action: z.enum(['accept', 'decline']),
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
