/**
 * Google Sheets Database Layer
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Sheets = {
  getSpreadsheet: function() {
    const id = CONFIG.getSpreadsheetId();
    if (!id) {
      throw new Error('SPREADSHEET_ID is not configured in Script Properties');
    }
    return SpreadsheetApp.openById(id);
  },

  getSheet: function(sheetName) {
    const ss = this.getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    return sheet;
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
        rowObj[headers[c]] = val;
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
    let headers = data.length > 0 ? data[0].map(h => String(h).trim()) : [];

    // If empty sheet, create headers from object keys
    if (headers.length === 0 || data.length <= 1 && data[0][0] === '') {
      headers = Object.keys(obj);
      sheet.appendRow(headers);
    }

    const row = headers.map(h => {
      const val = obj[h] !== undefined ? obj[h] : '';
      return Utils.sanitizeForSheet(val);
    });
    sheet.appendRow(row);
    return obj;
  },

  updateRow: function(sheetName, idKey, idValue, updates) {
    const sheet = this.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return false;

    const headers = data[0].map(h => String(h).trim());
    const idColIndex = headers.indexOf(idKey);
    if (idColIndex === -1) return false;

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idColIndex]) === String(idValue)) {
        // 💡 Batch update แถวในครั้งเดียว แทนการเรียก setValue ทีละเซลล์
        const rowValues = [...data[r]];
        Object.entries(updates).forEach(([k, v]) => {
          const colIndex = headers.indexOf(k);
          if (colIndex !== -1) {
            rowValues[colIndex] = Utils.sanitizeForSheet(v);
          }
        });
        sheet.getRange(r + 1, 1, 1, headers.length).setValues([rowValues]);
        SpreadsheetApp.flush();
        return true;
      }
    }
    return false;
  }
};
