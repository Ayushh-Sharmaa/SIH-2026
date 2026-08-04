import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sih-glbgoi-nexa-secret-key-sih2026';

// Platform is restricted to GL Bajaj students and faculty only.
export const ALLOWED_EMAIL_DOMAINS = ['glbajaj.org', 'glbajajgroup.org'];

// Emails are stored and looked up lowercased, so signup and login always agree.
export function normalizeEmail(email: string): string {
  return String(email ?? '').trim().toLowerCase();
}

export function isAllowedCollegeEmail(email: string): boolean {
  const domain = normalizeEmail(email).split('@')[1];
  return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}
