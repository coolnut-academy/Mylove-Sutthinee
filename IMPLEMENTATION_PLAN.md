# IMPLEMENTATION_PLAN.md
# Suttinee Teacher Workspace
## พัฒนาวิชาชีพและธุรการชั้นเรียน — นางสาวศุทธินี ถาวร

> เอกสารนี้เป็น Implementation Plan ที่อ้างอิงจาก `blueprint_suttinee_teacher_workspace.md`
> และออกแบบให้ Coding AI สามารถสร้างระบบให้เสร็จครบทุกเฟสก่อนเชื่อมฐานข้อมูลจริง

---

# 0. EXECUTION CONTRACT — กติกาการทำงานของ Coding AI

## 0.1 เป้าหมาย

สร้างเว็บไซต์ **Suttinee Teacher Workspace** ให้พร้อม deploy บน **GitHub Pages**
โดยใช้:

- HTML5
- CSS3
- Vanilla JavaScript ES Modules
- GitHub Pages สำหรับ Frontend
- Google Apps Script Web App สำหรับ Backend/API
- Google Sheets สำหรับ Metadata/Data
- Google Drive สำหรับ File Storage

ระบบต้องเสร็จในระดับที่สามารถใช้งานกับ Mock Data ได้ครบทุกฟีเจอร์
ก่อนจะกรอกค่า Database จริงภายหลัง

---

## 0.2 IMPORTANT — ห้ามหยุดหลังจบแต่ละ Phase

Coding AI ต้องดำเนินการทุก Phase ต่อเนื่องให้ครบ

หลังแต่ละ Phase ให้:

1. ทำงานตาม Phase ให้เสร็จ
2. Run test ที่เกี่ยวข้อง
3. Update checklist/status
4. บันทึกปัญหาที่พบ
5. ไป Phase ถัดไปทันที

**ห้าม STOP เพื่อถามว่า “ทำต่อไหม”**

ยกเว้นเฉพาะสิ่งที่ไม่สามารถทราบได้โดยไม่ใช้ข้อมูลจริง เช่น:

- Apps Script Deployment URL
- Spreadsheet ID
- Google Drive Root Folder ID
- Admin password hash/salt
- GitHub repository URL
- Custom domain (ถ้ามี)

เมื่อพบค่าที่ขาด ให้:

- ใช้ placeholder
- ใช้ Mock Provider
- ทำระบบส่วนอื่นต่อจนเสร็จ
- เก็บรายการไว้ใน `DATABASE_SETUP.md`

---

## 0.3 Definition of “เว็บไซต์เสร็จ”

ก่อนเชื่อมฐานข้อมูลจริง เว็บต้องสามารถทำงานครบด้วย Mock Data:

- หน้าแรก
- เลือกปีการศึกษา
- ธุรการในชั้นเรียน
- PA
- Viewer
- Admin Login แบบ Mock
- Admin Dashboard
- จัดการ Appearance
- Create Year แบบ Mock
- Bulk Upload UI
- Upload Queue
- Progress Bar
- Publish/Hide
- Archive
- Search
- Mobile Responsive
- Cache Layer
- Error / Empty / Loading States

---

# 1. ARCHITECTURE STRATEGY

ใช้แนวคิด **Provider / Adapter Pattern แบบเบา**

Frontend ห้ามผูกกับ Google Sheets/Drive โดยตรง

```text
UI
 │
 ▼
Repository / Data Service
 │
 ├── MockProvider
 │
 └── AppsScriptProvider
          │
          ▼
Google Apps Script
    │         │
    ▼         ▼
 Sheets     Drive
```

ข้อดี:

- สร้างเว็บได้จบก่อน Database พร้อม
- ทดสอบ UI ได้ทุกหน้า
- เปลี่ยน Mock → Real โดยไม่แก้ Component
- หาก Apps Script transport มีปัญหา สามารถเปลี่ยน transport ได้โดยไม่รื้อหน้าเว็บ

---

# 2. FINAL REPOSITORY STRUCTURE

