# Suttinee Teacher Workspace
## พัฒนาวิชาชีพและธุรการชั้นเรียน — นางสาวศุทธินี ถาวร

ระบบเว็บแอปพลิเคชันบริหารจัดการงานพัฒนาวิชาชีพ (ว.PA) และงานธุรการชั้นเรียนสำหรับครูผู้สอน ออกแบบด้วยแนวคิด **Pastel Purple · Cozy · Feminine · Academic (Lavender Cozy Academic)** 

---

### คุณสมบัติหลัก (Key Features)

- **Year-based Isolation (ระบบข้อมูลรายปี)**: รองรับการเลือกและสลับปีการศึกษา (เช่น 2568, 2569) ได้อย่างอิสระ ทุกหน้าจะซิงก์ปีการศึกษาเดียวกัน
- **Classroom Module (งานธุรการชั้นเรียน)**:
  - ทะเบียนข้อมูลนักเรียน / บัญชีรายชื่อ
  - บันทึกการมาเรียนและกิจวัตรประจำวัน (แปรงฟัน ดื่มนม)
  - ข้อมูลสุขภาพและระบบดูแลช่วยเหลือนักเรียน (น้ำหนัก ส่วนสูง คัดกรอง SDQ)
  - งานเอกสารชั้นเรียน (ปพ. แผนการจัดการเรียนรู้ เอกสารประจำชั้น)
- **PA Module (การประเมินผลการพัฒนางานตามข้อตกลง ว.PA)**:
  - ส่วนที่ 1: การปฏิบัติงานตามมาตรฐานตำแหน่งครู ครบทั้ง 3 ด้าน 15 ตัวชี้วัด (1.1–1.8, 2.1–2.4, 3.1–3.3)
  - ส่วนที่ 2: ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทาย
  - รองรับการแสดงหลักฐาน ผลงาน รูปภาพ และเอกสารอ้างอิง
- **Universal File Viewer**: แสดงผลพรีวิวไฟล์ PDF, รูปภาพ, วิดีโอ และ Google Drive เอกสาร
- **Admin Management & Bulk Upload**:
  - ระบบเข้าสู่ระบบความปลอดภัย
  - ปรับแต่งการแสดงผล (ชื่อครู คำอธิบาย รูปโปรไฟล์ ภาพพื้นหลัง และภาพปก)
  - จัดการและเพิ่มปีการศึกษาใหม่
  - **Bulk Upload UX**: ลากไฟล์หลายไฟล์พร้อมกันเพื่อนำเข้าเป็นหลักฐาน ว.PA แบบจัดคิวและมี Progress bar
- **Dual-Mode Data Architecture**:
  - **Mock Mode**: ใช้งานและทดสอบระบบได้ทันที 100% โดยไม่ต้องเชื่อมต่อฐานข้อมูล พร้อม persistent state บน LocalStorage
  - **Live Mode**: เชื่อมโยงกับ Google Apps Script Web App เพื่ออ่าน/เขียนข้อมูลบน Google Sheets และ Google Drive

---

### โครงสร้างระบบ (Structure)

```text
/
├── index.html            # หน้าหลักและศูนย์รวมข้อมูล
├── classroom.html        # โมดูลงานธุรการชั้นเรียน
├── pa.html               # โมดูล ว.PA (15 ตัวชี้วัด + ประเด็นท้าทาย)
├── viewer.html           # หน้าดูไฟล์และเอกสารแนบ
├── admin.html            # แผงควบคุมผู้ดูแลระบบ
├── 404.html              # หน้า 404 Not Found
├── .nojekyll             # ปิด Jekyll สำหรับ GitHub Pages
├── css/                  # สไตล์ชีท Modular (Lavender Cozy Academic)
├── js/                   # สคริปต์ Vanilla JS ES Modules & Data Providers
├── assets/               # รูปภาพและไอคอนพื้นฐาน
└── apps-script/          # ซอร์สโค้ด Google Apps Script Backend
```

---

### การติดตั้งและใช้งาน (Getting Started)

#### ทดสอบระบบแบบ Local (Mock Mode)
เปิดโฟลเดอร์นี้ผ่าน Local HTTP Server เช่น:
```bash
# Python
python -m http.server 8080

# หรือ Node.js / npx
npx serve .
```
แล้วเปิดเบราว์เซอร์ไปที่ `http://localhost:8080/`

#### การ Deploy บน GitHub Pages
1. Push ซอร์สโค้ดขึ้น GitHub Repository
2. ไปที่ **Settings** > **Pages**
3. เลือก Source เป็นสาขา `main` และโฟลเดอร์ `/ (root)`
4. บันทึกและรอรับลิงก์ GitHub Pages

---

### คู่มือและการตั้งค่าระบบฐานข้อมูล
- [blueprint_suttinee_teacher_workspace.md](./blueprint_suttinee_teacher_workspace.md) — เอกสารพิมพ์เขียวสถาปัตยกรรมระบบ
- [THEME_STYLE_GUIDE.md](./THEME_STYLE_GUIDE.md) — คู่มือและโทเค็นธีม Visual Theme & Design System
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — แผนและข้อกำหนดการพัฒนาระบบ
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) — คู่มือการเชื่อมต่อ Google Sheets & Google Drive
- [DATABASE_VERIFICATION_CHECKLIST.md](./DATABASE_VERIFICATION_CHECKLIST.md) — รายการตรวจสอบความถูกต้องของฐานข้อมูล
