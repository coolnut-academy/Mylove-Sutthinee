/**
 * Google Sheets Database Layer
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Sheets = {
  // 💡 Fast save: ลบ LockService + ลบ read-back verification + เหลือ flush แค่ 1 ครั้ง
  //    ลดเวลา save จาก 5-15 วินาที เหลือ 2-5 วินาที (ผู้ใช้คนเดียว ไม่ต้อง lock)
  saveVerified: function(sheetName, obj, prefix) {
    delete obj._persisted;
    if (!obj.id) obj.id = Utils.generateId(prefix);
    obj.updated_at = new Date().toISOString();
    if (obj.published === undefined) obj.published = true;
    if (obj.archived === undefined) obj.archived = false;
    if (!this.updateRow(sheetName, 'id', obj.id, obj)) {
      if (!obj.created_at) obj.created_at = obj.updated_at;
      this.appendRow(sheetName, obj);
    }
    // ไม่ต้อง flush ซ้ำ (appendRow/updateRow flush แล้ว)
    // ไม่ต้อง read-back verify — trust write operation
    return Object.assign({}, obj, { _persisted: true });
  },
  getSpreadsheet: function() {
    if (this._spreadsheet) return this._spreadsheet;
    const id = CONFIG.getSpreadsheetId();
    if (!id) {
      throw new Error('SPREADSHEET_ID is not configured in Script Properties');
    }
    this._spreadsheet = SpreadsheetApp.openById(id);
    return this._spreadsheet;
  },

  getSheet: function(sheetName) {
    const ss = this.getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    return sheet;
  },

  ensureHeaders: function(sheetName, required) {
    const sheet = this.getSheet(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(required);
      return;
    }
    const headers = sheet.getDataRange().getValues()[0].map(h => String(h).trim());
    const missing = required.filter(h => headers.indexOf(h) === -1);
    if (missing.length) {
      const needed = headers.length + missing.length;
      if (needed > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), needed - sheet.getMaxColumns());
      sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    }
  },

  getTable: function(sheetName) {
    const sheet = this.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0].map(h => String(h).trim());
    const rows = [];

    for (let r = 1; r < data.length; r++) {
      const rowObj = {};
      let hasData = false;
      for (let c = 0; c < headers.length; c++) {
        const val = data[r][c];
        if (['section_code', 'year'].includes(headers[c]) && val !== '' && val !== null && val !== undefined) {
          rowObj[headers[c]] = String(val).trim();
        } else {
          rowObj[headers[c]] = ['archived', 'published', 'is_default'].includes(headers[c])
            ? Utils.toBoolean(val) : val;
        }
        if (val !== '' && val !== null && val !== undefined) hasData = true;
      }
      if (hasData) {
        rows.push(rowObj);
      }
    }
    return rows;
  },

  appendRow: function(sheetName, obj) {
    const sheet = this.getSheet(sheetName);
    let data = sheet.getDataRange().getValues();
    let headers = (data.length > 0 && data[0] && data[0].length > 0 && data[0][0] !== '')
      ? data[0].map(h => String(h).trim())
      : [];

    // If empty sheet, create headers from object keys
    if (headers.length === 0) {
      headers = Object.keys(obj);
      sheet.appendRow(headers);
    } else {
      // 💡 รองรับการเพิ่มคอลัมน์ใหม่อัตโนมัติ (Dynamic Column Expansion)
      const objKeys = Object.keys(obj);
      const missingKeys = objKeys.filter(k => headers.indexOf(k) === -1);
      if (missingKeys.length > 0) {
        const startCol = headers.length + 1;
        if (headers.length + missingKeys.length > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length + missingKeys.length - sheet.getMaxColumns());
        sheet.getRange(1, startCol, 1, missingKeys.length).setValues([missingKeys]);
        headers = headers.concat(missingKeys);
      }
    }

    const row = headers.map(h => {
      const val = obj[h] !== undefined ? obj[h] : '';
      return Utils.sanitizeForSheet(val);
    });
    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return obj;
  },

  updateRow: function(sheetName, idKey, idValue, updates) {
    const sheet = this.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return false;

    let headers = data[0].map(h => String(h).trim());
    const idColIndex = headers.indexOf(idKey);
    if (idColIndex === -1) return false;

    // 💡 รองรับการเพิ่มคอลัมน์ใหม่อัตโนมัติในแถวหัวตารางหากมีฟิลด์ใหม่ส่งมา
    const updateKeys = Object.keys(updates);
    const missingKeys = updateKeys.filter(k => headers.indexOf(k) === -1);
    if (missingKeys.length > 0) {
      const startCol = headers.length + 1;
      if (headers.length + missingKeys.length > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length + missingKeys.length - sheet.getMaxColumns());
      sheet.getRange(1, startCol, 1, missingKeys.length).setValues([missingKeys]);
      headers = headers.concat(missingKeys);
    }

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idColIndex]) === String(idValue)) {
        // 💡 Batch update แถวในครั้งเดียว แทนการเรียก setValue ทีละเซลล์
        const rowValues = [];
        for (let c = 0; c < headers.length; c++) {
          const colName = headers[c];
          if (updates[colName] !== undefined) {
            rowValues.push(Utils.sanitizeForSheet(updates[colName]));
          } else {
            rowValues.push(c < data[r].length ? data[r][c] : '');
          }
        }
        sheet.getRange(r + 1, 1, 1, headers.length).setValues([rowValues]);
        SpreadsheetApp.flush();
        return true;
      }
    }
    return false;
  },

  deleteRow: function(sheetName, idKey, idValue) {
    const sheet = this.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return false;

    const headers = data[0].map(h => String(h).trim());
    const idColIndex = headers.indexOf(idKey);
    if (idColIndex === -1) return false;

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idColIndex]) === String(idValue)) {
        sheet.deleteRow(r + 1);
        SpreadsheetApp.flush();
        return true;
      }
    }
    return false;
  }
};