```text
/
├── index.html
├── classroom.html
├── pa.html
├── viewer.html
├── admin.html
├── 404.html
├── .nojekyll
│
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── pages.css
│   ├── admin.css
│   └── utilities.css
│
├── js/
│   ├── config.js
│   ├── app-state.js
│   ├── router-utils.js
│   ├── utils.js
│   ├── loading.js
│   ├── toast.js
│   ├── modal.js
│   ├── cache.js
│   ├── api.js
│   │
│   ├── data/
│   │   ├── provider.js
│   │   ├── mock-provider.js
│   │   ├── apps-script-provider.js
│   │   └── repositories.js
│   │
│   ├── pages/
│   │   ├── home.js
│   │   ├── classroom.js
│   │   ├── pa.js
│   │   ├── viewer.js
│   │   └── admin.js
│   │
│   ├── admin/
│   │   ├── auth.js
│   │   ├── appearance.js
│   │   ├── years.js
│   │   ├── students.js
│   │   ├── pa-manager.js
│   │   └── upload-manager.js
│   │
│   └── mock/
│       ├── settings.js
│       ├── years.js
│       ├── students.js
│       ├── classroom.js
│       └── pa.js
│
├── assets/
│   ├── icons/
│   ├── fallback/
│   │   ├── home-bg.webp
│   │   ├── classroom-cover.webp
│   │   ├── pa-cover.webp
│   │   └── profile.webp
│   └── demo/
│
├── apps-script/
│   ├── Code.gs
│   ├── Config.gs
│   ├── Auth.gs
│   ├── Router.gs
│   ├── Sheets.gs
│   ├── Drive.gs
│   ├── Upload.gs
│   ├── Cache.gs
│   ├── Years.gs
│   ├── Classroom.gs
│   ├── PA.gs
│   ├── Admin.gs
│   ├── Utils.gs
│   └── appsscript.json
│
├── blueprint_suttinee_teacher_workspace.md
├── IMPLEMENTATION_PLAN.md
├── DATABASE_SETUP.md
├── DATABASE_VERIFICATION_CHECKLIST.md
├── README.md
└── PROJECT_STATUS.md
```

---

# 3. GITHUB PAGES COMPATIBILITY RULES

เว็บไซต์นี้เป็น Project Page ได้ เช่น:

```text
https://username.github.io/suttinee-teacher-workspace/
```

ดังนั้นห้ามใช้ path แบบ root-absolute เช่น:

```text
/css/app.css
/js/home.js
/assets/image.webp
```

ให้ใช้ relative path:

```text
./css/app.css
./js/pages/home.js
./assets/fallback/home-bg.webp
```

ทุก navigation ต้องรองรับ repository subpath

ตัวอย่าง:

```javascript
const target = new URL("./classroom.html", window.location.href);
target.searchParams.set("year", selectedYear);
window.location.href = target.href;
```

เพิ่ม `.nojekyll` เพื่อให้ GitHub Pages serve static files ตรง ๆ

---

# 4. DATA MODES

`js/config.js`

```javascript
export const CONFIG = {
  DATA_MODE: "mock", // "mock" | "live"
  API_URL: "",
  APP_NAME: "Suttinee Teacher Workspace",
  CACHE_VERSION: "1",
  DEFAULT_YEAR: "2569",
};
```

Development เริ่มด้วย:

```text
DATA_MODE = mock
```

หลังตั้ง Database:

```text
DATA_MODE = live
API_URL = Apps Script /exec URL
```

ห้ามกระจาย API URL ในหลายไฟล์

---

# 5. CORE DATA CONTRACT

Provider ทุกตัวต้องมี method เดียวกัน

ตัวอย่าง interface:

```javascript
getBootstrap({ module, year })
getYears()
getSettings()
getStudents(year)
getClassroomData(year)
getPaSections(year)
getPaItems({ year, sectionCode })
getItem(id)

login(password)
logout()
validateSession()

saveSettings(payload)
createYear(payload)
saveStudent(payload)
saveClassroomRecord(payload)
savePaItem(payload)
setPublished(payload)
archiveItem(payload)

uploadFiles(payload)
```

UI ห้ามรู้ว่า data มาจาก Mock หรือ Apps Script

---

# 6. PHASE 0 — REPOSITORY FOUNDATION

## Tasks

