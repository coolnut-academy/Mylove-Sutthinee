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
      const jsonString = JSON.stringify(data);
      // 💡 ป้องกัน Error "Argument too large: value must be less than 100KB"
      if (jsonString.length > 90000) {
        console.warn('Cache entry too large for key: ' + key + ' (' + jsonString.length + ' bytes). Skipping cache.');
        return false;
      }
      cache.put(key, jsonString, ttlSeconds || 300); // 5 mins default
      return true;
    } catch (e) {
      console.warn('Cache put failed:', e);
      return false;
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
