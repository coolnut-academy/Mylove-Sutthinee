/**
 * Zero-Dependency Client-Side Image & File Utilities
 * Suttinee Teacher Workspace
 * Features: Canvas Image Resizing, WebP/JPEG Compression, A4 Bound Check, Progress %, Base64 Conversion
 */

/**
 * Standard A4 Dimensions at 150 DPI (Standard for Web & Google Drive Documents)
 * Portrait: 1240 x 1754 px
 * Landscape: 1754 x 1240 px
 */
export const A4_DIMENSIONS = {
  MAX_LONG: 1754,
  MAX_SHORT: 1240
};

/**
 * บีบอัดและปรับขนาดไฟล์ภาพด้วย HTML5 Canvas บนเบราว์เซอร์ของฝั่งผู้ใช้ (Client-Side)
 * - กำหนดขนาดภาพสูงสุดไม่เกินขนาดกระดาษ A4 (1240 x 1754 px ที่ 150 DPI)
 * - รองรับ onProgress callback เพื่อแสดงเปอร์เซ็นต์ความคืบหน้า (%)
 * - ส่งออกทั้ง dataUrl สำหรับแสดงผลบนเว็บ และ base64 บริสุทธิ์สำหรับส่งขึ้น Google Drive
 * 
 * @param {File} file - ไฟล์รูปภาพจาก input
 * @param {Object} options - { maxWidth, maxHeight, quality: 0.82, onProgress: (percent, status) => void }
 * @returns {Promise<{dataUrl: string, base64: string, mimeType: string, name: string, width: number, height: number, size: number, originalSize: number, savedPercent: number}>}
 */
export async function compressImage(file, options = {}) {
  const quality = options.quality !== undefined ? options.quality : 0.82;
  const onProgress = options.onProgress;

  const reportProgress = async (pct, status) => {
    if (typeof onProgress === 'function') {
      try {
        onProgress(pct, status);
      } catch (e) {
        console.warn('Error in onProgress callback:', e);
      }
    }
    // Yield execution to event loop so browser repaints DOM and updates UI %
    await new Promise(r => setTimeout(r, 45));
  };

  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพที่รองรับ');
  }

  await reportProgress(15, 'กำลังโหลดและอ่านไฟล์ภาพจากเครื่อง...');

  // หากเป็น SVG ไม่ต้องบีบอัดผ่าน Canvas
  if (file.type === 'image/svg+xml') {
    const rawBase64 = await readFileAsBase64(file);
    await reportProgress(100, 'ประมวลผลเวกเตอร์ SVG สำเร็จ');
    const fullDataUrl = `data:image/svg+xml;base64,${rawBase64}`;
    return {
      dataUrl: fullDataUrl,
      base64: rawBase64,
      mimeType: file.type,
      name: file.name,
      width: 0,
      height: 0,
      size: file.size,
      originalSize: file.size,
      savedPercent: 0
    };
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      try {
        await reportProgress(35, 'กำลังวิเคราะห์ขนาดและคำนวณมาตรฐาน A4...');

        let { width, height } = img;

        // คำนวณขอบเขตขนาดมาตรฐาน A4
        // แนวนอน (Landscape): กว้างสูงสุด 1754, สูงสูงสุด 1240
        // แนวตั้ง (Portrait): กว้างสูงสุด 1240, สูงสูงสุด 1754
        let maxA4Width = A4_DIMENSIONS.MAX_LONG;
        let maxA4Height = A4_DIMENSIONS.MAX_SHORT;

        if (height > width) {
          maxA4Width = A4_DIMENSIONS.MAX_SHORT;
          maxA4Height = A4_DIMENSIONS.MAX_LONG;
        }

        // นำค่า option ที่ระบุมาผสาน (แต่ต้องไม่เกินขอบเขต A4)
        const effectiveMaxWidth = options.maxWidth ? Math.min(options.maxWidth, maxA4Width) : maxA4Width;
        const effectiveMaxHeight = options.maxHeight ? Math.min(options.maxHeight, maxA4Height) : maxA4Height;

        // ปรับขนาดตาม Aspect Ratio
        if (width > effectiveMaxWidth || height > effectiveMaxHeight) {
          const ratio = Math.min(effectiveMaxWidth / width, effectiveMaxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        await reportProgress(60, `ปรับขนาดเป็น ${width}x${height}px (ไม่เกิน A4)...`);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        await reportProgress(85, 'กำลังบีบอัดภาพ WebP/JPEG คุณภาพสูง...');

        // ตรวจสอบการรองรับ WebP ก่อน (fallback เป็น JPEG)
        let mimeType = 'image/webp';
        let dataUrl = canvas.toDataURL(mimeType, quality);

        if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
          mimeType = 'image/jpeg';
          dataUrl = canvas.toDataURL(mimeType, quality);
        }

        const base64 = dataUrl.split(',')[1] || '';
        const cleanName = file.name.replace(/\.[^/.]+$/, '') + (mimeType === 'image/webp' ? '.webp' : '.jpg');
        const estimatedSize = Math.round((base64.length * 3) / 4);
        const savedPercent = file.size > 0 ? Math.max(0, Math.round((1 - estimatedSize / file.size) * 100)) : 0;

        await reportProgress(100, `บีบอัดสำเร็จ (ลดขนาด ${savedPercent}%)`);

        resolve({
          dataUrl,       // Full Data URL พร้อม header 'data:image/...;base64,' สำหรับพรีวิวและ <img src>
          base64,        // Base64 บริสุทธิ์สำหรับ Payload ส่งขึ้น Apps Script / Drive
          mimeType,
          name: cleanName,
          width,
          height,
          size: estimatedSize,
          originalSize: file.size,
          savedPercent
        });
      } catch (procErr) {
        reject(new Error('เกิดข้อผิดพลาดขณะปรับแต่งภาพ: ' + procErr.message));
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ไม่สามารถประมวลผลไฟล์ภาพได้: ' + (err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง')));
    };

    img.src = objectUrl;
  });
}

