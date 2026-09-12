# ผลตรวจและการนำแพตช์ขึ้นใช้งาน

ตรวจเมื่อ 12 กันยายน 2569

## แพตช์เพิ่มเติม: หน้าต่างค้างหลังบันทึก (deployment 7)

ผู้ใช้รายงานค้างที่ “กำลังบันทึกข้อมูลลง Google Sheets” ตรวจพบรายการจริง ID `cls_doc_1789209634895_nwi5l` พร้อมภาพในฐานข้อมูลแล้ว จึงรักษารายการนี้ไว้โดยไม่สร้างซ้ำ

- ตัวจับเวลาเดิมสิ้นสุดเมื่อได้รับ HTTP headers ก่อนอ่าน response body จบ แก้ให้จับเวลาครอบคลุมจนอ่าน body เสร็จ
- ย้ายการอ่านยืนยันไปในคำขอบันทึกเดียวที่ backend ภายใต้ lock; ส่งแถวที่อ่านจากชีตจริงพร้อม `_persisted` กลับมา
- หน้าเว็บแสดงการ์ดจากผลยืนยันทันที ไม่รอ GET getItem และ GET getClassroomData เพิ่มหลังบันทึก
- ใช้ ID เดิมเมื่อกดบันทึกซ้ำหลังเครือข่ายขัดข้อง และป้องกันปิด/เปิด modal อื่นระหว่างกำลังบันทึก
- ข้ามแคชของรายการห้องเรียน/PA และป้องกัน GET ที่เริ่มก่อนบันทึกกลับมาทับรายการใหม่
- การโหลดห้องเรียนที่ช้ากว่า 25 วินาทีเคยทำให้รีโหลดแล้วแสดงไม่สำเร็จ เพิ่มเวลารอเป็น 75 วินาที พร้อมหน้าข้อผิดพลาดและปุ่มโหลดซ้ำ; reuse spreadsheet handle ภายใน execution เพื่อลดการเปิดชีตซ้ำ
- ทดสอบจำลอง response body ค้าง, retry ไม่สร้างแถวซ้ำ, การ์ดไม่หายจาก stale GET และทดสอบบันทึกจริงได้ `_persisted: true` โดยไม่มี GET เพิ่มหลังบันทึก
- ตรวจหน้าเว็บจริงแบบไม่ล็อกอิน พบรายการของผู้ใช้และภาพจาก Drive แสดงได้ รายการนี้ไม่ต้องเพิ่มใหม่

ชุดทดสอบเพิ่มเติม: `node tests/save-completion.mjs`

## หลักฐานจากระบบจริง

- API ที่ตั้งค่าใน `js/config.js` ตอบกลับได้ และ YEARS มีปี 2567
- Google Sheets `Mylove-Sutthinee` (ID `1lqtlQBbPGoA-9IZeT0tBQvoUcBQZ8uOyjQdXcVai4G0`) มี CLASSROOM_DOCUMENTS เพียงรายการทดสอบ category=media และ STUDENTS ว่าง
- การอ่าน API ปี 2568 และ 2569 ไม่พบเอกสารห้องเรียน
- Drive `Mylove-Sutthinee-WebPA/2567/PA` มีเพียง `test_evidence.pdf` ในขณะที่ตรวจ
- ยังไม่มีหลักฐานว่ารายการสมาชิกที่ผู้ใช้รายงานถูกบันทึก จึงไม่อ้างว่าสามารถกู้รายการนั้นได้

หลังเชื่อม clasp: ยืนยันโปรเจกต์ `1wJE5XbnR2GFTnIOmPsKynrpNxkM2dE8UY7RbD44J8nBR4h484J4fq57W` มี deployment URL ตรงกับเว็บ (เวอร์ชัน 4) และสำรอง remote source ไว้ใน `.apps-script-backup/` ซึ่งไม่เข้า Git