- [ ] สร้าง repository structure
- [ ] สร้าง `.nojekyll`
- [ ] สร้าง `README.md`
- [ ] สร้าง `PROJECT_STATUS.md`
- [ ] สร้าง `config.js`
- [ ] สร้าง `AppState`
- [ ] สร้าง base CSS
- [ ] ตั้ง system font stack
- [ ] ตั้ง design tokens
- [ ] ตั้ง responsive breakpoints
- [ ] ตั้ง reusable button/card/form styles

## Exit Criteria

- [ ] เปิด `index.html` โดยไม่ error
- [ ] ไม่มี dependency ภายนอกที่ไม่จำเป็น
- [ ] Browser console ไม่มี fatal error
- [ ] ใช้ path ที่ compatible กับ GitHub Pages

---

# 7. PHASE 1 — DESIGN SYSTEM + APP SHELL

สร้าง UI primitives ที่ใช้ทั้งเว็บ

## Components

- Header
- Footer
- Top Progress Bar
- Skeleton
- Button
- Card
- Badge
- Empty State
- Error State
- Toast
- Modal
- Confirm Dialog
- Tabs
- Search Input
- Year Selector
- Breadcrumb
- File Card
- Admin Sidebar / Drawer

## Modal Requirement

ทุก Modal:

```css
max-height: min(92dvh, 900px);
overflow-y: auto;
overscroll-behavior: contain;
```

ต้องเข้าถึงบนสุดและล่างสุดได้แม้:

- เพิ่มรูป
- form ยาว
- keyboard mobile เปิด
- viewport เปลี่ยน
- tablet landscape

## Exit Criteria

- [ ] Mobile 360px ใช้งานได้
- [ ] Tablet ใช้งานได้
- [ ] Desktop ใช้งานได้
- [ ] Modal dynamic content ไม่ตัดบน/ล่าง
- [ ] Keyboard focus visible

---

# 8. PHASE 2 — GLOBAL LOADING SYSTEM

สร้าง `Loading` component เดียวทั้งเว็บ

API:

```javascript
Loading.start()
Loading.set(percent)
Loading.inc(amount)
Loading.done()
Loading.fail()
```

## Page Loading Behavior

```text
10%  app shell
25%  settings
45%  year
65%  metadata
85%  visible assets
100% done
```

ใช้:

- top progress bar
- skeleton cards
- stale cache ถ้ามี

ห้ามใช้ fullscreen blocker สำหรับ public pages ยกเว้น critical write action

## Exit Criteria

- [ ] ทุกหน้าใช้ loading component เดียว
- [ ] ไม่มีหน้าขาวระหว่างโหลด
- [ ] mock delay test แล้ว UI ไม่กระตุก

---

# 9. PHASE 3 — MOCK DATA LAYER

สร้าง MockProvider ให้จำลองระบบจริง

ต้องมีข้อมูลอย่างน้อย:

```text
ปี 2568 = archived
ปี 2569 = active/default
```

Mock:

- site settings
- branding
- years
- students
- attendance
- routines
- health
- SDQ
- documents
- PA sections 1.1–3.3
- challenge
- evidence items
- images
- PDF demo
- external links

Mock write operation ให้ persist ใน `localStorage`

ดังนั้น Admin Mock Mode สามารถ:

- เพิ่ม
- แก้ไข
- hide
- archive
- upload metadata
- create year

แล้ว refresh ยังเห็นข้อมูลเดิม

มีปุ่มสำหรับ developer:

```text
Reset Mock Database
```

แต่ไม่แสดงใน User Mode

---

# 10. PHASE 4 — HOMEPAGE

หน้าแรกต้องเป็น Gateway

## Required Content

```text
Suttinee Teacher Workspace
พัฒนาวิชาชีพและธุรการชั้นเรียน
นางสาวศุทธินี ถาวร
```

## Required UI

- ปีการศึกษา selector
- Classroom card
- PA card
- dynamic homepage background
- dynamic cover 2 ใบ
- responsive layout
- footer
- admin entry แบบไม่เด่นเกินไป

## Year Behavior

URL:

```text
index.html?year=2569
```

Priority:

1. URL `year`
2. localStorage selected year
3. database default year
4. CONFIG.DEFAULT_YEAR

เมื่อเปลี่ยนปี:

