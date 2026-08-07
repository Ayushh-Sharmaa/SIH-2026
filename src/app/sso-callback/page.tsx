'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/**
 * Completes the Google OAuth handshake.
 *
 * Clerk's `authenticateWithRedirect` sends the browser back to `redirectUrl`
 * carrying the OAuth result in the URL, and expects to land on a page that
 * mounts this component to finish the exchange client-side.
 *
 * It previously pointed straight at `/api/auth/clerk-sync`, a route handler.
 * An API route cannot complete the handshake, so the callback died there and
 * the user saw a 404 or an error screen after choosing their Google account.
 *
 * Once the exchange succeeds, Clerk forwards to `redirectUrlComplete`
 * (/api/auth/clerk-sync), which now has a real Clerk session to read and can
 * issue the application's own session cookie.
 */
export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm font-semibold text-muted">Completing Google sign-in…</p>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/api/auth/clerk-sync"
        signUpForceRedirectUrl="/api/auth/clerk-sync"
        signInFallbackRedirectUrl="/api/auth/clerk-sync"
        signUpFallbackRedirectUrl="/api/auth/clerk-sync"
      />
    </div>
  );
}
