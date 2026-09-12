/**
 * Cache Management & Stale-While-Revalidate (SWR) Engine
 * Suttinee Teacher Workspace
 */

import { CONFIG } from './config.js';

export const Cache = {
  /**
   * Build unified cache key
   */
  buildKey(module, year = '') {
    return `stw:${CONFIG.CACHE_VERSION}:${year ? year + ':' : ''}${module}`;
  },

  /**
   * Get cached data if valid
   */
  get(key) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        window.localStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  },

  /**
   * Store data in cache
   */
  set(key, data, ttlMs = CONFIG.CACHE_TTL_MS) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const record = {
        data,
        cachedAt: Date.now(),
        expiresAt: ttlMs ? Date.now() + ttlMs : null
      };
      window.localStorage.setItem(key, JSON.stringify(record));
    } catch (e) {
      console.warn('LocalStorage cache write failed (storage quota?):', e);
    }
  },

  /**
   * Invalidate specific keys or namespace
   */
  invalidate(pattern = '') {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const keys = Object.keys(window.localStorage);
      keys.forEach(k => {
        if (k.startsWith('stw:') && (!pattern || k.includes(pattern))) {
          window.localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.warn('Cache invalidate error:', e);
    }
  },

  /**
   * Stale-While-Revalidate pattern:
   * Returns cached data immediately if available, then executes fresh fetcher.
   * Calls onFreshData callback if fresh data differs or is first loaded.
   */
  async swr(key, fetcher, onFreshData) {
    const cached = this.get(key);
    if (cached && onFreshData) {
      onFreshData(cached, true /* isFromCache */);
    }

    try {
      const fresh = await fetcher();
      this.set(key, fresh);
      if (onFreshData) {
        onFreshData(fresh, false /* isFromCache */);
      }
      return fresh;
    } catch (err) {
      if (!cached) {
        throw err;
      }
      console.warn('SWR background revalidation failed, continuing with stale cache:', err);
      return cached;
    }
  }
};