- update URL โดยไม่ reload ถ้าเหมาะสม
- save localStorage
- cards ใช้ปีเดียวกัน
- link ไปหน้าอื่นต้องส่ง `?year=...`

## Exit Criteria

- [ ] สลับปีแล้วข้อมูลเปลี่ยน
- [ ] refresh แล้วยังอยู่ปีเดิม
- [ ] ปี archived ยังเลือกได้
- [ ] background fallback ทำงาน

---

# 11. PHASE 5 — CLASSROOM MODULE

`classroom.html?year=2569`

## Dashboard

แสดงเฉพาะข้อมูลจำเป็น:

- จำนวนนักเรียน
- วันนี้มา/ขาด ถ้ามี
- health records summary
- quick navigation

## Sections

### A. ข้อมูลชั้นเรียน

- สมาชิก
- รายชื่อนักเรียน

### B. เช็กชื่อและกิจวัตร

- มาเรียน
- แปรงฟัน
- ดื่มนม

### C. สุขภาพและดูแลช่วยเหลือ

- น้ำหนัก
- ส่วนสูง
- ตรวจสุขภาพ
- SDQ

### D. งานทะเบียน / เอกสาร

- ปพ.
- เอกสาร

## Public/User Mode

Read-only

ห้ามมี:

- edit icon
- delete
- save
- upload

## Admin Mode

Admin สามารถ:

- edit
- import student CSV
- paste table
- add records
- archive records

## Exit Criteria

- [ ] year isolation
- [ ] search student
- [ ] mobile table มี alternative card/list view
- [ ] empty state
- [ ] 100+ student mock records ยัง responsive

---

# 12. PHASE 6 — PA MODULE

`pa.html?year=2569`

## Initial Load

ห้าม load evidence ทั้งหมด

โหลด:

- section list
- section title
- description
- item count
- first/featured thumbnail เท่านั้น

เมื่อเปิด section ค่อย load items

## Structure

### ส่วนที่ 1

- ภาระงาน
- 1.1–1.8
- 2.1–2.4
- 3.1–3.3

### ส่วนที่ 2

- ประเด็นท้าทาย
- วิธีดำเนินการ
- นวัตกรรม
- หลักฐาน
- ผลลัพธ์

## UI

- section navigation
- cards
- accordion/side navigation ตาม viewport
- search evidence
- filter by type
- file viewer
- breadcrumbs

## Exit Criteria

- [ ] lazy load verified
- [ ] hidden items ไม่แสดงใน User
- [ ] archived item ไม่แสดงโดย default
- [ ] section with no evidence มี empty state

---

# 13. PHASE 7 — FILE VIEWER

`viewer.html?id=...&year=...`

รองรับ:

- image
- PDF
- video
- external URL
- Drive file
- DOCX
- XLSX

## Behavior

Image:

- responsive preview
- open original

PDF:

- iframe/object เมื่อ browser รองรับ
- fallback "เปิดไฟล์"

DOCX/XLSX:

- metadata card
- Open in Google Drive
- Download / Open File

## Security

ห้าม render HTML จาก Sheet ด้วย `innerHTML` โดยตรง

ข้อความจาก database ใช้ textContent หรือ sanitized rendering

---

# 14. PHASE 8 — ADMIN AUTH + ADMIN SHELL

`admin.html`

## Mock Mode

Mock password:

```text
DEV ONLY
```

ต้องเก็บใน mock module เท่านั้น
และต้องไม่มีผลเมื่อ `DATA_MODE=live`

## Live Contract

Admin password จริงอยู่ Apps Script Script Properties เท่านั้น

Frontend ส่ง password ไป login endpoint
และรับ session token

## Admin Pages

มี 5 หมวดหลักเท่านั้น:

1. ภาพรวม
2. ข้อมูลรายปี
3. ธุรการในชั้นเรียน
4. PA
5. การแสดงผล

## Session UX

ถ้า session หมดขณะกรอกข้อมูล:

- save draft localStorage
- login modal
- login ใหม่
- restore draft

## Exit Criteria

- [ ] User URL ไม่แสดง admin control
- [ ] direct navigation admin requires login
- [ ] logout clears token
- [ ] expired token UI ทำงาน

---

# 15. PHASE 9 — APPEARANCE MANAGER

