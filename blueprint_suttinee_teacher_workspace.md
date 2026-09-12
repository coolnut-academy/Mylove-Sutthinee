# BLUEPRINT.md
# Suttinee Teacher Workspace
## พัฒนาวิชาชีพและธุรการชั้นเรียน — นางสาวศุทธินี ถาวร

> เอกสาร Blueprint สำหรับสร้างเว็บไซต์ใหม่จากการรวม Google Sites เดิม 2 เว็บไซต์  
> เป้าหมายหลัก: **ใช้ง่ายที่สุด / นำเข้าข้อมูลง่าย / โหลดเร็ว / สวย / เก็บข้อมูลรายปี / ระบบไม่ซับซ้อนเกินจำเป็น**

---

## 1. Project Identity

### ชื่อหลักที่แนะนำ

**Suttinee Teacher Workspace**

### ชื่อภาษาไทย

**พัฒนาวิชาชีพและธุรการชั้นเรียน**

### ชื่อผู้ใช้งานหลัก

**นางสาวศุทธินี ถาวร**

### แนวคิดของชื่อ

เว็บไซต์นี้เป็นพื้นที่ใช้งานส่วนตัวของครู 1 คน จึงไม่ใช้คำว่า “ศูนย์” หรือคำที่สื่อถึงหน่วยงานขนาดใหญ่

คำว่า **Workspace** เหมาะกว่า เพราะระบบรวมทั้ง

- งานธุรการในชั้นเรียน
- ข้อมูลนักเรียน
- เอกสารประกอบการทำงาน
- ผลงานวิชาชีพ
- รายงานผลการพัฒนางานตามข้อตกลง (PA)
- หลักฐานรายปี
- เอกสารและไฟล์จาก Google Drive

หน้าเว็บควรแสดงชื่อเต็มในลักษณะนี้:

> **Suttinee Teacher Workspace**  
> พัฒนาวิชาชีพและธุรการชั้นเรียน  
> **นางสาวศุทธินี ถาวร**

---

# 2. Core Design Principles

ระบบใหม่ต้องยึดหลักต่อไปนี้เป็นกฎหลักในการพัฒนา

## 2.1 Simple First

ห้ามเพิ่มระบบที่ไม่จำเป็น

ทุกฟีเจอร์ต้องตอบคำถามว่า:

> “ฟีเจอร์นี้ช่วยลดจำนวนคลิก ลดเวลาทำงาน หรือทำให้จัดการข้อมูลง่ายขึ้นหรือไม่?”

หากไม่ช่วยอย่างชัดเจน ให้ตัดออก

---

## 2.2 Minimal Actions

งานที่ทำบ่อยต้องใช้จำนวนคลิกให้น้อยที่สุด

ตัวอย่าง:

### เพิ่มหลักฐาน PA หลายไฟล์

ไม่ควรเป็น:

`เพิ่ม → เลือกไฟล์ → กรอกข้อมูล → บันทึก → เพิ่มใหม่ → เลือกไฟล์...`

แต่ควรเป็น:

`ลากไฟล์ 12 ไฟล์ → เลือกหมวดครั้งเดียว → Upload`

จากนั้นระบบ:

1. อัปโหลดทุกไฟล์
2. สร้างรายการอัตโนมัติ
3. ใช้ชื่อไฟล์เป็นชื่อรายการเริ่มต้น
4. ผูกปีการศึกษาให้อัตโนมัติ
5. ผูกหมวดให้อัตโนมัติ
6. แสดงผลทันที

---

## 2.3 Performance + Beauty

ความสวยงามห้ามแลกกับความเร็ว

ลำดับความสำคัญ:

1. โหลดเร็ว
2. ใช้งานง่าย
3. Mobile Friendly
4. สวยงาม
5. Animation เท่าที่จำเป็น

ห้ามใช้ animation หนัก, video background, library ขนาดใหญ่ หรือ effect ที่ทำให้ First Load ช้าโดยไม่จำเป็น

---

## 2.4 Data Driven

HTML ต้องไม่ผูกกับปีการศึกษาใดปีหนึ่ง

ห้ามสร้างไฟล์เช่น:

- `pa2569.html`
- `pa2570.html`
- `classroom2569.html`

ให้ใช้หน้าเดียว แล้วเปลี่ยนข้อมูลตามปี:

```text
pa.html?year=2569
classroom.html?year=2569
```

หรือผ่าน client-side state

---

## 2.5 Preserve History

ข้อมูลปีเก่าต้องไม่ถูกเขียนทับ

เมื่อเปลี่ยนปี:

- ข้อมูลเก่ายังคงดูได้
- ไฟล์เก่ายังคงอยู่
- URL หรือ metadata เดิมไม่เสีย
- Admin สามารถเลือกกลับไปดูปีเก่าได้

---

# 3. Recommended Tech Stack

ใช้เทคโนโลยีให้น้อยที่สุด

## Frontend

- HTML5
- CSS3
- Vanilla JavaScript ES Modules
- ไม่ใช้ React
- ไม่ใช้ Next.js
- ไม่ใช้ Vue
- ไม่ใช้ npm หากไม่จำเป็น
- ไม่ต้องมี build process สำหรับ MVP

Hosting:

**GitHub Pages**

---

## Backend

**Google Apps Script Web App**

หน้าที่:

- Authentication สำหรับ Admin
- อ่าน/เขียน Google Sheets
- Upload ไฟล์เข้า Google Drive
- จัดการ Folder รายปี
- คืนข้อมูล JSON ให้ Frontend
- ตรวจสิทธิ์ทุก Write Operation

---

## Database

**Google Sheets**

