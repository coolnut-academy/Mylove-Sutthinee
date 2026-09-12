# UX_REDESIGN_GOOGLE_SITES_PLUS.md
# Suttinee Teacher Workspace
## Redesign Directive — Google Sites+ Experience

> เอกสารนี้ใช้สำหรับ “แก้เว็บปัจจุบัน” ไม่ใช่สร้างโปรเจกต์ใหม่
>
> Live site:
> https://coolnut-academy.github.io/Mylove-Sutthinee/
>
> Old site references:
> - ธุรการในชั้นเรียน: https://sites.google.com/hongson.ac.th/krunew/หน้าแรก
> - PA: https://sites.google.com/view/pasuttinee/หน้าแรก

---

# 1. PROBLEM

เว็บใหม่ปัจจุบันมี feature เยอะขึ้น แต่ UX แย่กว่าเว็บ Google Sites เดิม เพราะ:

- หน้าแรกกลายเป็น Showcase/Dashboard ยาว
- ผู้ใช้ไม่รู้ว่าควรกดอะไร
- Classroom รวมหลายงานไว้ในหน้าเดียว
- PA กลายเป็น dashboard แทนที่จะเป็นแฟ้ม
- Admin Console ซับซ้อนและใช้ภาษาของ developer
- มี Mock / DEV / technical controls ปนใน production UI
- เจ้าของเว็บต้องเรียนระบบใหม่แทบทั้งหมด
- การเพิ่มข้อมูลและไฟล์ซับซ้อนกว่า Google Sites
- visual hierarchy ไม่ช่วยให้ “เข้าถึงงานเร็ว”

เป้าหมายรอบนี้คือแก้ “mental model” ไม่ใช่เพิ่ม feature

---

# 2. NEW PRODUCT PRINCIPLE

## Google Sites+

หมายถึง:

> เว็บเดิมที่เจ้าของคุ้นเคย  
> แต่สวยกว่า เร็วกว่า เป็นระเบียบกว่า อัปโหลดง่ายกว่า และมีระบบปีที่ดีกว่า

ห้ามออกแบบโดยคิดว่า:

> “มี feature เยอะ = ระบบดี”

ต้องคิดว่า:

> “เจ้าของเดิมใช้เป็นทันที = ระบบดี”

---

# 3. CORE UX GOAL

เจ้าของเว็บคือ:

**นางสาวศุทธินี ถาวร**

ผู้ใช้หลักไม่ใช่ developer

เจ้าของต้องรู้สึกว่า:

> “นี่คือเว็บเดิมของฉันที่สวยและสะดวกขึ้น”

ไม่ใช่:

> “นี่คือระบบใหม่ที่ฉันต้องเรียนใหม่”

---

# 4. PRESERVE BACKEND

หากของเดิมทำงานแล้ว ให้เก็บไว้:

- Google Apps Script
- Google Sheets integration
- Google Drive integration
- authentication
- upload engine
- cache
- year architecture
- metadata
- provider / adapter layer

รอบนี้ให้เน้น:

- Presentation Layer
- Information Architecture
- Navigation
- Admin Workflow
- Owner Experience

ห้ามรื้อ backend โดยไม่มีเหตุผล

---

# 5. HOMEPAGE — REBUILD COMPLETELY

หน้าแรกต้องเป็น Gateway เท่านั้น

โครงสร้าง:

```text
Suttinee Teacher Workspace
พัฒนาวิชาชีพและธุรการชั้นเรียน

นางสาวศุทธินี ถาวร

ปีการศึกษา [ 2569 ▼ ]

[ ธุรการในชั้นเรียน ]
[ รายงานผลการพัฒนางานตามข้อตกลง (PA) ]

[ Admin ]
```

Desktop ใช้ 2 card ใหญ่ข้างกัน
Mobile ใช้ 1 card ต่อแถว

---

# 6. HOMEPAGE — MUST REMOVE

เอาออกจากหน้าแรก:

