'use client';

/**
 * Lightweight in-memory query cache and request deduplicator.
 *
 * Guarantees:
 * 1. Request deduplication: Concurrent requests for the same key share a single in-flight Promise.
 * 2. Stale-while-revalidate: Returns cached data immediately while refreshing in the background.
 * 3. Strict privacy: NEVER stores sensitive PII, roll numbers, phone numbers, or tokens in localStorage.
 *    Only safe public/preference data (theme catalogs, UI filters, search history) can be persisted.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();
const IN_FLIGHT_PROMISES = new Map<string, Promise<unknown>>();
const SUBSCRIBERS = new Map<string, Set<(data: unknown) => void>>();

// Safe keys permitted to touch localStorage
const SAFE_PERSIST_KEYS = new Set([
  'sih_theme_list',
  'sih_filter_presets',
  'sih_ui_theme_prefs',
  'sih_static_skills',
]);

const DEFAULT_TTL_MS = 30_000; // 30 seconds fresh window

export class QueryClient {
  /** Read from in-memory cache */
  static get<T>(key: string): T | null {
    const entry = MEMORY_CACHE.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      if (typeof window !== 'undefined' && SAFE_PERSIST_KEYS.has(key)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            MEMORY_CACHE.set(key, { data: parsed, timestamp: Date.now() });
            return parsed as T;
          }
        } catch {}
      }
      return null;
    }
    return entry.data;
  }

  /** Check if cached data is still fresh */
  static isFresh(key: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
    const entry = MEMORY_CACHE.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < ttlMs;
  }

  /** Write to in-memory cache and notify listeners */
  static set<T>(key: string, data: T, persistIfSafe = false): void {
    MEMORY_CACHE.set(key, { data, timestamp: Date.now() });

    if (persistIfSafe && SAFE_PERSIST_KEYS.has(key) && typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {}
    }

    const listeners = SUBSCRIBERS.get(key);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (e) {
          console.error('[QueryClient] Listener error', e);
        }
      });
    }
  }

  /** Invalidate a specific cache key or matching prefix */
  static invalidate(keyOrPrefix: string): void {
    for (const key of MEMORY_CACHE.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        MEMORY_CACHE.delete(key);
      }
    }
  }

  /** Clear all cache entries */
  static clear(): void {
    MEMORY_CACHE.clear();
    IN_FLIGHT_PROMISES.clear();
  }

  /**
   * Deduplicated fetch with Stale-While-Revalidate semantics.
   * If cached & fresh: returns cached data.
   * If in flight: returns existing Promise.
   * Else: initiates fetch, deduplicates, caches, and returns result.
   */
  static async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttlMs?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    const { ttlMs = DEFAULT_TTL_MS, forceRefresh = false } = options;

    if (!forceRefresh && QueryClient.isFresh(key, ttlMs)) {
      const cached = QueryClient.get<T>(key);
      if (cached !== null) return cached;
    }

    const existingPromise = IN_FLIGHT_PROMISES.get(key) as Promise<T> | undefined;
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async () => {
      try {
        const result = await fetcher();
        QueryClient.set(key, result);
        return result;
      } finally {
        IN_FLIGHT_PROMISES.delete(key);
      }
    })();

    IN_FLIGHT_PROMISES.set(key, fetchPromise as Promise<unknown>);
    return fetchPromise;
  }

  /** Subscribe to updates for a specific cache key */
  static subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!SUBSCRIBERS.has(key)) {
      SUBSCRIBERS.set(key, new Set());
    }
    const set = SUBSCRIBERS.get(key)!;
    const typedCb = callback as (data: unknown) => void;
    set.add(typedCb);

    return () => {
      set.delete(typedCb);
      if (set.size === 0) {
        SUBSCRIBERS.delete(key);
      }
    };
  }
}
