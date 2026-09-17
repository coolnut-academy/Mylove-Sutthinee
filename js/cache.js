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
   * Get cached data if valid (or allow stale for instant rendering)
   */
  get(key, allowStale = false) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.data === undefined) return null;
      const isExpired = parsed.expiresAt && Date.now() > parsed.expiresAt;
      if (isExpired && !allowStale) {
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
  set(key, data, ttlMs = CONFIG.CACHE_TTL_MS || 30 * 60 * 1000) { // 💡 30 minutes (ลดจำนวน network calls)
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
   * หากมีข้อมูลแคชอยู่แล้ว (แม้หมดอายุ):
   *   - นำข้อมูลแคชมาแสดงผลทันทีแบบ 0 วินาที
   *   - แข่งขันเน็ตเวิร์กด้วยเพดาน 400ms
   *   - ดึงข้อมูลสดใหม่ล่าสุดในพื้นหลังและอัปเดตหน้าจอโดยไม่ขัดจังหวะผู้ใช้
   */
  async swr(key, fetcher, onFreshData) {
    const revision = this._revision;
    // 💡 ยินยอมให้ใช้ Stale Cache เพื่อให้หน้าเว็บเรนเดอร์ได้ทันทีใน 0 วินาที
    const cached = this.get(key, true);
    if (cached && onFreshData) {
      try { onFreshData(cached, true /* isFromCache */); } catch (e) { console.warn(e); }
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

      // 💡 เพดานรอเน็ตเวิร์ก 400ms
      const timeoutPromise = new Promise(resolve => setTimeout(() => {
        isSettled = true;
        resolve(cached);
      }, 400));

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