- dashboard statistics
- จำนวนหลักฐาน
- 100% completion
- “พร้อมประเมิน”
- STAD
- เกมการเรียนรู้หลายรายการ
- SAR
- PLC
- วิจัย
- แผนการสอน
- รางวัล
- คณะกรรมการ dashboard
- PA section ทั้งหมด
- timeline
- system status
- feature showcase

สิ่งเหล่านี้ควรอยู่ในหน้าที่เกี่ยวข้อง

---

# 7. NO FAKE STATUS

ห้าม hardcode:

```text
100%
หลักฐานครบถ้วน
พร้อมรับการประเมิน
```

หากไม่ได้คำนวณจากข้อมูลจริง

รอบ redesign นี้ให้ตัดออกก่อน

---

# 8. HOMEPAGE CUSTOMIZATION

Admin ต้องเปลี่ยนได้ง่าย:

- ชื่อเว็บไซต์
- subtitle
- ชื่อครู
- รูปโปรไฟล์
- Background หน้าแรก
- Cover “ธุรการในชั้นเรียน”
- Cover “PA”

ไม่ต้องแก้ source code

---

# 9. CLASSROOM — MENU FIRST

หน้า Classroom ต้องเปิดด้วย:

```text
ธุรการในชั้นเรียน
ปีการศึกษา 2569

เลือกงานที่ต้องการ
```

แล้วเป็น card/button ชัด ๆ

ตัวอย่าง:

```text
[ สมาชิกในห้องเรียน ]
[ เช็กชื่อมาเรียน ]

[ เช็กชื่อแปรงฟัน ]
[ เช็กชื่อดื่มนม ]

[ น้ำหนัก / ส่วนสูง ]
[ บันทึกการตรวจสุขภาพ ]

[ แบบประเมิน SDQ ]
[ บันทึก ปพ. ]

[ ทะเบียนสื่อ / แหล่งเรียนรู้ ]
[ PLC ]

[ วิจัยในชั้นเรียน ]
[ แผนการสอน ]

[ ผลงาน / เกียรติบัตร ]
[ SAR ]

[ เอกสารอื่น ๆ ]
```

ยึดชื่อเมนูจาก Google Sites เดิมให้มากที่สุด

---

# 10. ONE PAGE = ONE JOB

ห้ามรวมทุกอย่างในหน้าเดียว

ตัวอย่าง:

กด “ตรวจสุขภาพ”
→ เปิดหน้า “ตรวจสุขภาพ”

กด “PLC”
→ เปิดหน้า “PLC”

กด “แผนการสอน”
→ เปิดหน้า “แผนการสอน”

ไม่ต้องมี unrelated widgets

---

# 11. BREADCRUMB

ใช้ breadcrumb ง่าย ๆ:

```text
หน้าแรก
› ธุรการในชั้นเรียน
› ตรวจสุขภาพ
```

ผู้ใช้ต้องรู้ตลอดว่าอยู่ตรงไหน

---

# 12. PA — DIGITAL BINDER

หน้า PA ต้องกลับไปมี mental model แบบ “แฟ้ม”

หน้าแรกของ PA:

```text
รายงานผลการพัฒนางานตามข้อตกลง (PA)

นางสาวศุทธินี ถาวร
ปีการศึกษา 2569

[ ข้อมูลผู้รับการประเมิน ]
[ ข้อตกลงในการพัฒนางาน ]

ส่วนที่ 1
[ ภาระงาน ]

ด้านที่ 1
[ 1.1 ] [ 1.2 ] ... [ 1.8 ]

ด้านที่ 2
[ 2.1 ] ... [ 2.4 ]

ด้านที่ 3
[ 3.1 ] [ 3.2 ] [ 3.3 ]

ส่วนที่ 2
[ ประเด็นท้าทาย ]
[ วิธีดำเนินการ ]
[ นวัตกรรม ]
[ หลักฐาน ]
[ ผลลัพธ์ ]
```

---

# 13. PA DETAIL PAGE

เมื่อเปิด 1.1:

