# DATABASE_SETUP.md
# Suttinee Teacher Workspace — Database Connection Guide

> ใช้ไฟล์นี้ **หลังเว็บสร้างเสร็จและ Mock Mode ผ่านแล้ว**
> ห้ามใส่รหัสผ่านหรือ Secret จริงลง GitHub repository

---

# 1. CONNECTION STATUS

```text
Frontend Build: __________________
GitHub Pages URL: ________________
Database Setup: NOT STARTED / IN PROGRESS / COMPLETE
Verification: NOT RUN / PASS / FAIL
```

---

# 2. VALUES TO FILL LATER

กรอกเฉพาะค่าที่ไม่เป็น Secret ลงเอกสาร local copy หากต้องการ

```text
GITHUB_REPOSITORY =
GITHUB_PAGES_URL =

SPREADSHEET_ID =
ROOT_DRIVE_FOLDER_ID =
APPS_SCRIPT_EXEC_URL =

DEFAULT_YEAR = 2569
PUBLIC_FILE_MODE = public | domain | private
```

Secret ต่อไปนี้ **ห้าม commit ลง GitHub**

```text
ADMIN_PASSWORD_HASH
ADMIN_PASSWORD_SALT
SESSION_SECRET
```

ให้เก็บใน Apps Script Script Properties เท่านั้น

---

# 3. CREATE GOOGLE SHEET

สร้าง Spreadsheet:

```text
SUTTINEE_TEACHER_WORKSPACE_DB
```

สร้าง tabs:

```text
SETTINGS
YEARS
STUDENTS
ATTENDANCE
DAILY_ROUTINES
HEALTH
SDQ
CLASSROOM_DOCUMENTS
PA_SECTIONS
PA_ITEMS
AUDIT_LOG
```

---

# 4. REQUIRED HEADERS

## SETTINGS

```text
key
value
updated_at
```

Initial rows:

```text
site_title | Suttinee Teacher Workspace
site_subtitle | พัฒนาวิชาชีพและธุรการชั้นเรียน
teacher_name | นางสาวศุทธินี ถาวร
default_year | 2569
background_file_id |
classroom_cover_file_id |
pa_cover_file_id |
profile_file_id |
```

---

## YEARS

```text
id
year
label
status
root_folder_id
pa_period_start
pa_period_end
is_default
created_at
updated_at
```

---

## STUDENTS

```text
id
year
student_no
student_id
prefix
first_name
last_name
class
status
note
created_at
updated_at
```

---

## ATTENDANCE

```text
id
year
date
student_id
status
note
updated_at
```

---

## DAILY_ROUTINES

```text
id
year
date
student_id
type
status
note
updated_at
```

`type`:

```text
toothbrush
milk
```

---

## HEALTH

```text
id
year
date
student_id
weight
height
bmi
health_result
note
updated_at
```

---

## SDQ

```text
id
year
student_id
date
score
result
drive_file_id
note
updated_at
```

---

## CLASSROOM_DOCUMENTS

```text
id
year
category
title
description
type
drive_file_id
external_url
sort_order
published
archived
created_at
updated_at
```

---

## PA_SECTIONS

```text
id
year
section_code
parent_code
title
description
sort_order
published
archived
created_at
updated_at
```

---

## PA_ITEMS

```text
id
year
section_code
title
description
type
drive_file_id
external_url
mime_type
file_size
sort_order
published
archived
created_at
updated_at
```

---

## AUDIT_LOG

```text
timestamp
action
year
target
detail
request_id
```

---

# 5. CREATE GOOGLE DRIVE ROOT

สร้าง folder:

```text
SUTTINEE_TEACHER_WORKSPACE
```

ภายใน:

```text
_SYSTEM/
  branding/
    backgrounds/
    covers/
    profile/
  temp/

2569/
  CLASSROOM/
    students/
    attendance/
    routines/
    health/
    sdq/
    pp/
    documents/

  PA/
    profile/
    workload/
    section-1/
      1.1/
      1.2/
      1.3/
      1.4/
      1.5/
      1.6/
      1.7/
      1.8/
    section-2/
      2.1/
      2.2/
      2.3/
      2.4/
    section-3/
      3.1/
      3.2/
      3.3/
    challenge/
```