ใช้เก็บ:

- metadata
- navigation
- ข้อมูลนักเรียน
- ข้อมูลกิจกรรม
- PA section
- รายการหลักฐาน
- Site settings
- รายการปีการศึกษา

---

## File Storage

**Google Drive**

ใช้เก็บ:

- รูปภาพ
- PDF
- DOCX
- XLSX
- หลักฐาน PA
- รูปกิจกรรม
- เอกสารรายปี
- cover
- background

---

# 4. High-Level Architecture

```text
GitHub Pages
│
├── index.html
├── classroom.html
├── pa.html
├── viewer.html
├── admin.html
│
├── css/
│   └── app.css
│
├── js/
│   ├── api.js
│   ├── cache.js
│   ├── ui.js
│   ├── loading.js
│   ├── auth.js
│   ├── classroom.js
│   ├── pa.js
│   └── admin.js
│
└── assets/
    ├── icons/
    └── fallback/

            │
            │ HTTPS
            ▼

Google Apps Script Web App
│
├── Auth
├── API Router
├── Sheet Service
├── Drive Service
├── Cache Service
└── Upload Service
            │
            ├──────── Google Sheets
            │
            └──────── Google Drive
```

---

# 5. User Roles

ระบบมีเพียง 2 Role

## 5.1 USER

User เป็นโหมดเริ่มต้น

ไม่ต้อง Login

สามารถ:

- ดูหน้าแรก
- เลือกปีการศึกษา
- เข้าธุรการในชั้นเรียน
- ดูข้อมูลที่ Publish แล้ว
- ดู PA
- เปิดรูป
- เปิด PDF
- เปิดเอกสาร
- ดาวน์โหลดไฟล์ที่อนุญาต

ไม่สามารถ:

- เพิ่มข้อมูล
- แก้ไขข้อมูล
- ลบข้อมูล
- Upload
- เปลี่ยน Cover
- เปลี่ยน Background
- เปลี่ยนปี Active

Frontend ต้องไม่มีปุ่มแก้ไขสำหรับ User

---

## 5.2 ADMIN

Admin Login ผ่านหน้า:

```text
/admin.html
```

หรือปุ่มเล็กใน Footer

Admin สามารถ:

- เพิ่ม/แก้ไขข้อมูล
- Upload ไฟล์
- Upload หลายไฟล์
- เปลี่ยน Cover
- เปลี่ยน Background
- สร้างปีใหม่
- Archive ปีเดิม
- จัดลำดับรายการ
- ซ่อน/แสดงรายการ
- แก้ชื่อไฟล์ที่แสดง
- จัดหมวด PA
- จัดการข้อมูลนักเรียน

---

# 6. Admin Security

## กฎสำคัญ

ห้ามเก็บ Admin Password ใน:

- HTML
- JavaScript
- GitHub
- config.js
- source code
- Google Sheet

ให้เก็บไว้ใน:

```text
Google Apps Script
Project Settings
→ Script Properties
```

Property ที่แนะนำ:

```text
ADMIN_PASSWORD_HASH
SESSION_SECRET
ROOT_DRIVE_FOLDER_ID
SPREADSHEET_ID
```

ห้ามส่งค่าเหล่านี้กลับ Frontend

---

## Login Flow

```text
Admin
  │
  ▼
กรอกรหัสผ่าน
  │
  ▼
POST /auth/login
  │
  ▼
Apps Script ตรวจ Password Hash
  │
  ├── ผิด → Reject
  │
  └── ถูก
        │
        ▼
สร้าง Short-lived Admin Session Token
        │
        ▼
Frontend เก็บ token ชั่วคราว
```

Session ควรหมดอายุ เช่น เมื่อไม่ใช้งานระยะหนึ่ง

ทุก Write API ต้องตรวจ Token ฝั่ง Apps Script

ห้ามเชื่อว่า:

```javascript
isAdmin = true
```

จาก Frontend

เพราะ Frontend สามารถแก้เองได้

---

# 7. Homepage

หน้าแรกต้องเรียบ สวย โหลดเร็ว และไม่แน่น

## Layout

```text
┌───────────────────────────────────────────────┐
│                                               │
│         Suttinee Teacher Workspace            │
│       พัฒนาวิชาชีพและธุรการชั้นเรียน          │
│            นางสาวศุทธินี ถาวร                 │
│                                               │
│          ปีการศึกษา  [ 2569 ▼ ]               │
│                                               │
│  ┌─────────────────┐  ┌────────────────────┐  │
│  │                 │  │                    │  │
│  │     COVER       │  │       COVER        │  │
│  │                 │  │                    │  │
│  │ ธุรการในชั้นเรียน │  │ รายงานผล PA        │  │
│  │                 │  │                    │  │
│  │    [ เข้าสู่ ]   │  │     [ เข้าสู่ ]    │  │
│  └─────────────────┘  └────────────────────┘  │
│                                               │
└───────────────────────────────────────────────┘
```

---

# 8. Homepage Academic Year

หน้าแรกต้องมีตัวเลือก:

```text
ปีการศึกษา
[ 2569 ▼ ]
```

ปีที่เลือกจะควบคุมข้อมูลทั้งเว็บไซต์

ตัวอย่าง:

เลือก `2568`

→ Classroom แสดงข้อมูล 2568  
→ PA แสดงข้อมูลชุด 2568  
→ เอกสารแสดงของ 2568

---

## Current Year

ตาราง `YEARS` ต้องมี:

| year | label | status | is_default |
|---|---|---|---|
| 2568 | ปีการศึกษา 2568 | archived | false |
| 2569 | ปีการศึกษา 2569 | active | true |

