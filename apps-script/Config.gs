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
    return PropertiesService.getScriptProperties().getProperty('SESSION_SECRET') || 'suttinee_jwt_secret_key';
  },

  getDefaultYear: function() {
    return '2567';
  }
};