```text
← ก่อนหน้า                      ถัดไป →

ด้านที่ 1 การจัดการเรียนรู้

1.1 การสร้างและหรือพัฒนาหลักสูตร

[ข้อความ]

[ภาพ]
[PDF]
[เอกสารหลักฐาน]

← ก่อนหน้า                      ถัดไป →
```

ให้ความรู้สึกเหมือนอ่านแฟ้มจริง

---

# 14. PA MUST NOT LOOK LIKE A DATA DASHBOARD

หลีกเลี่ยง:

- metrics
- score cards
- completion bar
- evidence count dashboard
- table-heavy UI
- filter หลายชุด
- status widgets จำนวนมาก

PA คือ:

**Digital Portfolio / Digital Binder**

---

# 15. ADMIN — REBUILD UX

เปลี่ยนคำจาก:

```text
Admin Console
```

เป็น:

```text
จัดการเว็บไซต์
```

หลัง Login ให้เห็น:

```text
จัดการเว็บไซต์

ปีการศึกษา [ 2569 ▼ ]

วันนี้ต้องการทำอะไร?

[ แก้หน้าแรก ]

[ แก้ธุรการในชั้นเรียน ]

[ แก้รายงาน PA ]

[ เพิ่มรูป / เพิ่มไฟล์ ]

[ จัดการปีการศึกษา ]
```

จบ

---

# 16. REMOVE TECHNICAL LANGUAGE FROM ADMIN

เจ้าของเว็บห้ามเห็นคำเหล่านี้:

```text
Mock Mode
Developer Mode
Provider
API
Database
Metadata
Sheet Row
Drive ID
Folder ID
Cache
JSON
Endpoint
Token
Transport
Revision
Backend
Frontend
```

ทั้งหมดเป็น implementation detail

---

# 17. PRODUCTION CLEANUP

ใน Live UI ต้องไม่มี:

- DEV ONLY
- admin123 hint
- test password
- Reset Mock Database
- provider status
- raw API response
- debug panel
- system developer status

หากต้องมี dev mode:
ให้ซ่อนและไม่แสดงใน production

---

# 18. ADMIN — EDIT HOMEPAGE

กด:

```text
แก้หน้าแรก
```

ให้เห็น:

```text
ชื่อเว็บไซต์
[________________]

คำอธิบาย
[________________]

ชื่อครู
[________________]

รูปโปรไฟล์
[ เปลี่ยนรูป ]

พื้นหลังหน้าแรก
[ เปลี่ยนพื้นหลัง ]

ปกธุรการในชั้นเรียน
[ เปลี่ยนปก ]

ปก PA
[ เปลี่ยนปก ]

[ บันทึก ]
```

---

# 19. ADMIN — EDIT CLASSROOM

กด “แก้ธุรการในชั้นเรียน”

ให้เห็นเมนูเหมือนหน้า User

ตัวอย่าง:

```text
สมาชิกในห้องเรียน       [ แก้ไข ]
ตรวจสุขภาพ              [ แก้ไข ]
PLC                     [ แก้ไข ]
แผนการสอน              [ แก้ไข ]
```

ห้ามทำเป็น data console

---

# 20. ADMIN — EDIT PA

กด “แก้รายงาน PA”

ให้เห็นสารบัญเหมือนหน้า Public

```text
1.1 การสร้างและหรือพัฒนาหลักสูตร   [ แก้ไข ]
1.2 ...                              [ แก้ไข ]
...
```

---

# 21. CONTEXTUAL EDITING

หาก Admin อยู่หน้า:

```text
ปี 2569
PA
1.1
```

แล้วกดแก้ไข

ระบบต้องรู้เอง:

```text
year = 2569
module = PA
section = 1.1
```

ห้ามให้เลือกซ้ำใน dropdown

---

# 22. EDIT PAGE

ตัวอย่าง:

```text
1.1 การสร้างและหรือพัฒนาหลักสูตร

หัวข้อ
[________________________]

รายละเอียด
[                          ]
[                          ]

ไฟล์และหลักฐาน

┌──────────────────────────────┐
│ ลากรูป / PDF / เอกสารมาวางได้ │
│                              │
│      [ เลือกหลายไฟล์ ]        │
└──────────────────────────────┘

[รูป 1] [PDF 1] [รูป 2] [DOCX]

[ บันทึก ]
```

---

# 23. BULK UPLOAD — SIMPLE

Workflow ต้องเป็น:

```text
เปิดหน้าที่ต้องการ
→ ลากหลายไฟล์
→ Upload
→ เสร็จ
```

ห้ามเป็น:

```text
Admin
→ เลือก Year
→ เลือก Module
→ เลือก Category
→ เลือก Section
→ เลือก Folder
→ Publish
→ เลือก File
→ Upload
```

ระบบต้อง infer context เอง

---

# 24. AUTO METADATA

เมื่ออยู่หน้า:

```text
2569 / PA / 1.1
```

แล้ว upload 12 ไฟล์

ระบบสร้าง metadata เอง:

```text
year = 2569
module = PA
section = 1.1
title = filename
published = true
```

ผู้ใช้ค่อยแก้ชื่อภายหลังได้

---

# 25. OWNER MUST NOT MANAGE DRIVE FOLDERS

Google Drive structure เป็น backend detail

owner ไม่ต้องรู้ว่าไฟล์อยู่:

```text
/2569/PA/section-1/1.1/
```

ระบบจัดการเอง

---

# 26. YEAR MANAGEMENT

หน้า:

```text
จัดการปีการศึกษา
```

แสดงง่าย ๆ:

```text
2569  ปีปัจจุบัน
2568  ปีที่ผ่านมา

[ + เพิ่มปีการศึกษาใหม่ ]
```

กดเพิ่ม:

```text
ปีการศึกษา [ 2570 ]

[ สร้างปีใหม่ ]
```

จบ

ระบบจัดการ folder / metadata / seed sections เอง

---

# 27. ADMIN LOGIN

หน้า Login:

```text
จัดการเว็บไซต์
นางสาวศุทธินี ถาวร

รหัสผ่าน
[____________]

[ เข้าสู่ระบบ ]
```

ไม่มี dev hint

---

# 28. USER MODE

User เห็น:

- Content
- Files
- Year selector
- Navigation

ไม่เห็น:

- Edit
- Upload
- Admin controls
- Technical status

---

# 29. THEME

ใช้ `THEME_STYLE_GUIDE.md`

สูตร:

```text
60% Clean Academic
25% Cozy Pastel
15% Cute Feminine
```

สีหลัก:

- pastel lavender
- soft purple
- white
- cream
- muted rose เล็กน้อย

ลด:

- royal purple
- dark purple full-screen
- gold-heavy style

Gold ใช้เป็น accent เล็กน้อยเท่านั้น

---

# 30. PAGE-SPECIFIC VISUAL

Homepage:
- สวยที่สุด
- cozy/feminine ได้
- 2 cover cards
- soft background
- subtle bounce

Classroom:
- menu clarity สำคัญกว่า effect

PA:
- document readability สำคัญกว่า effect

Admin:
- speed & clarity สำคัญที่สุด

---

# 31. PERFORMANCE

ห้ามเพิ่ม animation library

ใช้:

- CSS transition
- transform
- opacity

ห้าม continuous decorative animation

---

# 32. MOBILE

ต้องทดสอบ:

- Homepage
- Menu cards
- PA next/previous
- Admin edit
- Upload
- Modal
- Form
- Mobile keyboard

ทุกอย่างต้องใช้งานด้วยนิ้วได้ดี

---

# 33. MODAL RULE

ทุก Modal ต้อง:

- viewport-safe
- fully scrollable
- dynamic-content-safe

ต้องเลื่อนถึงบนสุดและล่างสุดได้เสมอ

---

# 34. PUBLIC PRIVACY

ตรวจข้อมูล public