Homepage ใช้ `is_default=true`

User ยังเลือกปีเก่าได้

---

# 9. Homepage Customization

Admin ต้องสามารถเปลี่ยนได้โดยไม่แก้ Source Code

## 9.1 Background

Admin:

```text
Admin
→ Appearance
→ Homepage Background
→ Upload / Replace
```

รองรับ:

- JPG
- PNG
- WebP

หลัง Upload:

1. Resize / optimize ฝั่ง Client
2. แนะนำแปลงเป็น WebP
3. Upload เข้า Drive
4. Update Setting
5. Clear Cache
6. หน้าแรกใช้ภาพใหม่ทันที

---

## 9.2 Classroom Cover

เปลี่ยน Cover ของปุ่ม:

**ธุรการในชั้นเรียน**

ได้จาก Admin

---

## 9.3 PA Cover

เปลี่ยน Cover ของปุ่ม:

**รายงานผลการพัฒนางานตามข้อตกลง (PA)**

ได้จาก Admin

---

## 9.4 Optional Branding

Admin สามารถแก้:

- Site Title
- Subtitle
- Teacher Name
- Profile image
- Background
- Classroom Cover
- PA Cover

แต่ไม่ควรให้ปรับ Theme จำนวนมากจนระบบซับซ้อน

---

# 10. Main Module 1 — ธุรการในชั้นเรียน

จัดหมวดใหม่ให้ง่ายกว่าระบบเดิม

## A. ข้อมูลชั้นเรียน

- สมาชิกในห้องเรียน
- ข้อมูลนักเรียน

## B. เช็กชื่อและกิจวัตร

- เช็กชื่อมาเรียน
- เช็กชื่อแปรงฟัน
- เช็กชื่อดื่มนม

## C. สุขภาพและดูแลช่วยเหลือ

- น้ำหนัก / ส่วนสูง
- ตรวจสุขภาพ
- SDQ

## D. งานทะเบียน / เอกสาร

- บันทึก ปพ.
- เอกสารที่เกี่ยวข้อง

---

# 11. Main Module 2 — รายงานผล PA

โครงสร้างหลัก:

```text
PA
│
├── ข้อมูลผู้รับการประเมิน
│
├── ข้อตกลงในการพัฒนางาน
│
├── ส่วนที่ 1
│   │
│   ├── ภาระงาน
│   │
│   ├── ด้านที่ 1 การจัดการเรียนรู้
│   │   ├── 1.1
│   │   ├── 1.2
│   │   ├── 1.3
│   │   ├── ...
│   │   └── 1.8
│   │
│   ├── ด้านที่ 2 ส่งเสริมและสนับสนุน
│   │   ├── 2.1
│   │   ├── 2.2
│   │   ├── 2.3
│   │   └── 2.4
│   │
│   └── ด้านที่ 3 พัฒนาตนเองและวิชาชีพ
│       ├── 3.1
│       ├── 3.2
│       └── 3.3
│
└── ส่วนที่ 2 ประเด็นท้าทาย
    ├── ประเด็นท้าทาย
    ├── วิธีดำเนินการ
    ├── นวัตกรรม
    ├── หลักฐาน
    └── ผลลัพธ์
```

---

# 12. Google Drive Folder Design

ใช้ Folder แยกตามปีอย่างชัดเจน

## Root

```text
SUTTINEE_TEACHER_WORKSPACE/
│
├── _SYSTEM/
│   │
│   ├── branding/
│   │   ├── backgrounds/
│   │   ├── covers/
│   │   └── profile/
│   │
│   └── temp/
│
├── 2568/
│   │
│   ├── CLASSROOM/
│   │   ├── students/
│   │   ├── attendance/
│   │   ├── health/
│   │   ├── sdq/
│   │   ├── pp/
│   │   └── documents/
│   │
│   └── PA/
│       ├── profile/
│       ├── workload/
│       ├── section-1/
│       │   ├── 1.1/
│       │   ├── 1.2/
│       │   ├── ...
│       │   └── 1.8/
│       ├── section-2/
│       │   ├── 2.1/
│       │   ├── ...
│       │   └── 2.4/
│       ├── section-3/
│       │   ├── 3.1/
│       │   ├── 3.2/
│       │   └── 3.3/
│       └── challenge/
│
├── 2569/
│   ├── CLASSROOM/
│   └── PA/
│
└── 2570/
    ├── CLASSROOM/
    └── PA/
```

---

# 13. New Year Workflow

Admin ไม่ควรสร้าง Folder เองทีละ Folder

ให้มีปุ่ม:

```text
+ สร้างปีการศึกษาใหม่
```

ตัวอย่าง:

```text
ปีการศึกษา: 2570

[ สร้างปีใหม่ ]
```

ระบบจะ:

1. สร้าง Folder `/2570`
2. สร้าง `CLASSROOM`
3. สร้าง `PA`
4. สร้าง Folder ย่อยมาตรฐาน
5. เพิ่มปี 2570 ลง Sheet
6. Copy เฉพาะโครงสร้าง metadata ที่จำเป็น
7. ไม่ Copy ไฟล์ปีเก่า
8. ตั้งปีใหม่เป็น Active หาก Admin เลือก

---

# 14. Google Sheets Design

ใช้ Spreadsheet เดียวเพื่อลดความซับซ้อน

ชื่อแนะนำ:

```text
SUTTINEE_TEACHER_WORKSPACE_DB
```

---

## Sheet: SETTINGS

