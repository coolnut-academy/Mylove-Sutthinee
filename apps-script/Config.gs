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
    return '2567';
  }
};