หลังระบบเชื่อมแล้ว ปีใหม่ควรสร้างโครงนี้อัตโนมัติ

---

# 6. RECORD IDS

อย่าใช้ Row Number เป็น ID

ตัวอย่าง:

```text
YR_2569
STU_7fd4...
ATT_...
DOC_...
SEC_...
PAI_...
```

Apps Script สร้าง ID ด้วย UUID แล้วเติม prefix

---

# 7. APPS SCRIPT PROJECT

สร้าง Standalone Apps Script Project:

```text
Suttinee Teacher Workspace API
```

นำไฟล์จาก `/apps-script/` ไปใส่

ต้องมี:

```text
Code.gs
Config.gs
Auth.gs
Router.gs
Sheets.gs
Drive.gs
Upload.gs
Cache.gs
Years.gs
Classroom.gs
PA.gs
Admin.gs
Utils.gs
appsscript.json
```

---

# 8. SCRIPT PROPERTIES

Apps Script:

```text
Project Settings
→ Script Properties
```

เพิ่ม:

```text
SPREADSHEET_ID = <จริง>
ROOT_DRIVE_FOLDER_ID = <จริง>

ADMIN_PASSWORD_HASH = <จริง>
ADMIN_PASSWORD_SALT = <random>
SESSION_SECRET = <random>

PUBLIC_FILE_MODE = public
DEFAULT_YEAR = 2569
```

Optional:

```text
ALLOWED_FRONTEND_ORIGIN = https://USERNAME.github.io
APP_VERSION = 1
```

---

# 9. ADMIN PASSWORD HASH

ห้ามเก็บ plaintext password ใน repository

ใช้ helper function ใน Apps Script สำหรับสร้าง hash ครั้งแรก
แล้ว copy เฉพาะ hash ไป Script Properties

ตัวอย่าง workflow:

```text
1. เลือกรหัสผ่านจริง
2. สร้าง random salt
3. run generateAdminHash(password, salt) จาก Apps Script Editor
4. copy hash
5. บันทึก HASH + SALT ใน Script Properties
6. ลบ password จาก log/history หากมี
```

ห้ามเขียน password จริงไว้ใน source

---

# 10. INITIALIZE DATABASE

ควรมี Apps Script function:

```javascript
setupDatabase()
```

หน้าที่:

- ตรวจ Spreadsheet
- ตรวจ tab
- สร้าง header ถ้าขาด
- ห้ามลบข้อมูลเดิม
- ห้าม overwrite tab ที่มีข้อมูล
- insert initial SETTINGS ถ้ายังไม่มี
- insert current year ถ้ายังไม่มี
- validate root Drive folder

ใช้ function นี้แบบ idempotent:

Run ซ้ำแล้วต้องไม่ duplicate data

---

# 11. INITIALIZE YEAR

ควรมี:

```javascript
createAcademicYearStructure("2569")
```

ทำ:

- Drive folders
- YEARS row
- PA sections template
- no duplicate if rerun

---

# 12. PA SECTION SEED

สำหรับปีใหม่ ให้ seed section metadata:

```text
WORKLOAD

1.1
1.2
1.3
1.4
1.5
1.6
1.7
1.8

2.1
2.2
2.3
2.4

3.1
3.2
3.3

CHALLENGE
CHALLENGE_METHOD
INNOVATION
EVIDENCE
RESULTS
```

Title ภาษาไทยเก็บใน Sheet

---

# 13. DRIVE FILE ACCESS POLICY

ต้องเลือกก่อนเปิดใช้งานจริง

## Option A — Public

เหมาะเมื่อเว็บทุกคนเปิดได้

Drive files ต้องเปิดอ่านได้โดย viewer โดยไม่ login

ข้อควรทดสอบ:

- โรงเรียน/Google Workspace domain อนุญาต public sharing หรือไม่
- Incognito เปิด image/PDF ได้จริงหรือไม่