| key | value |
|---|---|
| site_title | Suttinee Teacher Workspace |
| site_subtitle | พัฒนาวิชาชีพและธุรการชั้นเรียน |
| teacher_name | นางสาวศุทธินี ถาวร |
| default_year | 2569 |
| background_file_id | ... |
| classroom_cover_file_id | ... |
| pa_cover_file_id | ... |

---

## Sheet: YEARS

| id | year | label | status | root_folder_id | is_default |
|---|---:|---|---|---|---|
| Y2568 | 2568 | ปีการศึกษา 2568 | archived | ... | FALSE |
| Y2569 | 2569 | ปีการศึกษา 2569 | active | ... | TRUE |

---

## Sheet: STUDENTS

| id | year | student_no | student_id | prefix | first_name | last_name | class | status |
|---|---:|---:|---|---|---|---|---|---|

ข้อมูลนักเรียนแยกด้วย `year`

นักเรียนปีเก่าจึงไม่หาย

---

## Sheet: ATTENDANCE

| id | year | date | student_id | status | note | updated_at |
|---|---:|---|---|---|---|---|

---

## Sheet: DAILY_ROUTINES

ใช้กับ:

- แปรงฟัน
- ดื่มนม

| id | year | date | student_id | type | status | note |
|---|---:|---|---|---|---|---|

`type`:

```text
toothbrush
milk
```

---

## Sheet: HEALTH

| id | year | date | student_id | weight | height | bmi | note |
|---|---:|---|---|---:|---:|---:|---|

---

## Sheet: SDQ

| id | year | student_id | date | score | result | file_id | note |
|---|---:|---|---|---:|---|---|---|

---

## Sheet: PA_SECTIONS

| id | year | section_code | title | description | sort_order | published |
|---|---:|---|---|---|---:|---|

ตัวอย่าง:

```text
PA-1.1
PA-1.2
PA-2.1
PA-3.1
CHALLENGE
```

---

## Sheet: PA_ITEMS

| id | year | section_code | title | description | type | drive_file_id | external_url | sort_order | published | created_at |
|---|---:|---|---|---|---|---|---|---:|---|---|

ประเภท:

```text
image
pdf
document
video
link
text
gallery
```

---

# 15. Bulk Upload — Critical Requirement

นี่เป็นหนึ่งในฟีเจอร์หลัก

Admin ต้องสามารถ:

- Click Select Files
- Drag & Drop
- เลือกหลายไฟล์พร้อมกัน

ตัวอย่าง:

```text
PA > ด้านที่ 1 > 1.3

Drop files here
or
[ เลือกไฟล์ ]

12 files selected

[ Upload ทั้งหมด ]
```

---

## Upload Queue

หลังเลือกไฟล์ ให้แสดง:

```text
1. แผนการสอน.pdf        Waiting
2. รูปกิจกรรม01.jpg      Waiting
3. รูปกิจกรรม02.jpg      Waiting
4. ใบงาน.docx            Waiting
...
```

Upload แบบ Queue

แนะนำ concurrent upload:

```text
1–2 files พร้อมกัน
```

ไม่ควรยิง 20 request พร้อมกัน

เพราะจะเพิ่มโอกาส timeout

---

## Automatic Metadata

หลัง Upload ระบบต้องเติมให้โดยอัตโนมัติ:

```text
year = ปีที่กำลังเปิด
section = หมวดที่ Admin อยู่
title = filename without extension
type = detect from MIME
drive_file_id = returned file id
created_at = now
published = true
```

Admin ค่อยแก้ชื่อภายหลังได้

ดังนั้น:

> Upload 15 files ไม่ควรต้องกรอกฟอร์ม 15 ครั้ง

---

# 16. Large File Strategy

ไฟล์ทั่วไป:

- image
- PDF
- DOCX
- XLSX
- small video

สามารถ upload ผ่าน WebApp

สำหรับไฟล์ขนาดใหญ่มาก:

ให้มีปุ่ม:

```text
เพิ่มจาก Google Drive Link
```

เพื่อไม่ต้องบังคับให้ไฟล์ใหญ่ผ่าน Apps Script ทุกครั้ง

---

# 17. Loading Progress Bar

ทุกหน้าที่โหลดข้อมูลจาก:

- Google Sheets
- Google Drive
- Apps Script

ต้องมี **Global Loading Progress Bar**

ตำแหน่ง:

```text
ด้านบนสุดของ viewport
```

สูงประมาณ:

```text
3–4 px
```

---

## Loading States

ตัวอย่าง Phase:

```text
10%  App shell ready
25%  Loading site settings
45%  Loading selected year
65%  Loading data
85%  Loading visible assets
100% Render complete
```

ไม่ควร block ทั้งหน้าเป็นเวลานาน

ให้แสดง:

- App shell
- Skeleton cards
- Progress bar

ก่อน

---

## Cached Page

ถ้ามี cache:

1. แสดงข้อมูลเก่าจาก cache ทันที
2. Progress bar เริ่มทำงาน
3. Fetch ข้อมูลใหม่เบื้องหลัง
4. ถ้ามีข้อมูลใหม่ ค่อย update UI

แนวคิด:

**Stale While Revalidate**

---

# 18. Upload Progress

Bulk Upload ต้องใช้ progress ที่เป็นจริง

แสดง:

```text
Uploading 7 / 12 files

████████████████░░░ 68%
```

และแต่ละไฟล์มีสถานะ:

```text
✓ uploaded
↑ uploading
• waiting
! failed
```

ไฟล์ที่ fail สามารถ:

```text
[ Retry ]
```

โดยไม่ต้อง upload ใหม่ทั้งหมด

---

# 19. Performance Architecture

## Rule 1 — One Bootstrap Request

เมื่อเปิดหน้า:

```text
classroom.html?year=2569
```

