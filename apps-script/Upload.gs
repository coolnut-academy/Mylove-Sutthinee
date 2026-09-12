/**
 * File Upload Handler (Production-Ready Architecture)
 * Suttinee Teacher Workspace — Apps Script Backend
 * Features: Parallel Drive Upload, Atomic Sheet Lock with SpreadsheetApp.flush(), Orphan Rollback
 */

const Upload = {
  handleUpload: function(payload) {
    const name = payload.name;
    const year = payload.year;
    const sectionCode = payload.sectionCode || '1.1';
    const mimeType = payload.mimeType || payload.type || 'application/octet-stream';
    const base64Data = payload.base64Data;
    const skipSheetInsert = payload.skipSheetInsert === true || payload.onlyFile === true;

    if (!name) throw new Error('File name is required');
    if (!base64Data) throw new Error('Base64 file data is required');

    let uploadedFileId = null;

    try {
      // -------------------------------------------------------------
      // ขั้นที่ 1: อัปโหลดภาพ/ไฟล์ขึ้น Google Drive (ทำนอก ScriptLock ขนานได้หลายคนพร้อมกัน)
      // -------------------------------------------------------------
      const driveRes = Drive.saveFile({
        name: name,
        mimeType: mimeType,
        base64Data: base64Data,
        year: year,
        subfolder: Drive.getFeaturePath(payload)
      });
      uploadedFileId = driveRes.fileId;

      const isImage = mimeType.indexOf('image') !== -1;
      const isPdf = mimeType.indexOf('pdf') !== -1;

      // 💡 เลือกลิงก์ที่เหมาะสม: หากเป็นภาพ ใช้ Google CDN Thumbnail เพื่อไม่ให้ Broken Image
      const displayUrl = isImage ? driveRes.thumbnailUrl : (isPdf ? driveRes.previewUrl : driveRes.url);

      const newItem = {
        id: Utils.generateId('pa_item'),
        year: year,
        section_code: sectionCode,
        title: name.replace(/\.[^/.]+$/, ""),
        description: 'อัปโหลดผ่านระบบ Suttinee Workspace',
        type: isImage ? 'image' : (isPdf ? 'pdf' : 'file'),
        drive_file_id: driveRes.fileId,
        external_url: displayUrl,
        thumbnail_url: driveRes.thumbnailUrl,
        drive_url: driveRes.url,
        mime_type: driveRes.mimeType,
        file_size: driveRes.size,
        sort_order: 1,
        published: true,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // -------------------------------------------------------------
      // -------------------------------------------------------------
      // ขั้นที่ 2: บันทึกข้อมูลลงชีต (เฉพาะเมื่อไม่ได้ระบุ skipSheetInsert)
      // -------------------------------------------------------------
      if (!skipSheetInsert) {
        const lock = LockService.getScriptLock();
        const hasLock = lock.tryLock(30000);

        if (!hasLock) {
          throw new Error('ระบบกำลังบันทึกข้อมูลของผู้ใช้อื่นอยู่ กรุณารอสักครู่แล้วลองใหม่');
        }

        try {
          const targetTable = payload.module === 'classroom' ? 'CLASSROOM_DOCUMENTS' : 'PA_ITEMS';
          if (payload.module === 'classroom') newItem.category = payload.category;
          Sheets.appendRow(targetTable, newItem);

          // 💡 บังคับให้ Google Sheets บันทึกข้อมูลลงดิสก์ทันทีก่อนปลดล็อก (ป้องกัน Race Condition)
          SpreadsheetApp.flush();
        } finally {
          lock.releaseLock();
        }
      }

      return {
        success: true,
        item: newItem
      };

    } catch (err) {
      // 💡 Orphan Rollback: หากการบันทึกล้มเหลว ให้ลบไฟล์ขยะใน Google Drive ทิ้งทันที
      if (uploadedFileId) {
        Drive.deleteFile(uploadedFileId);
      }
      throw err;
    }
  }
};
