/**
 * Zero-Dependency Client-Side Image & File Utilities
 * Suttinee Teacher Workspace
 * Features: Canvas Image Resizing, WebP/JPEG Compression, Base64 Conversion
 */

/**
 * บีบอัดและปรับขนาดไฟล์ภาพด้วย HTML5 Canvas บนเบราว์เซอร์
 * @param {File} file - ไฟล์รูปภาพจาก input
 * @param {Object} options - { maxWidth: 1600, maxHeight: 1200, quality: 0.82 }
 * @returns {Promise<{base64: string, mimeType: string, name: string, width: number, height: number, size: number}>}
 */
export async function compressImage(file, options = {}) {
  const maxWidth = options.maxWidth || 1600;
  const maxHeight = options.maxHeight || 1200;
  const quality = options.quality || 0.82;

  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพที่รองรับ');
  }

  // หากเป็น SVG ไม่ต้องบีบอัดผ่าน Canvas
  if (file.type === 'image/svg+xml') {
    const base64 = await readFileAsBase64(file);
    return {
      base64,
      mimeType: file.type,
      name: file.name,
      width: 0,
      height: 0,
      size: file.size
    };
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // ปรับขนาดตาม Aspect Ratio
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

      // ลองส่งออกเป็น WebP ก่อน (fallback เป็น JPEG)
      let mimeType = 'image/webp';
      let dataUrl = canvas.toDataURL(mimeType, quality);

      if (!dataUrl.startsWith('data:image/webp')) {
        mimeType = 'image/jpeg';
        dataUrl = canvas.toDataURL(mimeType, quality);
      }

      const base64 = dataUrl.split(',')[1] || '';
      const cleanName = file.name.replace(/\.[^/.]+$/, '') + (mimeType === 'image/webp' ? '.webp' : '.jpg');
      const estimatedSize = Math.round((base64.length * 3) / 4);

      resolve({
        base64,
        mimeType,
        name: cleanName,
        width,
        height,
        size: estimatedSize
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ไม่สามารถประมวลผลไฟล์ภาพได้: ' + (err.message || 'รูปแบบไฟล์ไม่ถูกต้อง')));
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
 * ตรวจสอบและเตรียม Payload สำหรับอัปโหลดไฟล์ไปยัง Apps Script
 * @param {File} file
 * @param {Object} metadata - { year, sectionCode, title, ... }
 * @returns {Promise<Object>}
 */
export async function prepareUploadPayload(file, metadata = {}) {
  if (!file) throw new Error('ไม่พบข้อมูลไฟล์สำหรับอัปโหลด');

  const isImage = file.type && file.type.startsWith('image/');

  if (isImage) {
    const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1200, quality: 0.82 });
    return {
      name: compressed.name,
      mimeType: compressed.mimeType,
      type: 'image',
      size: compressed.size,
      base64Data: compressed.base64,
      ...metadata
    };
  } else {
    const base64 = await readFileAsBase64(file);
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
