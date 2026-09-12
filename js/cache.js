/**
 * Cache Management & Stale-While-Revalidate (SWR) Engine
 * Suttinee Teacher Workspace
 */

import { CONFIG } from './config.js';

export const Cache = {
  _revision: 0,
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
    this._revision++;
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
   * หากมีข้อมูลแคชอยู่แล้ว:
   *   - แข่งขันเน็ตเวิร์กด้วยเพดาน 1.5 วินาที
   *   - หาก Cloud เร็วกว่า 1.5 วิ จะได้ข้อมูลสดใหม่ล่าสุดเสมอ
   *   - หาก Cloud ช้ากว่า 1.5 วิ (เช่น โหลดครั้งแรกหลังตื่น) จะนำข้อมูลแคชมาแสดงผลทันที
   *     ทำให้หน้าเว็บเปิดเร็ว ไม่ค้าง และอัปเดตแคชในพื้นหลังอย่างต่อเนื่อง
   */
  async swr(key, fetcher, onFreshData) {
    const revision = this._revision;
    const cached = this.get(key);
    if (cached && onFreshData) {
      onFreshData(cached, true /* isFromCache */);
    }

    if (cached) {
      let isSettled = false;
      const networkPromise = (async () => {
        try {
          const fresh = await fetcher();
          if (revision === this._revision) this.set(key, fresh);
          if (onFreshData && isSettled && revision === this._revision) {
            onFreshData(fresh, false /* isFromCache */);
          }
          return fresh;
        } catch (err) {
          console.warn('Background revalidation failed, continuing with stale cache:', err);
          return cached;
        }
      })();

      const timeoutPromise = new Promise(resolve => setTimeout(() => {
        isSettled = true;
        resolve(cached);
      }, 1500));

      return Promise.race([networkPromise, timeoutPromise]);
    }

    try {
      const fresh = await fetcher();
      if (revision === this._revision) this.set(key, fresh);
      if (onFreshData && revision === this._revision) {
        onFreshData(fresh, false /* isFromCache */);
      }
      return fresh;
    } catch (err) {
      throw err;
    }
  }
};
