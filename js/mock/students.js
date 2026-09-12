/**
 * Mock Students, Attendance, Routines, Health & SDQ Dataset
 * Suttinee Teacher Workspace
 */

export const INITIAL_STUDENTS = [
  // Year 2567 Students (Classroom 1/1 โรงเรียนชุมชนแม่ลาศึกษา)
  { id: "std-2567-01", year: "2567", student_no: 1, student_id: "0801", prefix: "เด็กชาย", first_name: "พงศกร", last_name: "บุญเรือง", class: "ชั้นประถมศึกษาปีที่ 1", status: "active", note: "หัวหน้าห้อง", created_at: "2023-10-01" },
  { id: "std-2567-02", year: "2567", student_no: 2, student_id: "0802", prefix: "เด็กชาย", first_name: "ธนภัทร", last_name: "ดวงแก้ว", class: "ชั้นประถมศึกษาปีที่ 1", status: "active", note: "", created_at: "2023-10-01" },
  { id: "std-2567-03", year: "2567", student_no: 3, student_id: "0803", prefix: "เด็กชาย", first_name: "กิตติศักดิ์", last_name: "ใจดี", class: "ชั้นประถมศึกษาปีที่ 1", status: "active", note: "", created_at: "2023-10-01" },
  { id: "std-2567-04", year: "2567", student_no: 4, student_id: "0804", prefix: "เด็กหญิง", first_name: "กัญญาณัฐ", last_name: "สุขเกษม", class: "ชั้นประถมศึกษาปีที่ 1", status: "active", note: "", created_at: "2023-10-01" },
  { id: "std-2567-05", year: "2567", student_no: 5, student_id: "0805", prefix: "เด็กหญิง", first_name: "ชลธิชา", last_name: "พงษ์พานิช", class: "ชั้นประถมศึกษาปีที่ 1", status: "active", note: "", created_at: "2023-10-01" },
  { id: "std-2567-06", year: "2567", student_no: 6, student_id: "0806", prefix: "เด็กหญิง", first_name: "ปิยธิดา", last_name: "วงศ์สว่าง", class: "ชั้นประถมศึกษาปีที่ 1", status: "active", note: "", created_at: "2023-10-01" },

  // Year 2569 Students
  { id: "std-2569-01", year: "2569", student_no: 1, student_id: "1001", prefix: "เด็กชาย", first_name: "กิตติภพ", last_name: "เจริญสุข", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "หัวหน้าห้อง", created_at: "2025-10-01" },
  { id: "std-2569-02", year: "2569", student_no: 2, student_id: "1002", prefix: "เด็กชาย", first_name: "จิรภัทร", last_name: "วงศ์สว่าง", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "", created_at: "2025-10-01" },
  { id: "std-2569-03", year: "2569", student_no: 3, student_id: "1003", prefix: "เด็กชาย", first_name: "ณัฐดนัย", last_name: "บุญส่ง", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "", created_at: "2025-10-01" },
  { id: "std-2569-04", year: "2569", student_no: 4, student_id: "1004", prefix: "เด็กชาย", first_name: "ธนกฤต", last_name: "สุขเกษม", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "", created_at: "2025-10-01" },
  { id: "std-2569-05", year: "2569", student_no: 5, student_id: "1005", prefix: "เด็กชาย", first_name: "ปัณณวิชญ์", last_name: "ศิริพงษ์", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "", created_at: "2025-10-01" },
  { id: "std-2569-06", year: "2569", student_no: 6, student_id: "1006", prefix: "เด็กหญิง", first_name: "กัญญารัตน์", last_name: "มีสุข", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "", created_at: "2025-10-01" },
  { id: "std-2569-07", year: "2569", student_no: 7, student_id: "1007", prefix: "เด็กหญิง", first_name: "ชญาดา", last_name: "ทองประเสริฐ", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "", created_at: "2025-10-01" },
  { id: "std-2569-08", year: "2569", student_no: 8, student_id: "1008", prefix: "เด็กหญิง", first_name: "ณิชากร", last_name: "พงษ์พานิช", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "", created_at: "2025-10-01" },
  { id: "std-2569-09", year: "2569", student_no: 9, student_id: "1009", prefix: "เด็กหญิง", first_name: "ธัญชนก", last_name: "แก้วมณี", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "", created_at: "2025-10-01" },
  { id: "std-2569-10", year: "2569", student_no: 10, student_id: "1010", prefix: "เด็กหญิง", first_name: "พิชญา", last_name: "รัตนกุล", class: "ชั้นประถมศึกษาปีที่ 1/1", status: "active", note: "", created_at: "2025-10-01" }
];