Admin สามารถแก้:

- Site title
- Subtitle
- Teacher name
- Profile image
- Homepage background
- Classroom cover
- PA cover

## Mock Mode

ใช้ local preview / localStorage

## Upload UX

- preview image ก่อน save
- client-side resize
- client-side WebP conversion เมื่อ browser รองรับ
- cover target 1200–1600 px
- background target ~1920 px
- ห้าม upscale ภาพเล็กโดยไม่จำเป็น

หลัง save:

- update UI
- invalidate cache
- show toast

---

# 16. PHASE 10 — YEAR MANAGEMENT

Admin:

```text
+ สร้างปีการศึกษาใหม่
```

Form:

- year
- label
- active/default toggle
- optional PA evaluation period

MockProvider จำลองการสร้าง:

```text
2570/
  CLASSROOM/
  PA/
```

LiveProvider จะเรียก backend ให้สร้างจริงภายหลัง

## Rule

ห้าม duplicate year

ห้าม overwrite year เดิม

ปีเก่า:

```text
archived
```

แต่ยังเปิดดูได้

---

# 17. PHASE 11 — BULK UPLOAD UX

ฟีเจอร์สำคัญที่สุดของ Admin

## User Flow

```text
เข้า PA section
→ ลากหลายไฟล์
→ ตรวจรายการ
→ Upload ทั้งหมด
```

ไม่ต้องกรอก metadata ทีละไฟล์

## Queue State

```text
waiting
reading
uploading
success
failed
cancelled
```

## Concurrency

Default:

```text
1 file at a time
```

Option:

```text
2 concurrent files
```

ห้ามสูงกว่านี้ใน Apps Script mode จนกว่าจะทดสอบจริง

## Metadata Auto-fill

- year
- section_code
- file name
- title from filename
- mime type
- created_at
- published=true
- sort_order

## Progress

ต้องมี:

- overall progress
- current file
- item status
- retry failed
- retry all failed

## Large File Behavior

ถ้าไฟล์เกิน threshold ที่ตั้งใน config:

```text
ไฟล์มีขนาดใหญ่ แนะนำเพิ่มจาก Google Drive Link
```

อย่ารับปากว่า Apps Script จะรับไฟล์ใหญ่โดยไม่ทดสอบ quota/payload จริง

---

# 18. PHASE 12 — SEARCH / FILTER / SORT / PUBLISH

## Search

Client-side สำหรับ dataset ที่โหลดมาแล้ว

รองรับ:

- student
- PA
- file title

## Sort

Admin ใช้:

- up/down
หรือ
- native pointer drag implementation ถ้าไม่เพิ่ม library

เก็บ `sort_order`

## Publish

`published=true/false`

## Archive

`archived=true`

Default delete = archive

Permanent delete:

- action แยก
- confirm 2 ขั้น
- ไม่ทำใน MVP หากไม่จำเป็น

---

# 19. PHASE 13 — CACHE + PERFORMANCE

## Browser Cache

ใช้ localStorage สำหรับ metadata/cache ขนาดเล็ก:

```text
settings
years
home bootstrap
classroom bootstrap
pa section index
```

Cache key ต้องมี:

```text
CACHE_VERSION
year
module
```

ตัวอย่าง:

```text
stw:v1:2569:home
```

## Stale While Revalidate

1. render cache ทันที
2. start loading bar
3. fetch fresh
4. compare revision/timestamp
5. update
6. save cache

## Do NOT

- cache session password
- cache raw file binary
- cache sensitive admin data
- cache huge student datasets indefinitely

---

# 20. PHASE 14 — APPS SCRIPT BACKEND SOURCE

ให้สร้าง backend code ครบแม้ยังไม่มี ID จริง

ค่า config อ่านจาก Script Properties:

```text
SPREADSHEET_ID
ROOT_DRIVE_FOLDER_ID
ADMIN_PASSWORD_HASH
ADMIN_PASSWORD_SALT
SESSION_SECRET
PUBLIC_FILE_MODE
```

ห้ามใส่ค่าจริงใน source

## Required Files

### Code.gs

- `doGet(e)`
- `doPost(e)`

### Router.gs

route action

### Config.gs

get Script Properties
validate required config