อย่าแสดง:

- เบอร์โทร
- ที่อยู่ละเอียด
- private contact

ถ้าไม่จำเป็น

ควรมี `published` control

---

# 35. DATA ARCHITECTURE

ยังใช้:

```text
GitHub Pages
      ↓
Google Apps Script
      ↓
Google Sheets + Google Drive
```

ห้ามรื้อเพราะ UX เปลี่ยน

---

# 36. YEAR HISTORY

ต้องเก็บ:

```text
2568
2569
2570
```

แยกกัน

ปีใหม่ห้าม overwrite ปีเก่า

---

# 37. OLD SITES = UX REFERENCE

Google Sites เดิมเป็น reference หลักสำหรับ:

- ชื่อเมนู
- grouping
- navigation
- sequence
- owner mental model

ห้าม copy ความไม่สวย
แต่ต้องรักษาความคุ้นเคย

---

# 38. NEW SITE = VISUAL + WORKFLOW UPGRADE

สิ่งที่ต้องดีกว่าเว็บเดิม:

- responsive
- mobile
- speed
- typography
- spacing
- card design
- upload หลายไฟล์
- year archive
- visual consistency
- file management

---

# 39. OWNER 5-SECOND TEST

สมมติว่า:

> นางสาวศุทธินี ถาวร
> เคยใช้ Google Sites
> ไม่ใช่ developer
> เปิดเว็บใหม่ครั้งแรก

ภายใน 5 วินาทีต้องรู้ว่า:

```text
ธุรการอยู่ตรงไหน?
PA อยู่ตรงไหน?
เปลี่ยนปีตรงไหน?
Login แก้เว็บตรงไหน?
```

ถ้าตอบไม่ได้:

**UX FAIL**

---

# 40. ADMIN 5-SECOND TEST

หลัง Login ภายใน 5 วินาทีต้องรู้ว่า:

```text
เปลี่ยน background ตรงไหน?
เพิ่มหลักฐาน PA ตรงไหน?
แก้หน้า Classroom ตรงไหน?
```

ถ้าต้องอ่านคู่มือ:

**UX FAIL**

---

# 41. 3-CLICK RULE

งานทั่วไปควรทำได้ประมาณ 3 interactions

ตัวอย่าง:

## เพิ่มหลักฐาน PA

```text
PA
→ 1.1
→ แก้ไข / ลากไฟล์
```

## เปลี่ยน Background

```text
Admin
→ แก้หน้าแรก
→ เปลี่ยนพื้นหลัง
```

---

# 42. ZERO-TRAINING GOAL

เป้าหมาย:

> เจ้าของเว็บควรใช้งานได้โดยแทบไม่ต้องอบรม

---

# 43. REDESIGN IMPLEMENTATION ORDER

## Phase 1 — Audit

ทุก component ให้ label:

```text
KEEP
SIMPLIFY
REMOVE
REBUILD
```

## Phase 2 — Preserve Backend

ตรวจ API/provider/Apps Script/Sheet/Drive/auth/upload

เก็บของที่ทำงาน

## Phase 3 — Rebuild Homepage

เหลือ 2-card gateway

## Phase 4 — Rebuild Classroom

Menu-first

## Phase 5 — Rebuild PA

Digital binder

## Phase 6 — Rebuild Admin

Task-first

## Phase 7 — Contextual Editing

Edit current page

## Phase 8 — Simplify Bulk Upload

ลบ dropdown ที่ระบบรู้อยู่แล้ว

## Phase 9 — Theme Refinement

Lavender/cozy มากขึ้น
ลด royal/gold

## Phase 10 — Production Cleanup

ลบ dev/mock UI

## Phase 11 — Responsive QA

## Phase 12 — Database QA

ใช้ `DATABASE_VERIFICATION_CHECKLIST.md`

## Phase 13 — Old/New Content Comparison

เทียบกับ Google Sites เดิม

---

# 44. DO NOT STOP AFTER EACH PHASE

ทำต่อเนื่องจนจบ