export const INITIAL_ATTENDANCE = [
  { id: "att-01", year: "2569", date: "2026-03-12", student_id: "1001", status: "present", note: "", updated_at: "2026-03-12" },
  { id: "att-02", year: "2569", date: "2026-03-12", student_id: "1002", status: "present", note: "", updated_at: "2026-03-12" },
  { id: "att-03", year: "2569", date: "2026-03-12", student_id: "1003", status: "leave", note: "ลาป่วย", updated_at: "2026-03-12" },
  { id: "att-04", year: "2569", date: "2026-03-12", student_id: "1004", status: "present", note: "", updated_at: "2026-03-12" },
  { id: "att-05", year: "2569", date: "2026-03-12", student_id: "1005", status: "present", note: "", updated_at: "2026-03-12" },
  { id: "att-06", year: "2569", date: "2026-03-12", student_id: "1006", status: "present", note: "", updated_at: "2026-03-12" },
  { id: "att-07", year: "2569", date: "2026-03-12", student_id: "1007", status: "present", note: "", updated_at: "2026-03-12" },
  { id: "att-08", year: "2569", date: "2026-03-12", student_id: "1008", status: "present", note: "", updated_at: "2026-03-12" },
  { id: "att-09", year: "2569", date: "2026-03-12", student_id: "1009", status: "present", note: "", updated_at: "2026-03-12" },
  { id: "att-10", year: "2569", date: "2026-03-12", student_id: "1010", status: "present", note: "", updated_at: "2026-03-12" }
];

export const INITIAL_ROUTINES = [
  { id: "rtn-01", year: "2569", date: "2026-03-12", type: "milk", student_id: "1001", status: "done" },
  { id: "rtn-02", year: "2569", date: "2026-03-12", type: "toothbrush", student_id: "1001", status: "done" },
  { id: "rtn-03", year: "2569", date: "2026-03-12", type: "milk", student_id: "1002", status: "done" },
  { id: "rtn-04", year: "2569", date: "2026-03-12", type: "toothbrush", student_id: "1002", status: "done" }
];

export const INITIAL_HEALTH = [
  { id: "hlth-01", year: "2569", student_id: "1001", weight: 21.5, height: 118, bmi: 15.4, health_result: "สมส่วน", date: "2026-01-15" },
  { id: "hlth-02", year: "2569", student_id: "1002", weight: 24.0, height: 120, bmi: 16.7, health_result: "ท้วม", date: "2026-01-15" },
  { id: "hlth-03", year: "2569", student_id: "1003", weight: 19.8, height: 116, bmi: 14.7, health_result: "สมส่วน", date: "2026-01-15" },
  { id: "hlth-04", year: "2569", student_id: "1004", weight: 22.0, height: 119, bmi: 15.5, health_result: "สมส่วน", date: "2026-01-15" },
  { id: "hlth-05", year: "2569", student_id: "1005", weight: 20.2, height: 117, bmi: 14.8, health_result: "สมส่วน", date: "2026-01-15" }
];

export const INITIAL_SDQ = [
  { id: "sdq-01", year: "2569", student_id: "1001", score: 8, result: "ปกติ", date: "2025-11-20" },
  { id: "sdq-02", year: "2569", student_id: "1002", score: 11, result: "ปกติ", date: "2025-11-20" },
  { id: "sdq-03", year: "2569", student_id: "1003", score: 16, result: "เสี่ยง (ด้านสมาธิสั้น)", date: "2025-11-20" },
  { id: "sdq-04", year: "2569", student_id: "1004", score: 7, result: "ปกติ", date: "2025-11-20" },
  { id: "sdq-05", year: "2569", student_id: "1005", score: 9, result: "ปกติ", date: "2025-11-20" }
];