### Auth.gs

- login
- create token
- validate token
- logout
- session expiry

### Sheets.gs

- open database once per request
- map header → object
- batch read
- batch write
- no per-cell loops for bulk operation

### Drive.gs

- folder helpers
- get year folder
- create folder safely
- file metadata
- sharing policy helper

### Upload.gs

- validate admin
- decode payload
- create file
- save metadata
- return file id/url
- cleanup partial result if metadata write fails when possible

### Cache.gs

- bootstrap cache
- section cache
- invalidation

### Years.gs

- list years
- create year
- create folder tree
- set default
- archive

### Classroom.gs

read/write classroom data

### PA.gs

read/write PA sections/items

### Admin.gs

settings / appearance / publish/archive

---

# 21. APPS SCRIPT API CONTRACT

## GET

```text
?action=health
?action=bootstrap&module=home&year=2569
?action=bootstrap&module=classroom&year=2569
?action=bootstrap&module=pa&year=2569
?action=pa-items&year=2569&section=1.3
?action=item&id=PAI_xxx
```

## POST

Payload:

```json
{
  "action": "save-pa-item",
  "token": "...",
  "payload": {}
}
```

สำหรับ browser compatibility ให้ transport layer สามารถส่ง body แบบ simple request ได้
และห้ามผูก UI กับ Content-Type แบบใดแบบหนึ่ง

Actions:

```text
login
logout
validate-session
save-settings
create-year
save-student
save-classroom-record
save-pa-item
publish
archive
upload-file
register-drive-link
```

---

# 22. RESPONSE CONTRACT

Success:

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "meta": {
    "requestId": "...",
    "timestamp": 0
  }
}
```

Error:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Admin session expired"
  },
  "meta": {
    "requestId": "...",
    "timestamp": 0
  }
}
```

Frontend ใช้ `error.code`
ไม่ parse จาก message

---

# 23. PHASE 15 — TRANSPORT ABSTRACTION

เนื่องจาก GitHub Pages และ Apps Script อยู่คนละ origin
ห้ามเขียน `fetch()` กระจายตามทุกหน้า

สร้าง transport กลาง:

```text
api.js
  └── request()
```

`AppsScriptProvider` เรียก transport เท่านั้น

## Direct Transport

ใช้เป็น default หลัง Database Setup

ต้องทดสอบจริงกับ:

- Chrome desktop
- Safari
- Android Chrome
- iPhone Safari ถ้ามี
- Incognito

โดยเฉพาะ:

- GET JSON
- POST login
- POST write
- upload

หาก direct cross-origin transport มีปัญหากับ environment จริง
ให้เปลี่ยน transport adapter แทนการแก้ UI

## Rule

**ห้ามถือว่า CORS ใช้ได้แน่นอนก่อนผ่าน `DATABASE_VERIFICATION_CHECKLIST.md`**

---

# 24. PHASE 16 — DATABASE-INDEPENDENT BACKEND TESTS

ก่อนมี DB จริง ให้ unit-test pure functions:

- parse request
- response builder
- validation
- normalize year
- sanitize title
- generate ids
- map row/object
- auth hash helper
- metadata builder
- folder path builder

เขียน test harness แบบง่ายได้ใน:

```text
apps-script/Test.gs
```

ไม่ต้องติดตั้ง test framework

---

# 25. PHASE 17 — DATABASE CONNECTION GATE

นี่เป็น **Phase เดียวที่รอค่าจริง**

เมื่อ code ทั้งหมดเสร็จแล้ว ให้เปิด:

`DATABASE_SETUP.md`

กรอก:

```text
[ ] SPREADSHEET_ID
[ ] ROOT_DRIVE_FOLDER_ID
[ ] APPS_SCRIPT_DEPLOYMENT_URL
[ ] ADMIN_PASSWORD_HASH
[ ] ADMIN_PASSWORD_SALT
[ ] PUBLIC_FILE_MODE
[ ] DEFAULT_YEAR
```

จากนั้น:

1. สร้าง Google Sheet
2. สร้าง Sheet tabs
3. สร้าง Drive root
4. สร้าง Apps Script
5. ใส่ Script Properties
6. deploy Apps Script
7. เปลี่ยน Frontend `DATA_MODE=live`
8. ใส่ API URL
9. Run Database Verification Checklist