/**
 * อ่านไฟล์ทั่วไป (PDF, Word, etc.) เป็น Base64 String บริสุทธิ์
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === 'string') {
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      } else {
        reject(new Error('ไม่สามารถอ่านข้อมูลไฟล์ได้'));
      }
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsDataURL(file);
  });
}

/**
 * ตรวจสอบและเตรียม Payload สำหรับอัปโหลดไฟล์ไปยัง Apps Script / Google Drive
 * @param {File} file
 * @param {Object} metadata - { year, sectionCode, title, ... }
 * @param {Function} onProgress - callback แจ้ง %
 * @returns {Promise<Object>}
 */
export async function prepareUploadPayload(file, metadata = {}, onProgress = null) {
  if (!file) throw new Error('ไม่พบข้อมูลไฟล์สำหรับอัปโหลด');

  const isImage = file.type && file.type.startsWith('image/');

  if (isImage) {
    const compressed = await compressImage(file, {
      quality: 0.82,
      onProgress
    });
    return {
      name: compressed.name,
      mimeType: compressed.mimeType,
      type: 'image',
      size: compressed.size,
      base64Data: compressed.base64,
      dataUrl: compressed.dataUrl,
      width: compressed.width,
      height: compressed.height,
      ...metadata
    };
  } else {
    if (typeof onProgress === 'function') onProgress(50, 'กำลังอ่านไฟล์เอกสาร...');
    const base64 = await readFileAsBase64(file);
    if (typeof onProgress === 'function') onProgress(100, 'อ่านไฟล์เอกสารสำเร็จ');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    return {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      type: isPdf ? 'pdf' : 'file',
      size: file.size,
      base64Data: base64,
      ...metadata
    };
  }
}