Frontend ไม่ควรยิง API 15 ครั้ง

ให้ Apps Script ส่ง payload รวม:

```json
{
  "settings": {},
  "year": {},
  "navigation": [],
  "summary": {},
  "items": []
}
```

ใช้ request เดียวเป็นหลัก

---

## Rule 2 — Lazy Load

ห้ามโหลดหลักฐาน PA ทั้งปีตั้งแต่หน้าแรก

ตัวอย่าง:

เปิด PA

โหลดแค่:

- section
- title
- count
- thumbnail สำคัญ

เมื่อ User เปิด `1.3`

ค่อยโหลดหลักฐานของ `1.3`

---

## Rule 3 — Images

ภาพ Cover / Background ต้อง optimize

แนะนำ:

```text
WebP
```

ขนาดเป้าหมาย:

- Cover: 1200–1600 px
- Background: 1920 px โดยประมาณ
- Thumbnail: 400–600 px

ห้ามโหลดรูปต้นฉบับ 10–20 MB มาเป็น thumbnail

---

## Rule 4 — Cache

ใช้ 2 ชั้น

### Browser

```text
localStorage
```

สำหรับ:

- settings
- year list
- section list
- recent metadata

### Apps Script

```text
CacheService
```

สำหรับข้อมูล read-heavy

---

## Rule 5 — Cache Invalidation

เมื่อ Admin:

- upload
- edit
- publish
- change cover
- change background

Apps Script ต้อง clear cache ที่เกี่ยวข้อง

ไม่ควรรอ cache หมดอายุ

---

# 20. Page Navigation

## Main Pages

```text
/
├── index.html
├── classroom.html
├── pa.html
├── viewer.html
└── admin.html
```

ไม่ต้องสร้าง HTML แยกทุกหัวข้อ

---

# 21. Mobile First

หน้าเว็บต้องใช้ได้บน:

- Phone
- Tablet
- Notebook
- Desktop

Breakpoint แบบเรียบง่าย:

```text
Mobile
Tablet
Desktop
```

ไม่ต้องมี breakpoint จำนวนมาก

---

# 22. UI Style

แนวทาง:

- Modern
- Clean
- Warm
- Premium
- Teacher professional
- Soft glass effect ได้เล็กน้อย
- White / warm neutral เป็นฐาน
- ใช้สี Accent เพียง 1–2 สี

ห้าม:

- Glass blur ทุก element
- shadow หนักทุก card
- animation ทุกปุ่ม
- gradient จำนวนมาก
- icon จำนวนมากเกินจำเป็น

---

# 23. Homepage Visual

Background รองรับ:

- Full viewport image
- Soft overlay
- Blur เฉพาะกรณีจำเป็น

Card สองใบควรเด่นที่สุด

Card:

```text
Cover Image
Title
Short Description
CTA
```

เมื่อ Hover:

- scale เล็กน้อย
- shadow เพิ่มเล็กน้อย

ไม่ใช้ animation หนัก

---

# 24. Admin UI

Admin Dashboard แบ่งเพียง 5 เมนู

```text
1. ภาพรวม
2. ข้อมูลรายปี
3. ธุรการในชั้นเรียน
4. PA
5. การแสดงผล
```

ไม่ควรมีเมนูย่อยจำนวนมาก

---

# 25. Admin Dashboard

แสดง:

```text
ปีปัจจุบัน: 2569

นักเรียน: 32
หลักฐาน PA: 187
ไฟล์ปีนี้: 246
Storage status: Connected

[ เพิ่มข้อมูล ]
[ Upload หลายไฟล์ ]
[ สร้างปีใหม่ ]
```

---

# 26. Quick Add

ทุก Admin page ควรมีปุ่ม:

```text
+ เพิ่ม
```

กดแล้วเปิด Quick Add

ไม่ควรพาไปหลายหน้า

---

# 27. Modal / Dialog Rule

ทุก Modal ต้อง:

- viewport-safe
- responsive
- scroll ภายในได้เต็ม
- dynamic content ห้ามทำให้ด้านบนหรือด้านล่างเข้าไม่ถึง
- รองรับรูปที่เพิ่มภายหลัง

Technical requirement:

```text
max-height: 100dvh
overflow-y: auto
```

ต้องทดสอบกรณี:

- mobile keyboard
- เพิ่มรูปหลายรูป
- form ยาว
- landscape tablet

---

# 28. Search

ให้มี Search แบบเบา

Search ใน:

- PA
- files
- students

ทำฝั่ง Client ก่อน หาก dataset ไม่ใหญ่

ไม่ต้องสร้าง full-text search backend ที่ซับซ้อนใน MVP

---

# 29. Sorting

Admin สามารถ reorder item ด้วย:

```text
↑
↓
```

หรือ drag & drop หาก implementation ไม่เพิ่ม dependency มากเกินไป

เก็บ:

```text
sort_order
```

ใน Sheet

---

# 30. Publish / Hide

ทุก Content Item มี:

```text
published = TRUE / FALSE
```

Admin สามารถซ่อนข้อมูลโดยไม่ลบ

User เห็นเฉพาะ:

```text
published = TRUE
```

---

# 31. Delete Strategy

ห้ามลบไฟล์จริงจาก Drive ทันทีโดย default

เมื่อ Admin กด Delete:

```text
Archive / Hide
```

ก่อน

เพิ่ม field:

```text
archived = TRUE
```

Permanent Delete เป็น action แยกและต้องยืนยัน

---

# 32. Academic Year Archive

ปีเก่า:

```text
status = archived
```

แต่ User ยังเปิดดูได้

ข้อมูลจะกลายเป็น read-only