---

# 26. PHASE 18 — GITHUB PAGES DEPLOYMENT

เพราะเว็บเป็น Static HTML/CSS/JS และไม่มี build process
ใช้วิธีง่ายที่สุดก่อน:

```text
Repository
→ Settings
→ Pages
→ Deploy from a branch
→ main
→ /(root)
```

## Before Deploy

- [ ] no secret in repository
- [ ] no real password
- [ ] no private Drive ID ถ้าไม่จำเป็น
- [ ] `DATA_MODE` ถูกต้อง
- [ ] relative paths
- [ ] `.nojekyll`
- [ ] favicon/fallback present

## After Deploy

ทดสอบ URL จริง:

```text
https://USERNAME.github.io/REPO/
```

ไม่ใช่แค่ Live Server localhost

---

# 27. PHASE 19 — RESPONSIVE QA

ทดสอบขั้นต่ำ:

```text
360 × 800
390 × 844
768 × 1024
1024 × 768
1366 × 768
1920 × 1080
```

Checklist:

- header
- two homepage cards
- year selector
- PA sidebar
- file grid
- modal
- admin sidebar
- upload queue
- long filenames
- empty state
- error state

---

# 28. PHASE 20 — PERFORMANCE QA

## Check

- [ ] initial HTML shell แสดงก่อน data
- [ ] no huge JS bundle
- [ ] no framework bundle
- [ ] images lazy load
- [ ] width/height or aspect-ratio ลด layout shift
- [ ] only visible/needed data loaded
- [ ] one bootstrap call per page as primary request
- [ ] PA evidence lazy loaded per section
- [ ] no Drive scan during public page load
- [ ] repeat visit uses cache

## Development Tools

Chrome DevTools:

- Network
- Performance
- Lighthouse

เป้าหมายไม่ใช่คะแนน 100 แบบฝืน UX
แต่ต้องไม่มีปัญหาหลัก เช่น:

- image หลาย MB ใน first load
- request ซ้ำ
- blocking JS
- layout shift รุนแรง

---

# 29. PHASE 21 — SECURITY QA

ตรวจ:

- [ ] password absent from GitHub
- [ ] secrets absent from `config.js`
- [ ] write endpoint checks session token
- [ ] user cannot write by calling endpoint without token
- [ ] published filtering happens server-side too
- [ ] archived records excluded server-side for public request
- [ ] output escaped
- [ ] no eval
- [ ] no user-supplied HTML rendering
- [ ] session removed on logout
- [ ] admin drafts do not contain password

---

# 30. PHASE 22 — FAILURE / RECOVERY QA

ทดสอบจำลอง:

- API unavailable
- Sheet unavailable
- Drive unavailable
- background unavailable
- cover unavailable
- invalid year
- session expired
- one upload failed
- network disconnected
- empty new year

Expected:

- no blank screen
- fallback images
- cached data when available
- retry controls
- clear Thai error
- no developer stack trace shown to user

---

# 31. PHASE 23 — MIGRATION PREPARATION

ก่อนย้าย Google Sites จริง
สร้าง mapping document:

```text
OLD PAGE
→ NEW MODULE
→ NEW SECTION
→ DESTINATION YEAR
→ DRIVE FOLDER
→ SHEET TABLE
```

ห้ามย้ายเนื้อหาจริงจน:

- database verification ผ่าน
- year structure พร้อม
- upload ผ่าน
- public file access ผ่าน

Google Sites เดิมยังคง online จน verify migration เสร็จ

---

# 32. PHASE 24 — MIGRATION EXECUTION

หลัง Database พร้อม:

## Classroom

ย้าย:

- students
- attendance-related resources
- health
- SDQ
- ปพ.
- documents

## PA

ย้าย:

- profile
- workload
- 1.1–1.8
- 2.1–2.4
- 3.1–3.3
- challenge
- results
- evidence

## Rules

- preserve source filenames
- assign year explicitly
- prevent duplicate import
- store old URL in migration note if helpful

---

# 33. PHASE 25 — FINAL ACCEPTANCE

ระบบถือว่า “พร้อมใช้งานจริง” เมื่อ:

## Public/User