หลังแต่ละ Phase:

1. test
2. update status
3. proceed

ห้ามถาม:

```text
ทำต่อไหม?
```

---

# 45. DO NOT INVENT CONTENT

ห้ามสร้างเอง:

- awards
- games
- statistics
- completion
- evaluation results
- evidence counts

หากไม่มีจากเว็บเดิมหรือ database จริง

---

# 46. FINAL HOMEPAGE CHECK

- [ ] มี 2 main cards เท่านั้น
- [ ] มีปีการศึกษา
- [ ] Branding ชัด
- [ ] ไม่มี dashboard ยาว
- [ ] ไม่มี fake completion
- [ ] Cover เปลี่ยนได้
- [ ] Background เปลี่ยนได้
- [ ] Mobile สวย

---

# 47. FINAL CLASSROOM CHECK

- [ ] Menu เข้าใจง่าย
- [ ] ชื่อใกล้เว็บเดิม
- [ ] One page = one job
- [ ] Breadcrumb
- [ ] ปีชัดเจน
- [ ] ไม่มี dashboard overload

---

# 48. FINAL PA CHECK

- [ ] เหมือนแฟ้ม digital
- [ ] สารบัญชัด
- [ ] Previous / Next
- [ ] Evidence อ่านง่าย
- [ ] ไม่มี metric dashboard
- [ ] ไม่มี filter เกินจำเป็น

---

# 49. FINAL ADMIN CHECK

- [ ] Task-first
- [ ] ไม่มีศัพท์ developer
- [ ] แก้หน้าแรกง่าย
- [ ] แก้ Classroom ง่าย
- [ ] แก้ PA ง่าย
- [ ] Upload หลายไฟล์ง่าย
- [ ] จัดการปีง่าย
- [ ] ไม่มี Mock/DEV UI

---

# 50. FINAL OWNER EXPERIENCE

ระบบจะถือว่า redesign สำเร็จเมื่อเจ้าของรู้สึกว่า:

> “เว็บเดิมของฉันอยู่ครบ  
> แต่สวยกว่าเดิม  
> หาอะไรง่ายกว่าเดิม  
> เพิ่มข้อมูลเร็วกว่าเดิม  
> และฉันไม่ต้องเรียนระบบใหม่”

ถ้าไม่เกิดความรู้สึกนี้:

**REDESIGN NOT COMPLETE**

---

# 51. FINAL PRODUCT FORMULA

```text
Google Sites familiarity
+
Modern visual quality
+
Fast HTML5 performance
+
Simple admin editing
+
Bulk upload
+
Year archive
=
Suttinee Teacher Workspace
```

---

# 52. FINAL COMMAND TO CODING AI

> รอบนี้ไม่ใช่การเพิ่ม feature แต่เป็นการแก้ UX ที่ออกแบบผิดทิศ
>
> ให้รักษา backend/data architecture ที่ทำงานได้ แต่รื้อ presentation layer และ Admin UX ให้กลับมาเรียบง่ายเหมือน Google Sites เดิม
>
> ใช้ Google Sites เดิมเป็น reference สำหรับ mental model, navigation, naming และ grouping
>
> หน้าแรกต้องเป็น Gateway 2 ปุ่มเท่านั้น:
> **ธุรการในชั้นเรียน**
> และ
> **รายงานผลการพัฒนางานตามข้อตกลง (PA)**
>
> Classroom = menu-first
>
> PA = digital binder
>
> Admin = task-first
>
> Owner ไม่ควรเห็นศัพท์ developer หรือ database
>
> ทุกการแก้ไข/อัปโหลดควรเกิดจาก context ของหน้าที่กำลังแก้ เพื่อให้ระบบรู้อยู่แล้วว่า year/module/section คืออะไร
>
> เป้าหมายสูงสุด:
>
> **“เจ้าของเว็บเดิมต้องใช้งานเว็บใหม่ได้โดยแทบไม่ต้องเรียนรู้ใหม่”**