พบ remote source ยังเป็นรุ่นเก่า: `Sheets.appendRow/updateRow` ไม่เพิ่มคอลัมน์ใหม่, `Classroom.saveDocument` ส่งผลสำเร็จเมื่อมี ID แม้ `updateRow` คืน false, และ `Upload.handleUpload` ยังไม่รองรับ `skipSheetInsert` จึงต้อง deploy backend ใหม่ด้วย การอัปเดตไฟล์ใน GitHub อย่างเดียวไม่แก้ backend

## ข้อผิดพลาดที่แก้ในซอร์ส

1. Upload เดิมบังคับทุกฟีเจอร์เข้า PA; modal ไม่ส่ง module/category ไปเลือกโฟลเดอร์
2. Frontend และ backend กลืนข้อผิดพลาดอัปโหลด แล้วบันทึกภาพสำรองแทน ทำให้แจ้งสำเร็จแม้ภาพไม่ขึ้น Drive
3. Drive เดิมใช้ My Drive root แทนเมื่อ ROOT_DRIVE_FOLDER_ID ผิด ทำให้ไฟล์ไปผิดที่โดยไม่แจ้ง
4. การกรอง archived ใช้ truthiness ทำให้ข้อความ FALSE ถูกซ่อน (ข้อผิดพลาดที่พบในโค้ด ไม่พบในแถวทดสอบปัจจุบัน)
5. เพิ่มคอลัมน์เกินขนาด grid เดิมได้ไม่ปลอดภัย; แก้ให้ขยาย grid ก่อนเขียน และเพิ่ม migration แบบรักษาแถว/คอลัมน์เดิม
6. ก่อนแจ้งบันทึกสำเร็จ ต้องอ่านรายการกลับด้วย ID แล้วตรวจปี หมวด ชื่อ ภาพ และไฟล์ให้ตรง
7. ป้องกันบันทึกระหว่างเตรียมภาพ และไม่เปลี่ยน live เป็น mock เมื่อ URL หาย
8. บังคับตรวจ session ก่อนเขียน และตัด token/action ออกจากข้อมูลก่อนลงชีต

## เส้นทางข้อมูล

| ปุ่ม | ชีต | โฟลเดอร์ใหม่ใต้ root/ปี พ.ศ. |
| --- | --- | --- |
| สมาชิกในห้องเรียน (การ์ดภาพ/ข้อมูล) | CLASSROOM_DOCUMENTS, category=students | CLASSROOM/students |
| หมวดห้องเรียนอื่น ๆ | CLASSROOM_DOCUMENTS, category ตรงกับปุ่ม | `CLASSROOM/<category>` |
| เพิ่มนักเรียนในหน้าจัดการทะเบียน | STUDENTS | ไม่มีไฟล์แนบในแบบฟอร์มนี้ |
| ว.PA / อัปโหลดหลักฐาน | PA_ITEMS, section_code | `PA/<section_code>` |

หมวดห้องเรียนครบ 15 หมวด: students, attendance, teeth, milk, growth, health, sdq, pp, media, plc, research, plan, awards, sar, other

## ขั้นตอนขึ้นระบบจริง

เผยแพร่จริงแล้ว: Apps Script เวอร์ชัน 5 บน deployment เดิม, รัน `migrateFeatureStorage` สำเร็จ และ GitHub Pages ใช้โค้ดใหม่แล้ว ขั้นตอนด้านล่างเก็บไว้สำหรับอัปเดตครั้งต่อไป:

