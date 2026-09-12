/**
 * Classroom Administration Business Logic
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Classroom = {
  getData: function(year) {
    const y = String(year);
    const students = Sheets.getTable('STUDENTS').filter(s => String(s.year) === y);
    const attendance = Sheets.getTable('ATTENDANCE').filter(a => String(a.year) === y);
    const routines = Sheets.getTable('DAILY_ROUTINES').filter(r => String(r.year) === y);
    const health = Sheets.getTable('HEALTH').filter(h => String(h.year) === y);
    const sdq = Sheets.getTable('SDQ').filter(q => String(q.year) === y);
    const documents = Sheets.getTable('CLASSROOM_DOCUMENTS')
      .filter(d => String(d.year) === y && !d.archived)
      .map(function(doc) {
        if (typeof doc.fields === 'string' && doc.fields.indexOf('[') === 0) {
          try { doc.fields = JSON.parse(doc.fields); } catch(e) {}
        }
        return doc;
      });

    return {
      students: students,
      attendance: attendance,
      routines: routines,
      health: health,
      sdq: sdq,
      documents: documents
    };
  },

  saveStudent: function(student) {
    let updated = false;
    if (student.id) {
      student.updated_at = new Date().toISOString();
      updated = Sheets.updateRow('STUDENTS', 'id', student.id, student);
    }
    if (!updated) {
      if (!student.id) student.id = Utils.generateId('std');
      if (!student.created_at) student.created_at = new Date().toISOString();
      student.updated_at = new Date().toISOString();
      student.status = student.status || 'active';
      Sheets.appendRow('STUDENTS', student);
    }
    return student;
  },

  saveDocument: function(doc) {
    // 💡 จัดการอัปโหลด Cover สู่ Google Drive หากส่งมาเป็น base64
    if (doc.cover_url && doc.cover_url.indexOf('data:image/') === 0) {
      try {
        const parts = doc.cover_url.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const base64Data = parts[1];
        const driveRes = Drive.saveFile({
          name: ((doc.title || 'classroom_cover') + '_cover_' + Date.now()).replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, '_') + (mimeType.indexOf('png') !== -1 ? '.png' : '.jpg'),
          mimeType: mimeType,
          base64Data: base64Data,
          year: doc.year,
          subfolder: Drive.getFeaturePath(Object.assign({}, doc, { module: 'classroom' }))
        });
        doc.cover_url = driveRes.thumbnailUrl || driveRes.url;
      } catch (e) {
        throw new Error('?????????????????????????: ' + e.message);
      }
    }

    // 💡 จัดการอัปโหลดไฟล์เอกสารสู่ Google Drive หากมี file_data base64
    if (doc.file_data) {
      try {
        let rawB64 = doc.file_data;
        let mime = doc.type === 'ebook' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        if (rawB64.indexOf('data:') === 0) {
          const parts = rawB64.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          if (mimeMatch) mime = mimeMatch[1];
          rawB64 = parts[1];
        }
        const driveRes = Drive.saveFile({
          name: doc.file_name || (((doc.title || 'classroom_doc') + (doc.type === 'ebook' ? '.pdf' : '.xlsx')).replace(/[^a-zA-Z0-9_\u0E00-\u0E7F.]/g, '_')),
          mimeType: mime,
          base64Data: rawB64,
          year: doc.year,
          subfolder: Drive.getFeaturePath(Object.assign({}, doc, { module: 'classroom' }))
        });
        doc.drive_file_id = driveRes.fileId;
        doc.external_url = driveRes.previewUrl || driveRes.url;
        doc.item_url = driveRes.previewUrl || driveRes.url;
        doc.thumbnail_url = driveRes.thumbnailUrl;
      } catch (e) {
        throw new Error('??????????????????????: ' + e.message);
      }
      // 💡 ลบ base64 ขนาดใหญ่ทิ้ง ป้องกันไม่ให้เกินโควตา 50,000 ตัวอักษรต่อเซลล์ใน Google Sheets
      delete doc.file_data;
    }

    // 💡 แปลง fields เป็น JSON string
    if (doc.fields && typeof doc.fields !== 'string') {
      try {
        doc.fields = JSON.stringify(doc.fields);
      } catch (e) {
        doc.fields = '[]';
      }
    }

    // 💡 Upsert
    return Sheets.saveVerified('CLASSROOM_DOCUMENTS', doc, 'cls_doc');
  }
};
