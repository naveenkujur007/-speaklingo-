// Simple in-memory LRU cache for API routes.
// Caches expensive LLM-generated responses for a TTL period.
// Per-process (Vercel serverless instances have their own), but combined
// with Cache-Control headers, gives massive speedup for repeat visits.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours default
const MAX_ENTRIES = 200;

const cache = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  // Refresh LRU position
  cache.delete(key);
  cache.set(key, entry);
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number = CACHE_TTL_MS): void {
  if (cache.size >= MAX_ENTRIES) {
    // Evict oldest entry
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  cache.delete(key);
}

export function cacheClear(): void {
  cache.clear();
}

// Build a cache key from arguments.
export function cacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts.map((p) => String(p ?? "")).join("::");
}

// Wrap an async function with caching.
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = CACHE_TTL_MS
): Promise<{ value: T; cached: boolean }> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return { value: cached, cached: true };
  const value = await fn();
  cacheSet(key, value, ttlMs);
  return { value, cached: false };
}