- [ ] Homepage works
- [ ] year selection works
- [ ] Classroom read-only works
- [ ] PA works
- [ ] files open
- [ ] old year opens
- [ ] mobile works

## Admin

- [ ] login
- [ ] edit appearance
- [ ] background replace
- [ ] cover replace
- [ ] create year
- [ ] add/edit records
- [ ] bulk upload
- [ ] retry failed
- [ ] publish/hide
- [ ] archive
- [ ] logout

## Database

- [ ] all checks in `DATABASE_VERIFICATION_CHECKLIST.md` pass

---

# 34. PROJECT_STATUS.md FORMAT

Coding AI ต้อง update หลังแต่ละ Phase

ตัวอย่าง:

```md
# PROJECT STATUS

## Current Overall Status
READY FOR DATABASE CONNECTION

## Completed
- [x] Phase 0
- [x] Phase 1
...

## Database Gate
- [ ] Spreadsheet configured
- [ ] Drive configured
- [ ] Apps Script deployed
- [ ] Verification passed

## Known Issues
- None

## Next Required User Inputs
- Spreadsheet ID
- Root Drive Folder ID
- Apps Script URL
```

---

# 35. DO NOT DO

ห้าม:

- เพิ่ม React
- เพิ่ม Firebase
- เพิ่ม Node backend
- เพิ่ม npm โดยไม่มีเหตุผล
- hardcode year
- hardcode secrets
- duplicate pages per year
- scan Drive ทุก page load
- upload 20 files parallel
- load all PA evidence immediately
- stop after every phase
- ask for Database IDs before UI/app is complete
- claim database works before checklist is run

---

# 36. HANDOFF CONDITION

เมื่อ Coding AI ทำ Implementation Plan ครบทุก Phase ที่ไม่ต้องใช้ Database จริง
ให้รายงานสถานะ:

```text
APPLICATION BUILD: COMPLETE
GITHUB PAGES READY: YES
MOCK MODE: PASS
APPS SCRIPT SOURCE: READY
DATABASE CONNECTION: PENDING USER SETUP
DATABASE VERIFICATION: NOT YET RUN
```

จากนั้นจึงใช้:

- `DATABASE_SETUP.md`
- `DATABASE_VERIFICATION_CHECKLIST.md`

เป็นขั้นตอนต่อไป

---

# 37. CURRENT TECHNICAL NOTES

- GitHub Pages สามารถ deploy static site จาก branch ได้โดยตรง จึงไม่จำเป็นต้องมี build pipeline สำหรับโปรเจกต์นี้
- Google Apps Script Web App ใช้ `doGet(e)` และ `doPost(e)` เป็น entry point
- Production ควรใช้ versioned deployment `/exec`
- Test deployment `/dev` ใช้เฉพาะระหว่าง development
- Apps Script สามารถ execute as script owner เพื่อเข้าถึง Sheet/Drive ของเจ้าของระบบ
- Script Properties เหมาะสำหรับเก็บ configuration/secret ที่ไม่ควรอยู่ใน frontend
- Cross-origin browser transport ระหว่าง GitHub Pages ↔ Apps Script ต้องผ่านการทดสอบจริงก่อนถือว่า integration สำเร็จ

---

## FINAL COMMAND TO CODING AI

> อ่าน `blueprint_suttinee_teacher_workspace.md` และ `IMPLEMENTATION_PLAN.md` ทั้งหมดก่อนเริ่ม  
> สร้างระบบทุก Phase ต่อเนื่องจนเว็บทำงานครบใน Mock Mode และ deployable บน GitHub Pages  
> ห้ามหยุดถามหลังจบแต่ละ Phase  
> หากยังไม่มี Database ID/URL/Secret ให้ใช้ placeholder + Mock Provider แล้วทำงานส่วนอื่นต่อจนจบ  
> หลังเว็บเสร็จ ให้ update `PROJECT_STATUS.md` เป็น `READY FOR DATABASE CONNECTION`  
> จากนั้นรอเฉพาะค่าจริงที่ระบุใน `DATABASE_SETUP.md` และห้ามอ้างว่า Database พร้อมจนกว่าจะผ่าน `DATABASE_VERIFICATION_CHECKLIST.md`
