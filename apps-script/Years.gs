/**
 * Academic Years Business Logic
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Years = {
  getAll: function() {
    return Sheets.getTable('YEARS');
  },

  createYear: function(payload) {
    const year = String(payload.year);
    if (!/^25\d{2}$/.test(year)) throw new Error('กรุณาระบุปี พ.ศ. 4 หลัก');

    const existing = this.getAll();
    if (existing.some(y => String(y.year) === year)) {
      throw new Error('ปีการศึกษา ' + year + ' มีอยู่ในระบบแล้ว');
    }

    if (payload.is_default) {
      existing.forEach(y => {
        if (y.is_default) {
          Sheets.updateRow('YEARS', 'id', y.id, { is_default: false });
        }
      });
    }

    // Create year folders in Drive
    let rootFolderId = '';
    try {
      const folder = Drive.getYearFolder(year);
      rootFolderId = folder.getId();
    } catch (e) {
      throw new Error('สร้างโฟลเดอร์ปีการศึกษาไม่สำเร็จ: ' + e.message);
    }

    const newYear = {
      id: Utils.generateId('year'),
      year: year,
      label: payload.label || ('ปีการศึกษา ' + year),
      status: 'active',
      root_folder_id: rootFolderId,
      pa_period_start: payload.pa_period_start || '',
      pa_period_end: payload.pa_period_end || '',
      is_default: Boolean(payload.is_default),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    Sheets.appendRow('YEARS', newYear);

    // Initialize standard PA sections for the year
    PA.seedDefaultSections(year);

    return newYear;
  }
};
