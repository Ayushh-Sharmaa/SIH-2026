import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Token signing and password hashing.
 *
 * SECURITY: this module previously fell back to a hardcoded literal when
 * NEXTAUTH_SECRET was unset. That literal was committed to the repository, so
 * any deployment missing the env var silently signed sessions with a publicly
 * known key — enough for anyone reading the source to forge an ADMIN token.
 * The fallback is gone: production now refuses to sign rather than run
 * insecurely. The old value is deliberately not repeated here, and should be
 * treated as compromised if it was ever used in a real deployment.
 */

const BCRYPT_ROUNDS = 12; // OWASP's current floor; was 10.

function resolveSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;

  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXTAUTH_SECRET is missing or shorter than 32 characters. Refusing to sign ' +
        'sessions: they cannot be secured without it.',
    );
  }

  // Development only. Deliberately random per process, so a forgotten env var
  // can never become a known shared secret. Sessions ending on restart is the
  // intended signal that the variable needs setting.
  if (!globalThis.__sihDevSecret) {
    globalThis.__sihDevSecret = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    console.warn(
      '[SIH@GLBGOI] NEXTAUTH_SECRET is not set. Using an ephemeral development ' +
        'secret — sessions will not survive a restart. Set it in .env.',
    );
  }
  return globalThis.__sihDevSecret;
}

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
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionClaims {
  userId: string;
  email: string;
  role: string;
}

const ISSUER = 'sih-glbgoi';
const AUDIENCE = 'sih-glbgoi-portal';

export function signToken(payload: SessionClaims): string {
  return jwt.sign(payload, resolveSecret(), {
    expiresIn: '7d',
    algorithm: 'HS256',
    // Binding issuer and audience means a token minted elsewhere with the same
    // secret cannot be replayed against this app.
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function verifyToken(token: string): SessionClaims | null {
  try {
    const claims = jwt.verify(token, resolveSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      // Pinning the algorithm rejects `alg: none` and HS/RS confusion attacks.
      algorithms: ['HS256'],
    }) as SessionClaims;

    // Never trust the shape of a decoded payload without checking it.
    if (!claims?.userId || !claims?.email || !claims?.role) return null;
    return claims;
  } catch {
    return null;
  }
}

declare global {
  var __sihDevSecret: string | undefined;
}