Admin ยังสามารถแก้ได้หากจำเป็น

---

# 33. PA Year Label

Homepage ใช้:

```text
ปีการศึกษา
```

แต่ภายใน PA สามารถมี metadata เพิ่ม:

```text
รอบการประเมิน
ปีงบประมาณ
ช่วงวันที่
```

ตัวอย่าง:

```text
ปีการศึกษา 2569
รอบ PA: 1 ตุลาคม 2568 – 30 กันยายน 2569
```

เพื่อไม่บังคับว่าปีการศึกษากับปีงบประมาณต้องเหมือนกันทุกครั้ง

---

# 34. File Viewer

เมื่อกดไฟล์:

ไม่ควรออกจากเว็บทันทีถ้าไม่จำเป็น

ใช้ `viewer.html`

รองรับ:

- Image
- PDF preview
- Video
- External link

สำหรับ DOCX/XLSX:

แสดง:

```text
ชื่อไฟล์
ชนิด
วันที่
[ เปิดใน Google Drive ]
[ ดาวน์โหลด ]
```

---

# 35. Error Handling

ห้ามแสดง error แบบ developer เช่น:

```text
TypeError: Cannot read property...
```

ให้แสดง:

```text
ไม่สามารถโหลดข้อมูลได้
[ ลองใหม่ ]
```

และ log รายละเอียดใน console

---

# 36. Offline / Poor Network Behavior

หาก Sheet/Drive ช้า:

1. แสดง cached data ถ้ามี
2. แสดง progress bar
3. แสดงสถานะ:

```text
กำลังอัปเดตข้อมูล...
```

ไม่ควรทำให้หน้าเป็น blank

---

# 37. API Design

ให้ Apps Script มี endpoint แบบง่าย

ตัวอย่าง:

```text
GET  ?action=bootstrap&year=2569&module=home
GET  ?action=bootstrap&year=2569&module=classroom
GET  ?action=bootstrap&year=2569&module=pa
GET  ?action=pa-items&year=2569&section=1.3

POST action=login
POST action=upload
POST action=save
POST action=publish
POST action=create-year
POST action=update-branding
```

ไม่ต้องสร้าง REST API ซับซ้อนเกินจำเป็น

---

