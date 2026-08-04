import { prisma } from './prisma';
import { hashPassword, normalizeEmail } from './auth';
import { parseSandboxInput, SANDBOX_BASE_EMAIL, type SandboxRole } from './sandboxShared';

export { SANDBOX_BASE_EMAIL };
export type { SandboxRole };

/**
 * Passwordless sandbox access for exploring and troubleshooting the platform
 * without repeatedly signing in as real students or mentors.
 *
 * Typed into the email field on either the login or signup form:
 *   BanTan@BanTan0607           -> student dashboard
 *   BanTan@BanTan0607/student   -> student dashboard
 *   BanTan@BanTan0607/mentor    -> mentor dashboard
 *
 * No password is required, so this is a deliberate backdoor. Set
 * ENABLE_SANDBOX_ACCOUNT=false in the environment to switch it off entirely
 * (for example before a public demo or judging) without touching code.
 */
// Separate rows so the student and mentor profiles can coexist
export const SANDBOX_STUDENT_EMAIL = 'bantan@bantan0607';
export const SANDBOX_MENTOR_EMAIL = 'bantan.mentor@bantan0607';

export function isSandboxEnabled(): boolean {
  return process.env.ENABLE_SANDBOX_ACCOUNT !== 'false';
}

/**
 * Returns the requested sandbox role, or null when this isn't a sandbox login.
 * Returns null when the sandbox is disabled, so callers fall through to the
 * normal credential path.
 */
export function parseSandboxRequest(rawEmail: string): SandboxRole | null {
  if (!isSandboxEnabled()) return null;
  return parseSandboxInput(rawEmail);
}

export function isSandboxEmail(email: string): boolean {
  const clean = normalizeEmail(email);
  return clean === SANDBOX_STUDENT_EMAIL || clean === SANDBOX_MENTOR_EMAIL;
}

/**
 * Finds or creates the demo user for the given role. Profiles are created
 * fully populated so the account lands straight on the dashboard rather than
 * being bounced into onboarding.
 */
export async function ensureSandboxUser(role: SandboxRole) {
  const email = role === 'MENTOR' ? SANDBOX_MENTOR_EMAIL : SANDBOX_STUDENT_EMAIL;

  let user = await prisma.user.findUnique({
    where: { email },
    include: { studentProfile: true, mentorProfile: true },
  });

  if (!user) {
    const passwordHash = await hashPassword(`sandbox-no-login-${role.toLowerCase()}`);
    const created = await prisma.user.create({
      data: { email, passwordHash, role },
    });

    if (role === 'STUDENT') {
      await prisma.studentProfile.create({
        data: {
          userId: created.id,
          name: 'BanTan Sandbox Student',
          year: '3rd Year',
          branch: 'CSE',
          gender: 'Prefer not to say',
          rollNo: 'GLB-DEMO-999',
          section: 'A',
          isDemo: true,
          skills: ['React', 'Python', 'Node.js', 'UI/UX Design'],
          languages: ['Hindi', 'English'],
          softSkills: ['Presenting', 'PPT making'],
        },
      });
    } else {
      await prisma.mentorProfile.create({
        data: {
          userId: created.id,
          name: 'BanTan Sandbox Mentor',
          designation: 'Sandbox Faculty Mentor',
          organization: 'GL Bajaj Group of Institutions',
          isDemo: true,
          verified: true,
          expertise: ['AI/ML', 'Web Development'],
        },
      });
    }

    user = await prisma.user.findUnique({
      where: { id: created.id },
      include: { studentProfile: true, mentorProfile: true },
    });
  }

  const name =
    user!.studentProfile?.name ||
    user!.mentorProfile?.name ||
    `BanTan Sandbox ${role}`;

  return { user: user!, name, role };
}
