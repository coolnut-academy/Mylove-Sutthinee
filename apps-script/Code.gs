/**
 * Suttinee Teacher Workspace — Google Apps Script Web App
 * Entry points for Web App HTTP requests (GET & POST)
 * Author: นางสาวศุทธินี ถาวร
 */

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  return Router.handleGet(e);
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  return Router.handlePost(e);
}

/**
 * Initial Setup Helper
 * Run this function once from the Apps Script editor to initialize sheets and default data.
 */
function setupDatabase() {
  const ss = Sheets.getSpreadsheet();

  // Create required tabs
  const requiredTabs = [
    'SETTINGS',
    'YEARS',
    'STUDENTS',
    'ATTENDANCE',
    'DAILY_ROUTINES',
    'HEALTH',
    'SDQ',
    'CLASSROOM_DOCUMENTS',
    'PA_SECTIONS',
    'PA_ITEMS',
    'AUDIT_LOG'
  ];

  requiredTabs.forEach(tabName => {
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
  });

  // Setup SETTINGS tab headers if empty
  const settingsSheet = ss.getSheetByName('SETTINGS');
  if (settingsSheet.getLastRow() === 0) {
    settingsSheet.appendRow(['key', 'value', 'updated_at']);
    settingsSheet.appendRow(['site_title', 'Suttinee Teacher Workspace', new Date().toISOString()]);
    settingsSheet.appendRow(['site_subtitle', 'พัฒนาวิชาชีพและธุรการชั้นเรียน', new Date().toISOString()]);
    settingsSheet.appendRow(['teacher_name', 'นางสาวศุทธินี ถาวร', new Date().toISOString()]);
    settingsSheet.appendRow(['teacher_role', 'ครู วิทยฐานะครูชำนาญการ', new Date().toISOString()]);
    settingsSheet.appendRow(['school_name', 'โรงเรียนบ้านหนองบัวใหญ่', new Date().toISOString()]);
    settingsSheet.appendRow(['default_year', '2569', new Date().toISOString()]);
  }

  // Seed default year
  const yearsSheet = ss.getSheetByName('YEARS');
  if (yearsSheet.getLastRow() === 0) {
    yearsSheet.appendRow(['id', 'year', 'label', 'status', 'root_folder_id', 'pa_period_start', 'pa_period_end', 'is_default', 'created_at', 'updated_at']);
    yearsSheet.appendRow(['year-2569', '2569', 'ปีการศึกษา 2569 (ปัจจุบัน)', 'active', '', '2025-10-01', '2026-09-30', true, new Date().toISOString(), new Date().toISOString()]);
    PA.seedDefaultSections('2569');
  }

  Logger.log('Setup completed successfully!');
}
