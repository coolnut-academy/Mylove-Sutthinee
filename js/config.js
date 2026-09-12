/**
 * Suttinee Teacher Workspace
 * Global Configuration
 */

export const CONFIG = {
  // Data mode: "mock" (offline standalone development) or "live" (Google Apps Script)
  DATA_MODE: "live",

  // Google Apps Script Web App execution URL (filled when deployed)
  API_URL: "https://script.google.com/macros/s/AKfycbx_7t9vWyhwr7wwpUa39568vJMHU7Oq9wV89KYEDbnAeVzbqkJ3ghKdJLl14aw5WvtC/exec",

  // Identity & branding defaults
  APP_NAME: "Suttinee Teacher Workspace",
  APP_SUBTITLE: "แฟ้มสะสมผลงานวิชาชีพและธุรการชั้นเรียน",
  TEACHER_NAME: "นางสาวศุทธินี ถาวร (ครูนิว)",
  TEACHER_ROLE: "ครู วิทยฐานะ ชำนาญการพิเศษ",
  SCHOOL_NAME: "โรงเรียนชุมชนแม่ลาศึกษา อำเภอแม่ลาน้อย จังหวัดแม่ฮ่องสอน",
  SCHOOL_AFFILIATION: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาแม่ฮ่องสอน เขต 2",
  CONTACT_PHONE: "064-618-0472 / 053-6850149",

  // Academic year settings
  DEFAULT_YEAR: "2567",
  FALLBACK_YEAR: "2566",

  // Cache configuration
  CACHE_VERSION: "v3",
  CACHE_TTL_MS: 15 * 60 * 1000, // 15 minutes

  // File upload thresholds
  MAX_UPLOAD_SIZE_MB: 10,
  WARN_LARGE_FILE_MB: 5,

  // Demo fallback image assets
  FALLBACK_IMAGES: {
    avatar: "./assets/showcase/avatar-krunew.svg",
    schoolLogo: "./assets/school_logo.png",
    homeBg: "./assets/fallback/home-bg.svg",
    classroomCover: "./assets/fallback/classroom-cover.svg",
    paCover: "./assets/fallback/pa-cover.svg"
  }
};
