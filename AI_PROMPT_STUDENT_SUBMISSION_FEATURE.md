# 📘 AI MASTER PROMPT & INTEGRATION SPECIFICATION
## ฟีเจอร์: ระบบจัดแสดงและบันทึกผลงานแบบยืดหยุ่น (URL + Upload Cover + Dynamic Fields `+`/`-`)
### สถาปัตยกรรม: Pure HTML5 / Vanilla JS / Modern CSS + Google Apps Script + Google Sheets + Google Drive

---

> **คำแนะนำการใช้งานไฟล์นี้:**
> ไฟล์นี้ได้รับการออกแบบให้เป็น **Universal Showcase & Data Entry Feature** ที่ไม่ผูกติดกับข้อมูลนักเรียนเพียงอย่างเดียว แต่สามารถนำไปใช้กับ:
> - คลังสื่อ / ทะเบียนแหล่งเรียนรู้ (Media & Learning Resource Registry)
> - คลังเกมที่สร้างเอง (Game Showcase)
> - พอร์ตโฟลิโอนวัตกรรมและเว็บแอป (Project / Portfolio Showcase)
> - ระบบส่งงานและแสดงผลงานทั่วไป
>
> **จุดเด่นสำคัญ:** ผู้ใช้สามารถ **อัปโหลดภาพ Cover + ใส่ URL ปลายทาง + กดปุ่ม `+` / `-` เพิ่มหรือลดหัวข้อข้อมูลได้เองอย่างอิสระ** (เช่น ต้องการเก็บแค่ 2 บรรทัด: *ชื่อเกม* กับ *ผู้สร้าง* หรือต้องการ 4 บรรทัด ก็สามารถกดเพิ่ม/ลบได้ตามต้องการ)
>
> 💡 คุณสามารถ **คัดลอก (Copy) เนื้อหาใน [ส่วนที่ 1: Master Prompt สำหรับสั่ง AI](#ส่วนที่-1-master-prompt-สำหรับสั่ง-ai-ในโปรเจกต์ใหม่-copy-paste-ready)** ไปวางในแชตของ AI (เช่น Antigravity, Claude, ChatGPT, Gemini) ในโปรเจกต์ใหม่ที่มี Tech Stack เดียวกันได้ทันที

---

## 📑 สารบัญ
1. [ส่วนที่ 1: Master Prompt สำหรับสั่ง AI ในโปรเจกต์ใหม่ (Copy-Paste Ready)](#ส่วนที่-1-master-prompt-สำหรับสั่ง-ai-ในโปรเจกต์ใหม่-copy-paste-ready)
2. [ส่วนที่ 2: โครงสร้างข้อมูลยืดหยุ่น (Dynamic Data Schema) & API Contract](#ส่วนที่-2-โครงสร้างข้อมูลยืดหยุ่น-dynamic-data-schema--api-contract)
3. [ส่วนที่ 3: สถาปัตยกรรมการเชื่อมต่อระหว่างโปรเจกต์ (Cross-Project Integration)](#ส่วนที่-3-สถาปัตยกรรมการเชื่อมต่อระหว่างโปรเจกต์-cross-project-integration)
4. [ส่วนที่ 4: ชุดโค้ดต้นแบบระบบ Dynamic Fields & Image Optimizer](#ส่วนที่-4-ชุดโค้ดต้นแบบระบบ-dynamic-fields--image-optimizer)
5. [ส่วนที่ 5: เกณฑ์การตรวจรับงาน (Acceptance Criteria)](#ส่วนที่-5-เกณฑ์การตรวจรับงาน-acceptance-criteria)

---

# ส่วนที่ 1: Master Prompt สำหรับสั่ง AI ในโปรเจกต์ใหม่ (Copy-Paste Ready)

*(สามารถคัดลอกข้อความในกรอบด้านล่างนี้ไปสั่ง AI ในโปรเจกต์ใหม่ได้ทันที)*

```markdown
คุณคือ Senior Full-Stack Web Developer, UX/UI Designer และ Google Apps Script Architecture Specialist
งานของคุณคือ: พัฒนา "ฟีเจอร์จัดแสดงและบันทึกผลงานแบบกำหนดหัวข้อได้เอง (Dynamic Showcase & Item Entry with URL + Cover Upload)" ลงในโปรเจกต์นี้

---

### 1. TECH STACK & SYSTEM ARCHITECTURE
- **Frontend:** HTML5 Semantic, Modern Vanilla CSS (Glassmorphism & Card Grid Design), Vanilla JavaScript ES6+ (No build step, No npm, Pure Client-Side Static Web ที่รันบน GitHub Pages ได้ทันที)
- **Backend:** Google Apps Script (GAS) Web App ทำหน้าที่เป็น RESTful API Controller
- **Database:** Google Sheets ทำหน้าที่เป็นฐานข้อมูล โดยฟิลด์ข้อมูลที่ผู้ใช้กำหนดเองจะถูกจัดเก็บในรูป Structured JSON String ร่วมกับฟิลด์หลัก
- **Storage:** Google Drive สำหรับเก็บไฟล์ภาพหน้าปก (Cover Images)

---

### 2. ขอบเขตฟังก์ชันหลักที่ต้องสร้าง (KEY FEATURES)

#### 2.1 หน้าต่างบันทึกข้อมูล (Item Entry Modal / Form)
ฟอร์มนี้ต้องมีความยืดหยุ่นสูง (Generic & Dynamic) ไม่ฟิกซ์ตายตัว โดยประกอบด้วย:

1. **URL ผลงาน / ลิงก์ปลายทาง (itemUrl) [จำเป็น]:**
   - รองรับทุกลิงก์ เช่น เว็บแอป, ลิงก์ Google Drive, Canva, Figma, YouTube, ลิงก์เกม ฯลฯ
   - มีระบบ Auto-prepend `https://` อัตโนมัติหากผู้ใช้ไม่ได้พิมพ์มา
2. **รูปภาพหน้าปก (Cover Image Upload & Optimization) [จำเป็น]:**
   - รองรับการลากวาง (Drag & Drop) หรือเลือกไฟล์รูปภาพ (JPEG, PNG, WebP)
   - มีระบบ **Client-Side Canvas Compression:** ย่อขนาดรูปภาพใน Browser ก่อนส่ง (Max Width: 1600px, Quality: 82%) แปลงเป็น Base64 อัตโนมัติ ลดขนาดไฟล์จาก 5-10MB เหลือ ~150-300KB เพื่อให้อัปโหลดไว ไม่ติด Timeout และประหยัดพื้นที่ Google Drive
   - แสดงตัวอย่างภาพหน้าปก (Cover Preview) ทันทีหลังเลือกรูป
3. **ระบบหัวข้อข้อมูลแบบ Dynamic (Dynamic Custom Fields with `+` / `-`):**
   - ผู้ใช้สามารถ **กดปุ่ม `➕ เพิ่มหัวข้อ (Add Field)`** และ **`➖ / 🗑️ ลบหัวข้อ (Remove Field)`** ได้อย่างอิสระ
   - แต่ละแถวข้อมูลจะประกอบด้วย 2 ช่อง:
     - ช่องที่ 1: **ชื่อหัวข้อ (Field Label)** เช่น "ชื่อเกม", "ผู้สร้าง", "หมวดหมู่", "คำอธิบายย่อ", "ระดับชั้น"
     - ช่องที่ 2: **ข้อความในหัวข้อ (Field Value)** เช่น "Flappy Bird AI", "ด.ช.สมชาย / คุณครูสาธิต", "วิทยาศาสตร์"
   - **ตัวอย่างการใช้งาน:** หากผู้ใช้ต้องการใส่แค่ "ชื่อเกม" กับ "ผู้สร้าง" ก็กดตั้งไว้แค่ 2 แถว เมื่อกดบันทึก (Save) ระบบจะบันทึกเฉพาะภาพ Cover, URL และข้อมูล 2 บรรทัดนี้ลงฐานข้อมูลทันที
   - มีปุ่ม Reset หรือ Template ค่าเริ่มต้นให้เลือกใช้ได้สะดวก

#### 2.2 หน้าแสดงผลการ์ดผลงาน (Showcase Gallery & Card Grid)
1. **การ์ดแสดงผลสไตล์ Modern Glassmorphism:**
   - **ภาพหน้าปก (Cover Image):** แสดงสัดส่วน 16:9 สวยงาม คมชัด รองรับ Lazy Loading และมี Placeholder Image สำรองกรณีโหลดภาพไม่สำเร็จ
   - **เนื้อหาข้อมูลในการ์ด (Dynamic Lines Display):** วนลูปแสดงผลเฉพาะหัวข้อและข้อความที่มีการบันทึกไว้ (เช่น แสดง 2 บรรทัด: `ชื่อเกม: ...` และ `ผู้สร้าง: ...` หรือกี่บรรทัดก็ได้ตามที่ผู้ใช้สร้างไว้)
   - **ปุ่ม Action:** มีปุ่ม **"🚀 เปิดดูผลงาน / เข้าสู่ลิงก์"** คลิกแล้วเปิด URL ในแท็บใหม่ (`target="_blank" rel="noopener noreferrer"`)
   - ตัวการ์ดทั้งหมดสามารถคลิกเพื่อเปิดไปยังลิงก์ได้โดยตรง
2. **ระบบค้นหาแบบ Real-Time (Search with Debounce):**
   - ช่อง Search รองรับการสืบค้นข้อความจาก "ทุกหัวข้อและทุกข้อความ" ที่บันทึกไว้ในระบบ
3. **ระบบจัดเรียง (Sorting):**
   - รองรับการเรียงตามลำดับที่บันทึก (ล่าสุด / เก่าสุด) หรือเรียงตามหัวข้อแรกแบบพยัญชนะไทย (ก-ฮ) ด้วย `Intl.Collator('th')`

#### 2.3 การจัดการและดูแลระบบ (Management & Moderation)
- รองรับปุ่มแก้ไข (Edit) และปุ่มลบ (Delete) สำหรับผู้ดูแล
- เมื่อลบรายการ จะทำ Soft Delete ใน Google Sheets และสั่งย้ายไฟล์ภาพใน Google Drive ลงถังขยะอัตโนมัติ

---

### 3. ความปลอดภัยและประสิทธิภาพ (SECURITY & RELIABILITY)
1. **Zero Client Secrets:** ห้ามฝัง Credential, Private Key หรือ Password ใดๆ ใน Frontend โค้ดทั้งหมดต้องคุยผ่าน Google Apps Script API Endpoint
2. **Formula Injection Protection:** สแกนและ Sanitize ทุกข้อความในทุก Dynamic Field (ป้องกันอักขระ `=`, `+`, `-`, `@` ที่อาจทำให้เกิด Spreadsheet Injection)
3. **Script Lock Concurrency:** ใช้ `LockService.getScriptLock()` ฝั่ง GAS เฉพาะจังหวะบันทึกแถวลง Sheet (ส่วนการอัปโหลดไฟล์รูปภาพลง Drive ให้ทำนอก Script Lock เพื่อป้องกันคอขวด)
4. **Clean JSON Serialization:** บันทึก Dynamic Fields ในรูปแบบ JSON String ที่ได้มาตรฐาน พร้อมทำ Validation ทั้งฝั่ง Client และ Server

---

### 4. การเชื่อมต่อกับโปรเจกต์อื่น (CROSS-PROJECT INTEGRATION)
- รองรับการเปิดผ่าน Iframe Widget (`?embed=true&collectionId=...`) พร้อมสื่อสารกับหน้าเว็บหลักผ่าน `window.postMessage` เพื่อส่งสถานะการบันทึก หรือปรับความสูงหน้าต่างอัตโนมัติ
- รองรับการเรียกใช้ผ่าน RESTful API (GET / POST) ร่วมกับระบบอื่นๆ ได้โดยตรง
```

---

# ส่วนที่ 2: โครงสร้างข้อมูลยืดหยุ่น (Dynamic Data Schema) & API Contract

เพื่อให้ระบบสามารถรองรับหัวข้อที่กด `+` / `-` ได้อย่างอิสระโดยไม่ต้องแก้โครงสร้างคอลัมน์ของ Google Sheets ทุกครั้งที่มีหัวข้อใหม่ ระบบจะใช้รูปแบบ **Hybrid Schema (Core Columns + JSON Custom Fields)** ดังนี้:

### 1. ตาราง Google Sheets: แท็บ `Items` (หรือ `Showcase`)

| Column | Field Name | Type | Description | ตัวอย่างข้อมูล |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `itemId` | String (UUID) | รหัสประจำรายการ | `item_f47ac10b-58cc-4372` |
| **B** | `collectionId` | String | รหัสหมวด/กลุ่มงาน | `games_collection_01` |
| **C** | `primaryTitle` | String | หัวข้อหลัก (ดึงจากฟิลด์แรกเพื่อใช้ Search/Sort ไว) | `Super AI Adventure` |
| **D** | `itemUrl` | String | URL ลิงก์ปลายทาง | `https://mygame.github.io` |
| **E** | `coverFileId` | String | Google Drive File ID | `1a2B3c4D5e6F...` |
| **F** | `coverUrl` | String | Direct Thumbnail URL จาก Google Drive | `https://drive.google.com/thumbnail?id=...&sz=w1600` |
| **G** | `customFieldsJson` | String (JSON) | **ข้อมูลหัวข้อและเนื้อหาที่กด `+`/`-` บันทึกไว้** | `[{"label":"ชื่อเกม","value":"Super AI"},{"label":"ผู้สร้าง","value":"สมชาย"}]` |
| **H** | `createdAt` | ISO String | วันเวลาที่บันทึก | `2026-09-12T10:00:00.000Z` |
| **I** | `updatedAt` | ISO String | วันเวลาที่แก้ไขล่าสุด | `2026-09-12T10:00:00.000Z` |
| **J** | `deletedAt` | ISO String | วันเวลาที่ลบ (Soft delete) | ว่างไว้ถ้ายังไม่ถูกลบ |

---

### 2. รูปแบบ API Request & Response (Google Apps Script Endpoint)

Google Apps Script Web App URL:
`https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`

#### A. ดึงข้อมูลรายการผลงาน (`action=getItems`)
- **Method:** `GET`
- **Query Params:** `?action=getItems&collectionId=games_collection_01`
- **Response Format (JSON):**
```json
{
  "success": true,
  "data": [
    {
      "itemId": "item_f47ac10b-58cc-4372",
      "collectionId": "games_collection_01",
      "primaryTitle": "Super AI Adventure",
      "itemUrl": "https://mygame.github.io",
      "coverUrl": "https://drive.google.com/thumbnail?id=1a2B3c4D5e...&sz=w1600",
      "fields": [
        { "label": "ชื่อเกม", "value": "Super AI Adventure" },
        { "label": "ผู้สร้าง", "value": "ด.ช.สมชาย ใจดี" }
      ],
      "createdAt": "2026-09-12T10:00:00.000Z"
    }
  ]
}
```

#### B. บันทึกรายการใหม่พร้อม Cover และ Dynamic Fields (`action=saveItem`)
- **Method:** `POST` (Content-Type: `text/plain` เพื่อเลี่ยง Preflight CORS)
- **Request Body (JSON):**
```json
{
  "action": "saveItem",
  "collectionId": "games_collection_01",
  "itemUrl": "https://mygame.github.io",
  "coverBase64": "data:image/webp;base64,UklGRt4AAABXRUJQVlA4...",
  "coverName": "game_cover.webp",
  "fields": [
    { "label": "ชื่อเกม", "value": "Super AI Adventure" },
    { "label": "ผู้สร้าง", "value": "ด.ช.สมชาย ใจดี" }
  ]
}
```
- **Response Format (JSON):**
```json
{
  "success": true,
  "data": {
    "itemId": "item_f47ac10b-58cc-4372",
    "primaryTitle": "Super AI Adventure",
    "coverUrl": "https://drive.google.com/thumbnail?id=1a2B3c4D5e...&sz=w1600",
    "fieldsCount": 2,
    "createdAt": "2026-09-12T10:00:00.000Z"
  }
}
```

---

# ส่วนที่ 3: สถาปัตยกรรมการเชื่อมต่อระหว่างโปรเจกต์ (Cross-Project Integration)

เมื่อนำฟีเจอร์นี้ไปใช้เชื่อมต่อกับโปรเจกต์ใหม่ (เช่น โปรเจกต์ทะเบียนสื่อ, พอร์ทัลโรงเรียน หรือหน้าเว็บอื่นที่มี Tech Stack เดียวกัน) สามารถเชื่อมต่อได้ 3 ช่องทางหลัก:

```
[โปรเจกต์ใหม่ / เว็บแอปอื่น]
        │
        ├─── 1. Iframe Widget Integration (ฝังทั้งหน้าพร้อมปุ่ม + / - และ Gallery)
        │      └─ <iframe src="https://.../?embed=true&collectionId=my_games">
        │
        ├─── 2. Headless API Integration (สร้าง UI หน้าบ้านเองแต่ใช้ Database & Drive ร่วมกัน)
        │      └─ fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload) })
        │
        └─── 3. Shared Database Link (อ่าน Google Sheets แท็บเดียวกันข้ามโปรเจกต์)
```

### 1. โหมด Iframe Widget พร้อมระบบสื่อสาร `postMessage`

โปรเจกต์ใหม่สามารถดึงหน้านี้ไปฝังและรับส่งข้อมูลได้ทันที:

```html
<!-- ในโค้ดของโปรเจกต์ใหม่ -->
<iframe 
  id="showcaseFrame"
  src="https://coolnut-academy.github.io/Hongson-WebApp-Innovators/?embed=true&collectionId=my_games&hideNav=true"
  style="width: 100%; border: none; border-radius: 12px; min-height: 600px;"
  loading="lazy">
</iframe>

<script>
  window.addEventListener('message', function(event) {
    const { type, payload } = event.data || {};
    
    // 1. รับคำสั่งปรับความสูง iframe อัตโนมัติ (ป้องกัน scrollbar ซ้อน)
    if (type === 'SHOWCASE_RESIZE') {
      document.getElementById('showcaseFrame').style.height = payload.height + 'px';
    }
    
    // 2. รับแจ้งเตือนเมื่อมีการบันทึกข้อมูลสำเร็จ
    if (type === 'ITEM_SAVED_SUCCESS') {
      console.log('บันทึกผลงานสำเร็จ:', payload);
      // เช่น ทำการ Refresh หน้าเว็บหลัก หรือแสดงแจ้งเตือน Toast
    }
  });
</script>
```

---

### 2. ระบบดึงภาพหน้าปกอัตโนมัติจาก URL (Auto-Cover Resolver)

กรณีผู้ใช้ใส่ URL โดยไม่ได้อัปโหลดภาพหน้าปก หรือต้องการอำนวยความสะดวก:

```javascript
/**
 * ดึงภาพหน้าปกอัตโนมัติจาก URL
 * รองรับ YouTube, Google Drive Thumbnail
 */
function getAutoCoverThumbnail(url) {
  if (!url) return 'assets/images/placeholder-cover.svg';

  // 1. กรณีเป็น YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // 2. กรณีเป็นไฟล์ภาพบน Google Drive
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1600`;
  }

  return 'assets/images/placeholder-cover.svg';
}
```

---

# ส่วนที่ 4: ชุดโค้ดต้นแบบระบบ Dynamic Fields & Image Optimizer

### 1. ระบบจัดการฟิลด์ข้อมูลแบบ Dynamic (`+` / `-`) ฝั่ง Frontend

```html
<!-- โครงสร้าง HTML ฟอร์ม Dynamic Fields -->
<div class="form-group">
  <label class="form-label">
    <span>📋 ข้อมูลกำกับผลงาน (กด + เพื่อเพิ่มหัวข้อ / กด - เพื่อลบ)</span>
    <button type="button" id="addFieldBtn" class="btn btn-xs btn-secondary">➕ เพิ่มหัวข้อ</button>
  </label>
  <div id="dynamicFieldsContainer" class="dynamic-fields-list">
    <!-- แถวข้อมูลจะถูกสร้างด้วย JavaScript -->
  </div>
</div>
```

```javascript
// JavaScript สำหรับควบคุมการกด + และ - ฟิลด์ข้อมูล
const DynamicFieldsManager = {
  container: null,

  init(containerId) {
    this.container = document.getElementById(containerId);
    // สร้าง 2 แถวเริ่มต้นให้ทันที (เช่น "ชื่อเกม" กับ "ผู้สร้าง")
    this.resetWithDefaults([
      { label: 'ชื่อเกม', value: '' },
      { label: 'ผู้สร้าง', value: '' }
    ]);
  },

  // ฟังก์ชันเพิ่มแถวข้อมูลใหม่
  addFieldRow(label = '', value = '') {
    const row = document.createElement('div');
    row.className = 'dynamic-field-row';
    row.innerHTML = `
      <div class="field-label-wrap">
        <input type="text" class="form-control field-label-input" placeholder="ชื่อหัวข้อ (เช่น ชื่อเกม)" value="${this.escape(label)}" required>
      </div>
      <div class="field-value-wrap">
        <input type="text" class="form-control field-value-input" placeholder="ข้อความ (เช่น Super AI)" value="${this.escape(value)}" required>
      </div>
      <button type="button" class="btn btn-icon btn-danger btn-remove-row" title="ลบหัวข้อนี้">🗑️</button>
    `;

    // ผูก Event ปุ่มลบแถว (-)
    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      // อนุญาตให้ลบได้ แต่ต้องเหลือไว้อย่างน้อย 1 แถว
      if (this.container.querySelectorAll('.dynamic-field-row').length > 1) {
        row.remove();
      } else {
        alert('ต้องมีข้อมูลอย่างน้อย 1 หัวข้อ');
      }
    });

    this.container.appendChild(row);
  },

  // ดึงข้อมูลทั้งหมดในรูปแบบ Array of Objects
  getFieldsData() {
    const rows = this.container.querySelectorAll('.dynamic-field-row');
    const result = [];
    rows.forEach(r => {
      const label = r.querySelector('.field-label-input').value.trim();
      const value = r.querySelector('.field-value-input').value.trim();
      if (label && value) {
        result.push({ label, value });
      }
    });
    return result;
  },

  resetWithDefaults(defaultList) {
    if (!this.container) return;
    this.container.innerHTML = '';
    defaultList.forEach(item => this.addFieldRow(item.label, item.value));
  },

  escape(str) {
    return String(str || '').replace(/"/g, '&quot;');
  }
};
```

---

### 2. การเรนเดอร์การ์ดผลงานตามข้อมูล Dynamic Fields

```javascript
/**
 * เรนเดอร์การ์ดผลงานลง Gallery Grid
 * แสดง Cover + วนลูปแสดงข้อมูลทุกบรรทัดที่บันทึกไว้ + ปุ่มเปิดลิงก์
 */
function renderItemCard(item) {
  const card = document.createElement('div');
  card.className = 'showcase-card';

  // สร้าง HTML สำหรับแสดงบรรทัดข้อมูลที่บันทึกไว้ (เช่น 2 บรรทัด)
  const fieldsHtml = (item.fields || []).map(f => `
    <div class="card-meta-line">
      <span class="meta-label font-bold">${escapeHtml(f.label)}:</span>
      <span class="meta-value">${escapeHtml(f.value)}</span>
    </div>
  `).join('');

  card.innerHTML = `
    <div class="card-cover-wrapper">
      <img src="${item.coverUrl || 'assets/images/placeholder-cover.svg'}" 
           alt="Cover" 
           class="card-cover-img" 
           loading="lazy" 
           onerror="this.src='assets/images/placeholder-cover.svg'">
    </div>
    <div class="card-body">
      <div class="card-meta-group">
        ${fieldsHtml}
      </div>
      <div class="card-actions">
        <a href="${escapeHtml(item.itemUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-block">
          🚀 เปิดดูผลงาน
        </a>
      </div>
    </div>
  `;

  return card;
}
```

---

### 3. โค้ดบันทึกข้อมูลฝั่ง Google Apps Script (`Code.gs`)

```javascript
/**
 * บันทึกข้อมูลรายการใหม่พร้อม Cover และ Dynamic Fields JSON
 */
function handleSaveItem(payload) {
  if (!payload.itemUrl || !payload.itemUrl.startsWith('http')) {
    throw new Error('กรุณาระบุ URL ผลงานที่ถูกต้อง');
  }
  if (!payload.coverBase64) {
    throw new Error('กรุณาอัปโหลดรูปภาพหน้าปก');
  }
  if (!payload.fields || !Array.isArray(payload.fields) || payload.fields.length === 0) {
    throw new Error('ต้องระบุข้อมูลอย่างน้อย 1 หัวข้อ');
  }

  // 1. อัปโหลดรูปภาพลง Google Drive (ทำนอก Lock)
  var folderId = Config.getUploadFolderId();
  var coverInfo = DriveModule.uploadBase64Image(folderId, payload.coverBase64, payload.coverName);

  // 2. ล็อกสคริปต์เพื่อบันทึกข้อมูลลง Google Sheets อย่างปลอดภัย
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Items') || ss.insertSheet('Items');
    var itemId = 'item_' + Utilities.getUuid();
    var now = new Date().toISOString();

    // ป้องกัน Formula Injection
    var sanitize = function(val) {
      var s = String(val || '');
      return /^[=+\-@]/.test(s) ? "'" + s : s;
    };

    // Sanitize ทุกฟิลด์ใน Array
    var sanitizedFields = payload.fields.map(function(f) {
      return {
        label: sanitize(f.label),
        value: sanitize(f.value)
      };
    });

    // ใช้ค่าของฟิลด์แรกเป็น Title หลักสำหรับ Search/Sort
    var primaryTitle = sanitizedFields[0] ? sanitizedFields[0].value : 'Untitled';

    var newRow = [
      itemId,
      payload.collectionId || 'default',
      primaryTitle,
      payload.itemUrl.trim(),
      coverInfo.fileId,
      coverInfo.thumbnailUrl,
      JSON.stringify(sanitizedFields), // เก็บเป็น JSON string
      now,
      now,
      '' // deletedAt
    ];

    sheet.appendRow(newRow);

    return {
      success: true,
      data: {
        itemId: itemId,
        primaryTitle: primaryTitle,
        coverUrl: coverInfo.thumbnailUrl,
        fieldsCount: sanitizedFields.length,
        createdAt: now
      }
    };
  } finally {
    lock.releaseLock();
  }
}
```

---

# ส่วนที่ 5: เกณฑ์การตรวจรับงาน (Acceptance Criteria)

เมื่อ AI ในโปรเจกต์ใหม่นำสเปกนี้ไปพัฒนา สามารถตรวจรับงานตามรายการต่อไปนี้:

- [ ] **การเพิ่ม/ลดหัวข้อ (`+`/`-`):** ผู้ใช้สามารถกดปุ่ม `➕ เพิ่มหัวข้อ` เพื่อเพิ่มแถวข้อมูล และกด `🗑️ / ➖` เพื่อลบแถวที่ไม่ต้องการได้ลื่นไหล
- [ ] **ความยืดหยุ่นของจำนวนบรรทัด:** สามารถบันทึกข้อมูลที่มีเพียง 2 บรรทัด (เช่น ชื่อเกม + ผู้สร้าง) หรือ 3-5 บรรทัดได้ โดยการ์ดหน้าบ้านจะแสดงผลเฉพาะบรรทัดที่บันทึกไว้จริง
- [ ] **การอัปโหลด Cover และย่อภาพ:** เลือกไฟล์รูปภาพขนาดใหญ่ (>5MB) แล้วระบบย่อขนาดผ่าน Canvas เหลือ <300KB และอัปโหลดขึ้น Google Drive ได้สำเร็จ
- [ ] **การแสดงผลการ์ด:** การ์ดผลงานแสดงภาพ Cover คมชัด แสดงข้อมูลหัวข้อและเนื้อหาจัดวางสวยงาม และมีปุ่มคลิกเปิด URL ในแท็บใหม่
- [ ] **การสืบค้นข้อมูล:** ช่องค้นหาสามารถค้นเจอข้อมูลที่อยู่ในฟิลด์ใดๆ ของ Dynamic Fields ได้อย่างแม่นยำ
- [ ] **การเชื่อมต่อกับระบบอื่น:** สามารถนำหน้าแสดงผลไปฝังในโปรเจกต์อื่นผ่าน Iframe พร้อมรองรับ Auto-resize หรือเรียกผ่าน REST API ได้
