/**
 * Configuration & Environment Manager
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const CONFIG = {
  getSpreadsheetId: function() {
    return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';
  },

  getRootDriveFolderId: function() {
    return PropertiesService.getScriptProperties().getProperty('ROOT_DRIVE_FOLDER_ID') || '';
  },

  getAdminPasswordHash: function() {
    return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD_HASH') || '';
  },

  getAdminPasswordSalt: function() {
    return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD_SALT') || 'suttinee_salt_2569';
  },

  getSessionSecret: function() {
    const props = PropertiesService.getScriptProperties();
    const existing = props.getProperty('SESSION_SECRET');
    if (existing) return existing;
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const current = props.getProperty('SESSION_SECRET');
      if (current) return current;
      const secret = Utilities.getUuid() + Utilities.getUuid();
      props.setProperty('SESSION_SECRET', secret);
      return secret;
    } finally {
      lock.releaseLock();
    }
  },

  getDefaultYear: function() {
    try {
      const years = Sheets.getTable('YEARS');
      if (years && years.length > 0) {
        const def = years.find(y => y.is_default === true || String(y.is_default).toLowerCase() === 'true');
        if (def && def.year) return String(def.year);
        const sorted = years
          .map(y => Number(y.year))
          .filter(n => !isNaN(n) && n > 2500)
          .sort((a, b) => b - a);
        if (sorted.length > 0) return String(sorted[0]);
      }
    } catch (e) {}
    return '2569';
  }
};