1. เปิด Apps Script ของฐานข้อมูลนี้ อัปเดตไฟล์ `.gs` จากโฟลเดอร์ `apps-script` รวมไฟล์ใหม่ `Migration.gs` และรักษาค่า Script Properties เดิม
2. ตรวจ `SPREADSHEET_ID` และ `ROOT_DRIVE_FOLDER_ID` ให้ชี้ไฟล์ที่ถูกต้อง โดยไฟล์ที่พบในการตรวจนี้คือชีตด้านบนและ root `12b1KhLGFFuJNyqd0qJBQJaZQ5DHOH4Og`
3. รัน `migrateFeatureStorage()` ใน Apps Script editor ฟังก์ชันจะเพิ่มเฉพาะหัวคอลัมน์ที่ขาดและสร้างโฟลเดอร์ตามปีใน YEARS โดยไม่ย้าย/ลบไฟล์หรือแถวเก่า รันซ้ำได้
4. Deploy > Manage deployments > Edit > New version > Deploy ของ deployment เดิม หากใช้ URL ใหม่ ให้แก้ CONFIG.API_URL ด้วย
5. เผยแพร่ frontend ที่แก้ไป GitHub Pages แล้วรีโหลดหน้าเว็บใหม่ เข้าสู่ระบบและเลือกปี 2567
6. เพิ่มรายการสมาชิกพร้อมภาพหนึ่งรายการ ตรวจการ์ดหลังบันทึกและหลังรีโหลด จากนั้นตรวจ CLASSROOM_DOCUMENTS และ root/2567/CLASSROOM/students
7. ทดสอบหมวดห้องเรียนอีกหมวดและ PA อย่างละรายการ ตรวจว่าไฟล์และแถวแยกตามหมวด/ปีถูกต้อง

`getBootstrap` ของ backend ใหม่จะมี `storageVersion: 2026-09-12-feature-folders-v1` เพื่อแยกจาก deployment เก่า

## การทดสอบในเครื่อง

```powershell
node tests/storage-pipeline.mjs
node tests/verify-all.js
```

ทดสอบโค้ด Apps Script จริงด้วยบริการ Sheets/Drive จำลอง: โครงสร้างชีตเก่า, FALSE แบบข้อความ, เพิ่มคอลัมน์ข้าม grid, การบันทึก/อ่านกลับ 15 หมวด, เส้นทาง PA, อัปโหลดล้มเหลว และผลบันทึกที่อ่านกลับไม่ได้ ชุดทดสอบเดิมผ่าน 100 ข้อ

ข้อจำกัดที่ยังมี: รายการที่อัปโหลดไฟล์สำเร็จแต่บันทึกชีตล้มเหลวอาจเหลือไฟล์ใน Drive; migration ไม่ย้ายไฟล์เดิม

## ผลทดสอบหลังเผยแพร่จริง

- Apps Script deployment เดิมอัปเดตเป็นเวอร์ชัน 5 และ API ส่ง storageVersion ใหม่ตามคาด
- migration สำเร็จ; ยืนยัน Drive path ของภาพสมาชิกเป็น `2567/CLASSROOM/students`, หมวดสื่อเป็น `2567/CLASSROOM/media` และ PA เป็น `2567/PA/1.1`
- ทดสอบด้วย Chrome ผ่านแบบฟอร์มบน GitHub Pages: เพิ่มสมาชิกพร้อมภาพ PNG จริง, บีบอัดเป็น WebP, บันทึกลงชีต, โหลดภาพจาก Drive และแสดงการ์ดหลัง reload สำเร็จ
- ทดสอบหมวดสื่อผ่านแบบฟอร์มจริง พบ Google readback เกิน 25 วินาทีหนึ่งครั้ง จึงเพิ่มเวลาเฉพาะการตรวจหลังบันทึกเป็น 75 วินาทีและเผยแพร่แล้ว ทดสอบซ้ำผ่านครบจน modal ปิดและการ์ดแสดงหลัง reload โดยไม่มี JavaScript page errors
- ทดสอบ upload/save/readback ของ PA กับฐานข้อมูลจริงผ่าน
- ลบรายการและไฟล์ชั่วคราวที่สร้างทดสอบครั้งนี้เท่านั้น ตรวจอ่านกลับเหลือรายการห้องเรียนเดิม 1 รายการ และ PA เดิม 2 รายการ
- GitHub Pages: [เปิดหน้าสมาชิก](https://coolnut-academy.github.io/Mylove-Sutthinee/classroom.html?year=2567&view=students)

ไม่ต้องรัน migration หรือ deploy ด้วยตนเองสำหรับแพตช์นี้อีก รายการสมาชิกเดิมที่ไม่ได้ถูกบันทึกต้องเพิ่มใหม่
