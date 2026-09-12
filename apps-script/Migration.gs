/** Run once after updating the Apps Script sources. Safe to run again. */
function migrateFeatureStorage() {
  // Check the configured destination before changing any spreadsheet structure.
  Drive.getRootFolder();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const common = ['id', 'year', 'title', 'description', 'type', 'cover_url',
      'cover_ratio', 'item_url', 'button_text', 'drive_file_id', 'file_name',
      'file_size', 'fields', 'sort_order', 'published', 'archived', 'created_at', 'updated_at'];
    Sheets.ensureHeaders('CLASSROOM_DOCUMENTS', common.concat(['category']));
    Sheets.ensureHeaders('PA_ITEMS', common.concat(['section_code']));
    Sheets.ensureHeaders('STUDENTS', ['id', 'year', 'student_no', 'first_name',
      'last_name', 'student_id', 'prefix', 'class', 'nickname', 'gender', 'status', 'created_at', 'updated_at']);
    const categories = ['students', 'attendance', 'teeth', 'milk', 'growth', 'health',
      'sdq', 'pp', 'media', 'plc', 'research', 'plan', 'awards', 'sar', 'other'];
    Sheets.getTable('YEARS').forEach(function(row) {
      categories.forEach(category => Drive.getYearFolder(row.year, 'CLASSROOM/' + category));
      PA.getSections(row.year).forEach(section =>
        Drive.getYearFolder(row.year, Drive.getFeaturePath({ module: 'pa', section_code: section.section_code })));
    });
    SpreadsheetApp.flush();
    Logger.log('Feature storage ready. Existing rows and files preserved.');
  } finally {
    lock.releaseLock();
  }
}
