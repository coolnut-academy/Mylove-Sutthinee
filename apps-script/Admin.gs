/**
 * Admin Settings & General Item Query
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Admin = {
  getSettings: function() {
    const rows = Sheets.getTable('SETTINGS');
    const settings = {};
    rows.forEach(r => {
      if (r.key) {
        settings[r.key] = r.value;
      }
    });
    return settings;
  },

  saveSettings: function(updates) {
    const sheet = Sheets.getSheet('SETTINGS');
    const rows = Sheets.getTable('SETTINGS');
    const existingKeys = {};
    rows.forEach((r, idx) => {
      if (r.key) existingKeys[r.key] = idx + 2; // +2 for 1-based and header row
    });

    Object.entries(updates).forEach(([key, val]) => {
      if (existingKeys[key]) {
        sheet.getRange(existingKeys[key], 2).setValue(val);
        sheet.getRange(existingKeys[key], 3).setValue(new Date().toISOString());
      } else {
        sheet.appendRow([key, val, new Date().toISOString()]);
      }
    });

    return this.getSettings();
  },

  getItem: function(id) {
    const clsDocs = Sheets.getTable('CLASSROOM_DOCUMENTS');
    const doc = clsDocs.find(d => String(d.id) === String(id));
    if (doc) return doc;

    const paItems = Sheets.getTable('PA_ITEMS');
    const item = paItems.find(i => String(i.id) === String(id));
    if (item) return item;

    return null;
  },

  deleteItem: function(id) {
    if (!id) return { success: false, error: 'Item ID is required' };
    let deleted = Sheets.deleteRow('PA_ITEMS', 'id', id);
    if (!deleted) {
      deleted = Sheets.deleteRow('CLASSROOM_DOCUMENTS', 'id', id);
    }
    return { success: deleted, id: id };
  }
};