## Option B — Domain

ไฟล์เปิดได้เฉพาะบัญชีโรงเรียน

หน้า GitHub Pages เปิดได้แต่ผู้ใช้ต้องมี Google account ที่มีสิทธิ์เมื่อเปิดไฟล์

## Option C — Private

ไม่เหมาะกับ public user site เว้นแต่เพิ่ม proxy/auth architecture

เลือก:

```text
PUBLIC_FILE_MODE = __________________
```

---

# 14. APPS SCRIPT DEPLOYMENT

Production:

```text
Deploy
→ New deployment
→ Web app
```

ตั้งค่าให้เหมาะกับ architecture:

```text
Execute as: script owner / deploying user
Access: ตาม policy ที่ต้องการ
```

ระบบนี้ออกแบบให้ Apps Script เป็นตัวเข้าถึง Sheet/Drive แทน user

หลัง deploy จะได้:

```text
https://script.google.com/macros/s/.../exec
```

ใช้ `/exec` สำหรับ production

`/dev` ใช้เฉพาะ test deployment

---

# 15. FRONTEND LIVE CONFIG

เมื่อ API ผ่าน basic test:

`js/config.js`

จาก:

```javascript
DATA_MODE: "mock"
API_URL: ""
```

เป็น:

```javascript
DATA_MODE: "live"
API_URL: "https://script.google.com/macros/s/.../exec"
```

API URL เป็น public endpoint จึงไม่ถือเป็น password
แต่ Secret/Password ห้ามอยู่ frontend

---

# 16. TRANSPORT PRE-FLIGHT

ก่อนเปิด live mode ทั้งระบบ
ให้ทดสอบ:

```text
GET health
GET bootstrap
POST login
POST protected write
POST upload small file
```

บน GitHub Pages URL จริง

อย่าทดสอบเฉพาะ localhost

หาก browser block cross-origin request หรือ response:

1. ห้ามแก้ UI
2. ห้ามย้าย database
3. แก้เฉพาะ transport adapter
4. run checklist ใหม่

---

# 17. PUBLIC HEALTH ENDPOINT

ควรมี:

```text
?action=health
```

Response:

```json
{
  "ok": true,
  "data": {
    "service": "Suttinee Teacher Workspace API",
    "status": "ok",
    "database": "connected",
    "drive": "connected",
    "version": "1"
  }
}
```

Health endpoint ห้ามเปิดเผย:

- spreadsheet id
- drive id
- password hash
- session secret
- file paths ที่ sensitive

---

# 18. DATABASE REVISION / CACHE

SETTINGS หรือ internal config ควรมี revision เช่น:

```text
data_revision
```

ทุก write สำคัญ:

- increment revision
- clear relevant Apps Script cache

Frontend bootstrap response ส่ง:

```text
revision
updated_at
```

เพื่อช่วย cache revalidation

---

# 19. MIGRATION SAFETY

ก่อน import Google Sites:

- [ ] DB verification PASS
- [ ] Drive access PASS
- [ ] create year PASS
- [ ] upload PASS
- [ ] old year isolation PASS

จากนั้นค่อย migrate

---

# 20. VALUES RECORD

หลัง setup เสร็จให้บันทึกเฉพาะค่าที่ไม่ sensitive:

```text
Database name:
Spreadsheet owner:
Root Drive folder name:
Default year:
Apps Script deployment date:
Apps Script deployment version:
GitHub Pages URL:
Public file mode:
```

ห้ามบันทึก secret

---

# 21. SETUP COMPLETE CONDITION

Database Setup = COMPLETE เมื่อ:

- [ ] Google Sheet created
- [ ] all tabs created
- [ ] headers valid
- [ ] Drive root created
- [ ] year folders created
- [ ] Script Properties entered
- [ ] Apps Script authorized
- [ ] Apps Script `/exec` deployed
- [ ] frontend switched to live
- [ ] `DATABASE_VERIFICATION_CHECKLIST.md` PASS 100%
