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

  saveSettings: function(updates, year) {
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) throw new Error('ข้อมูลตั้งค่าไม่ถูกต้อง');
    const values = Object.assign({}, updates);
    const images = [];
    // Validate the complete request before uploading or changing any setting.
    Object.keys(values).forEach(function(key) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key) || ['constructor', 'prototype'].includes(key)) throw new Error('ชื่อการตั้งค่าไม่ถูกต้อง');
      const val = values[key];
      if (typeof val === 'string' && val.indexOf('data:image/') === 0) {
        const match = val.match(/^data:image\/(png|jpeg|webp|gif|avif);base64,([A-Za-z0-9+/=\r\n]+)$/);
        if (!match) throw new Error('รูปภาพไม่ถูกต้อง กรุณาเลือกรูปใหม่');
        images.push({ key: key, extension: match[1] === 'jpeg' ? 'jpg' : match[1], mime: 'image/' + match[1], base64: match[2] });
      } else if (val !== null && !['string', 'number', 'boolean', 'undefined'].includes(typeof val)) {
        throw new Error('ค่าตั้งค่าต้องเป็นข้อความหรือตัวเลข');
      } else if (String(Utils.sanitizeForSheet(val == null ? '' : val)).length > 50000) {
        throw new Error('ข้อความใน ' + key + ' ยาวเกิน 50,000 ตัวอักษร');
      }
    });
    const uploaded = [];
    let writeAttempted = false;
    try {
      images.forEach(function(img) {
        const saved = Drive.saveFile({
          name: img.key + '_' + Date.now() + '.' + img.extension,
          mimeType: img.mime, base64Data: img.base64,
          year: year || CONFIG.getDefaultYear(), subfolder: 'SETTINGS/' + img.key
        });
        uploaded.push(saved.fileId);
        if (!saved.thumbnailUrl) throw new Error('Google Drive ไม่ส่งลิงก์รูปภาพกลับมา');
        values[img.key] = saved.thumbnailUrl;
      });
      const lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try {
        Sheets.ensureHeaders('SETTINGS', ['key', 'value', 'updated_at']);
        const sheet = Sheets.getSheet('SETTINGS');
        const range = sheet.getDataRange();
        const rows = range.getValues();
        const formulas = range.getFormulas();
        // Retain unrelated formulas, columns and blank rows when doing one batch write.
        const data = rows.map((row, r) => row.map((val, c) => formulas[r][c] || val));
        const headers = rows[0].map(h => String(h).trim());
        const keyCol = headers.indexOf('key'), valueCol = headers.indexOf('value'), timeCol = headers.indexOf('updated_at');
        const now = new Date().toISOString();
        Object.keys(values).forEach(function(key) {
          let found = false;
          for (let r = 1; r < rows.length; r++) {
            if (String(rows[r][keyCol]) === key) {
              data[r][valueCol] = Utils.sanitizeForSheet(values[key] == null ? '' : values[key]);
              data[r][timeCol] = now;
              found = true;
            }
          }
          if (!found) {
            const row = Array(headers.length).fill('');
            row[keyCol] = key;
            row[valueCol] = Utils.sanitizeForSheet(values[key] == null ? '' : values[key]);
            row[timeCol] = now;
            data.push(row);
          }
        });
        if (data.length > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), data.length - sheet.getMaxRows());
        writeAttempted = true;
        sheet.getRange(1, 1, data.length, headers.length).setValues(data);
        SpreadsheetApp.flush();
        const stored = this.getSettings();
        Object.keys(values).forEach(function(key) {
          if (String(stored[key]) !== String(values[key] == null ? '' : values[key]) &&
              String(stored[key]) !== String(Utils.sanitizeForSheet(values[key] == null ? '' : values[key]))) {
            throw new Error('ไม่สามารถยืนยันการตั้งค่าที่บันทึก: ' + key);
          }
        });
        return stored;
      } finally { lock.releaseLock(); }
    } catch (error) {
      // Never delete a file after a write attempt: it may already be referenced in Sheets.
      if (!writeAttempted) uploaded.forEach(function(id) { try { Drive.deleteFile(id); } catch (cleanupError) { console.warn('Settings upload cleanup failed'); } });
      throw error;
    }
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
