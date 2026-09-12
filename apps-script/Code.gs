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
    settingsSheet.appendRow(['teacher_role', 'ครู วิทยฐานะ ชำนาญการพิเศษ', new Date().toISOString()]);
    settingsSheet.appendRow(['school_name', 'โรงเรียนชุมชนแม่ลาศึกษา', new Date().toISOString()]);
    settingsSheet.appendRow(['default_year', '2567', new Date().toISOString()]);
  }

  // Seed default year
  const yearsSheet = ss.getSheetByName('YEARS');
  if (yearsSheet.getLastRow() === 0) {
    yearsSheet.appendRow(['id', 'year', 'label', 'status', 'root_folder_id', 'pa_period_start', 'pa_period_end', 'is_default', 'created_at', 'updated_at']);
    yearsSheet.appendRow(['year-2567', '2567', 'ปีการศึกษา 2567 (ปีประเมิน ว.PA)', 'active', '', '2023-10-01', '2024-09-30', true, new Date().toISOString(), new Date().toISOString()]);
    PA.seedDefaultSections('2567');
  }

  // Setup AUDIT_LOG tab headers if empty
  const auditSheet = ss.getSheetByName('AUDIT_LOG');
  if (auditSheet && auditSheet.getLastRow() === 0) {
    auditSheet.appendRow(['id', 'timestamp', 'event_type', 'message', 'details']);
    auditSheet.setFrozenRows(1);
  }

  Logger.log('Setup completed successfully!');
}

/**
 * บันทึกประวัติและข้อผิดพลาดลงแท็บ AUDIT_LOG ใน Google Sheets
 * @param {string} eventType - ประเภทเหตุการณ์ เช่น 'POST_ERROR', 'UPLOAD_FAIL'
 * @param {string} message - ข้อความอธิบาย
 * @param {*} details - ข้อมูลเพิ่มเติม (Object หรือ String)
 */
function recordAuditLog(eventType, message, details) {
  try {
    var ss = Sheets.getSpreadsheet();
    var sheet = ss.getSheetByName('AUDIT_LOG');
    if (!sheet) {
      sheet = ss.insertSheet('AUDIT_LOG');
      sheet.appendRow(['id', 'timestamp', 'event_type', 'message', 'details']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      Utils.generateId('log'),
      new Date().toISOString(),
      eventType,
      message,
      typeof details === 'object' ? JSON.stringify(details) : String(details || '')
    ]);
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}
