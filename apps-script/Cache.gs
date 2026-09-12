/**
 * Server-side Cache Layer
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const ServerCache = {
  get: function(key) {
    try {
      const cache = CacheService.getScriptCache();
      const cached = cache.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  },

  put: function(key, data, ttlSeconds) {
    try {
      const cache = CacheService.getScriptCache();
      cache.put(key, JSON.stringify(data), ttlSeconds || 300); // 5 mins default
    } catch (e) {
      console.warn('Cache put failed:', e);
    }
  },

  remove: function(key) {
    try {
      const cache = CacheService.getScriptCache();
      cache.remove(key);
    } catch (e) {
      console.warn('Cache remove failed:', e);
    }
  }
};
