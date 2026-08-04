'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * Client-side session state, fetched once per page load.
 *
 * The navbar previously called `/api/auth/me` inside an effect keyed on
 * `pathname`, so every client-side navigation fired a fresh request for data
 * that had not changed. Two costs came out of that:
 *
 *   - a network round trip on the critical path of every route change, competing
 *     with the RSC payload the navigation actually needed, and
 *   - the identity block dropping back to its shimmer skeleton each time,
 *     so the user's own name flickered away and returned on every page they
 *     visited — an interface that looks like it is re-authenticating constantly.
 *
 * Session identity changes only when the user signs in or out, both of which are
 * actions this app initiates. So it is fetched once and then invalidated
 * explicitly through `refresh()` and `clear()`.
 *
 * This is deliberately a small hand-rolled context rather than a data-fetching
 * dependency: it is one endpoint with one cache entry, and adding a client
 * cache library to the bundle to manage it would cost more than it saves.
 */

export interface SessionUser {
  name: string;
  role: string;
}

/**
 * `loading` is the pre-resolution state and exists so consumers can render a
 * skeleton rather than briefly asserting the user is signed out — which would
 * flash a "Sign In" button at somebody who is already signed in.
 */
export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionValue {
  user: SessionUser | null;
  status: SessionStatus;
  /** Re-reads the session from the server. Call after a successful sign-in. */
  refresh: () => Promise<void>;
  /** Drops to anonymous without a round trip. Call after sign-out. */
  clear: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  // Guards against setting state after unmount, and against a stale response
  // from an earlier request overwriting a newer one.
  const mounted = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      // `same-origin` credentials are the default for same-origin requests, but
      // stating it makes the cookie dependency explicit at the call site.
      const response = await fetch('/api/auth/me', {
        credentials: 'same-origin',
        // The session cookie can change underneath a cached response, so this
        // must never be served from the HTTP cache.
        cache: 'no-store',
      });

      // A superseded or unmounted request must not write state.
      if (!mounted.current || id !== requestId.current) return;

      if (!response.ok) {
        setUser(null);
        setStatus('anonymous');
        return;
      }

      const data: unknown = await response.json();
      if (!mounted.current || id !== requestId.current) return;

      // Validated rather than trusted: this shape crosses a network boundary,
      // and a malformed payload should degrade to "signed out" rather than
      // render `undefined` into the interface.
      const authenticated =
        typeof data === 'object' &&
        data !== null &&
        'authenticated' in data &&
        (data as { authenticated: unknown }).authenticated === true &&
        'user' in data &&
        typeof (data as { user: unknown }).user === 'object' &&
        (data as { user: unknown }).user !== null;

      if (!authenticated) {
        setUser(null);
        setStatus('anonymous');
        return;
      }

      const raw = (data as { user: Record<string, unknown> }).user;
      setUser({
        name: typeof raw.name === 'string' ? raw.name : '',
        role: typeof raw.role === 'string' ? raw.role : '',
      });
      setStatus('authenticated');
    } catch {
      // Network failure is not proof of being signed out, but it is the only
      // safe assumption for what the interface may offer. No error is surfaced:
      // a transient blip must not put a scary banner over the whole app.
      if (!mounted.current || id !== requestId.current) return;
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clear = useCallback(() => {
    // Bump the request id so any in-flight load cannot resurrect the old user.
    requestId.current++;
    setUser(null);
    setStatus('anonymous');
  }, []);

  // Memoised so consumers do not re-render on every provider render merely
  // because the context object identity changed.
  const value = useMemo<SessionValue>(
    () => ({ user, status, refresh: load, clear }),
    [user, status, load],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Reads the current session.
 *
 * Throws outside a provider rather than returning a silent anonymous default,
 * because that default would render a signed-in user a "Sign In" button with no
 * indication anything was wrong.
 */
export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within a <SessionProvider>.');
  }
  return value;
}