# 38. API Response Standard

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "timestamp": 0
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
  }
}
```

---

# 39. Frontend State

ห้ามใช้ global variables กระจัดกระจาย

ใช้ state กลางแบบเบา:

```javascript
const AppState = {
  selectedYear: null,
  userRole: "user",
  settings: null,
  cache: {}
}
```

ไม่จำเป็นต้องติดตั้ง state management library

---

# 40. Data Import Strategy

## Student Data

Admin สามารถ:

```text
Upload CSV
```

หรือ:

```text
Paste ตารางจาก Excel / Google Sheets
```

แล้ว preview ก่อน import

---

## PA Evidence

รองรับ:

```text
Bulk File Upload
```

เป็นหลัก

---

## Existing Drive

ควรมีฟังก์ชัน:

```text
Add existing Drive file/link
```

เพื่อไม่ต้อง upload ไฟล์เดิมซ้ำ

---

# 41. Migration from Existing Google Sites

Google Sites เดิมใช้เป็น Reference เท่านั้นในช่วง migration

## Migration Principle

ห้าม Copy ทุกอย่างเข้า HTML

ให้แยก:

### Content

ข้อความ / หัวข้อ

→ Google Sheet

### Files

PDF / DOCX / images

→ Google Drive

### Navigation

หมวด / section

→ Google Sheet metadata

### Static UI

layout / branding

→ HTML/CSS

---

# 42. Migration Order

## Phase A

สร้างระบบใหม่ให้พร้อมก่อน

## Phase B

ย้าย:

- Homepage
- Branding
- Menu structure

## Phase C

ย้าย Classroom

## Phase D

ย้าย PA

## Phase E

ตรวจความครบถ้วน

## Phase F

เปิดระบบใหม่

Google Sites เดิมยังไม่ควรลบทันที

---

# 43. Apps Script Responsibilities

Apps Script เท่านั้นที่มีสิทธิ์:

- เขียน Sheet
- สร้าง Folder
- Upload Drive
- Update metadata
- Delete/Archive
- Validate Admin Token

Frontend ห้ามเชื่อม Write Operation ตรงเข้า Sheet

---

# 44. Logging

สร้าง Sheet:

```text
AUDIT_LOG
```

เก็บเฉพาะ Admin action สำคัญ

| timestamp | action | year | target | detail |
|---|---|---|---|---|

ตัวอย่าง:

```text
UPLOAD_FILES
CHANGE_BACKGROUND
CREATE_YEAR
ARCHIVE_ITEM
UPDATE_PA_ITEM
```

ไม่ต้อง log ทุก page view

---

# 45. Backup Philosophy

Google Drive แยกปีอยู่แล้ว

Google Sheet ต้องไม่ลบข้อมูลปีเก่า

แนะนำ Admin action:

```text
Export metadata backup
```

เป็น CSV/JSON ได้ภายหลัง

MVP ยังไม่จำเป็นต้องมีระบบ Backup ซับซ้อน

---

# 46. Accessibility

ขั้นต่ำ:

- contrast อ่านง่าย
- button มี label
- image มี alt
- keyboard navigation
- font size mobile อ่านง่าย
- touch target ไม่เล็ก

---

# 47. Recommended Font

เพื่อ performance:

ใช้ System Font Stack ก่อน

ตัวอย่าง:

```css
font-family:
system-ui,
-apple-system,
"Segoe UI",
Tahoma,
sans-serif;
```

หากใช้ Google Font ต้องใช้ไม่เกิน 1 family และไม่โหลด weight จำนวนมาก

---

# 48. Icon Strategy

ใช้:

- Inline SVG
หรือ
- icon set ขนาดเล็ก

ห้ามโหลด icon library ขนาดใหญ่เพียงเพื่อใช้ 10 icon

---

# 49. No Heavy Framework Rule

MVP ห้ามเพิ่ม:

- React
- Firebase
- Node backend
- SQL database
- Cloud Functions
- Docker
- complex authentication provider

เว้นแต่มี Requirement ใหม่ที่พิสูจน์ว่าจำเป็นจริง

---

# 50. MVP Scope

MVP ต้องมีครบ:

- Homepage
- Academic Year selector
- Classroom module
- PA module
- Admin login
- Read-only User mode
- Site branding editor
- Homepage background editor
- Classroom cover editor
- PA cover editor
- New year creator
- Google Drive yearly folders
- Google Sheets metadata
- Bulk file upload
- Upload progress
- Page loading progress
- Publish/hide
- Cache
- Mobile responsive

---

# 51. Features NOT Required in MVP

ยังไม่ต้องมี:

- multi-admin
- Google Login
- OAuth Role system
- notification
- email alert
- chat
- AI
- analytics dashboard ขั้นสูง
- realtime websocket
- push notification
- complex workflow approval

สิ่งเหล่านี้เพิ่มภายหลังได้หากจำเป็น

---

# 52. UX Success Criteria

ระบบถือว่าออกแบบสำเร็จเมื่อ:

## Homepage

User เข้าเว็บและเข้า Module ที่ต้องการได้ภายใน:

```text
1–2 clicks
```

## Upload PA

Admin สามารถเพิ่มหลักฐาน 10 ไฟล์ได้โดย:

```text
เลือก Section ครั้งเดียว
เลือกไฟล์ทั้งหมดครั้งเดียว
กด Upload ครั้งเดียว
```

## New Academic Year

สร้างปีใหม่ได้ด้วย:

```text
กรอกปี
กด Create
```

ระบบสร้าง Folder และข้อมูลพื้นฐานเอง

## Branding

เปลี่ยน:

- Background
- Classroom Cover
- PA Cover

โดยไม่แก้ Code

---

# 53. Performance Targets

เป้าหมายเชิง UX:

### Initial shell

ควรเห็นโครงหน้าเกือบทันที

### Data loading

ห้ามเป็นหน้าขาว

### Cached revisit

ควรเปิดข้อมูลเดิมทันทีแล้ว update เบื้องหลัง

### Image

Lazy-load

### API

ลดจำนวน request ให้ต่ำที่สุด

---

# 54. Important Coding Rules

1. ห้าม hardcode ปีการศึกษาใน UI
2. ห้าม hardcode Drive Folder ID กระจายหลายไฟล์
3. ห้าม hardcode password
4. ห้าม fetch ข้อมูลซ้ำโดยไม่จำเป็น
5. ห้ามโหลดรูปทั้งหมดตั้งแต่แรก
6. ห้ามสร้าง Apps Script call ต่อ item
7. ห้ามเขียน DOM ซ้ำจำนวนมากโดยไม่มี batch render
8. ห้ามใช้ blocking overlay ถ้าไม่จำเป็น
9. ห้ามลบข้อมูลปีเก่าเมื่อสร้างปีใหม่
10. ห้ามให้ User write data แม้จะเรียก API เอง

---

# 55. Configuration Constants

Frontend อนุญาตให้มีเพียง public config เช่น:

```javascript
export const CONFIG = {
  API_URL: "...Apps Script Web App URL..."
}
```

ข้อมูล sensitive อยู่ Apps Script เท่านั้น

---

# 56. Suggested Folder Structure — Repository

```text
/
├── index.html
├── classroom.html
├── pa.html
├── admin.html
├── viewer.html
│
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── components.css
│   └── pages.css
│
├── js/
│   ├── config.js
│   ├── api.js
│   ├── auth.js
│   ├── cache.js
│   ├── loading.js
│   ├── utils.js
│   ├── home.js
│   ├── classroom.js
│   ├── pa.js
│   ├── viewer.js
│   └── admin.js
│
├── assets/
│   ├── icons/
│   └── fallback/
│
├── blueprint.md
└── README.md
```

---

# 57. Suggested Apps Script Files

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
```

ไม่ควรแตกไฟล์ย่อยเกินกว่านี้ในช่วงแรก

---

# 58. Page Loading Component

ทุก page ใช้ component เดียวกัน

API:

```javascript
Loading.start()
Loading.set(40)
Loading.set(75)
Loading.done()
```

ห้ามแต่ละหน้าสร้าง loading bar ของตัวเอง

---

# 59. Empty State

ถ้าปีใหม่ยังไม่มีข้อมูล:

ไม่แสดง error

ให้แสดง:

```text
ยังไม่มีข้อมูลสำหรับปีการศึกษา 2570
```

Admin:

```text
[ เพิ่มข้อมูล ]
```

User:

```text
ยังไม่มีข้อมูลเผยแพร่
```

---

# 60. Admin Session UX

เมื่อ Session หมด:

ห้ามทำข้อมูลที่กรอกหายทันที

ให้:

1. เก็บ Draft ชั่วคราว
2. เปิด Login Modal
3. Login ใหม่
4. ดำเนินการต่อ

---

# 61. Home Background Fallback

หาก Drive โหลด Background ไม่สำเร็จ:

ใช้ CSS background fallback

ห้ามหน้าเว็บกลายเป็นพื้นขาว/แตก

---

# 62. Cover Fallback

หาก Cover ไม่มี:

ใช้ default cover ใน:

```text
/assets/fallback/
```

---

# 63. Data Consistency

ทุก record ที่เป็นข้อมูลรายปีต้องมี:

```text
year
```

ทุก file metadata ต้องมี:

```text
year
drive_file_id
```

เพื่อให้ค้นย้อนปีได้แน่นอน

---

# 64. IDs

ใช้ ID ไม่ผูกกับ row number

ตัวอย่าง:

```text
STU_xxxxx
PAI_xxxxx
SEC_xxxxx
YR_2569
```

เพราะ row number เปลี่ยนได้เมื่อ sort/delete

---

# 65. Sheet Access Optimization

ห้ามใช้:

```text
getRange().getValue()
```

ทีละ cell จำนวนมาก

ให้ใช้:

```text
getValues()
```

ทีละ range

และทำ processing ใน memory

Write หลาย record:

ใช้ batch `setValues()`

---

# 66. Drive Optimization

ห้าม scan ทั้ง Drive ทุกครั้งที่เปิดหน้า

Sheet ต้องเป็น metadata index

Flow:

```text
Drive = File Storage
Sheet = Index
```

หน้าเว็บอ่าน metadata จาก Sheet

ไม่ใช่ค้น Drive สดทุกครั้ง

---

# 67. Source of Truth

## Metadata

Google Sheet

## File binary

Google Drive

## Password / secret

Apps Script Properties

## UI

GitHub Pages

---

# 68. Final Product Concept

ระบบสุดท้ายต้องให้ความรู้สึกว่า:

> เป็นเว็บไซต์ส่วนตัวสำหรับงานครูของ **นางสาวศุทธินี ถาวร**  
> ที่เปิดดูง่ายเหมือน Portfolio  
> แต่จัดการข้อมูลได้ง่ายเหมือน File Manager  
> และมีระบบรายปีโดยไม่ต้องสร้างเว็บไซต์ใหม่ทุกปี

หน้าแรกทำหน้าที่เป็น Gateway ที่เรียบและสวย

```text
Suttinee Teacher Workspace

ปีการศึกษา 2569

[ ธุรการในชั้นเรียน ]

[ รายงานผลการพัฒนางานตามข้อตกลง (PA) ]
```

Admin สามารถเปลี่ยน:

- ปี
- Background
- Cover
- Content
- File
- PA Evidence

ได้โดยไม่แก้ Source Code

---

# 69. Development Priority

ลำดับการพัฒนา:

## Phase 1 — Foundation

- Repository
- Static shell
- Responsive layout
- Apps Script connection
- Sheet connection
- Drive root
- loading system

## Phase 2 — Homepage

- Branding
- Academic year
- two main cards
- dynamic background
- dynamic covers

## Phase 3 — Admin

- Login
- session
- settings
- create year

## Phase 4 — Classroom

- student data
- attendance
- routines
- health
- SDQ
- documents

## Phase 5 — PA

- section structure
- metadata
- evidence
- viewer

## Phase 6 — Bulk Upload

- multi-file picker
- drag/drop
- upload queue
- progress
- retry
- metadata automation

## Phase 7 — Migration

- migrate existing Google Sites content
- map Drive files
- verify old/new completeness

## Phase 8 — Optimization

- cache
- lazy load
- image optimization
- responsive QA
- performance QA

---

# 70. Final Non-Negotiable Requirements

ก่อนถือว่าระบบเสร็จ ต้องตรวจครบ:

- [ ] หน้าแรกมีปีการศึกษา
- [ ] เปลี่ยนปีแล้วข้อมูลทุก Module เปลี่ยนตาม
- [ ] ปีเก่ายังดูได้
- [ ] Admin เปลี่ยน Background ได้
- [ ] Admin เปลี่ยน Classroom Cover ได้
- [ ] Admin เปลี่ยน PA Cover ได้
- [ ] Password ไม่อยู่ใน GitHub
- [ ] Password/Secret อยู่ Apps Script Properties
- [ ] User ไม่มี Write Permission
- [ ] Backend ตรวจ Admin Token ทุก Write
- [ ] Upload หลายไฟล์พร้อมกันได้
- [ ] มี Upload Progress
- [ ] ทุกหน้าที่ดึงข้อมูลมี Loading Progress
- [ ] มี Cache
- [ ] มี Lazy Loading
- [ ] Drive แยก Folder ตามปี
- [ ] Sheet เก็บข้อมูลแยกปี
- [ ] Apps Script ไม่ scan Drive ทั้งหมดทุก request
- [ ] Mobile ใช้งานได้จริง
- [ ] Modal scroll ได้ตั้งแต่บนสุดถึงล่างสุด
- [ ] ไม่มีข้อมูลปีเก่าถูก overwrite
- [ ] หน้า User ไม่มีปุ่ม Admin/Edit
- [ ] ระบบใช้งานได้โดยไม่ต้องแก้ Code เมื่อขึ้นปีใหม่

---

## Final Direction

**Build the simplest system that satisfies all requirements.**

เมื่อมีทางเลือก 2 แบบ:

> ให้เลือกแบบที่ดูแลง่ายกว่า  
> dependency น้อยกว่า  
> request น้อยกว่า  
> ผู้ใช้คลิกน้อยกว่า  
> และยังรักษาความเร็วกับความสวยงามไว้ได้

ระบบนี้ไม่ต้องเป็น Enterprise Platform

ระบบนี้ต้องเป็น:

> **Personal Teacher Workspace ที่เร็ว สวย ใช้ง่าย และดูแลต่อได้หลายปี**
