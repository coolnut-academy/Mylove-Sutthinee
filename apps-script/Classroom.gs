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
    const documents = Sheets.getTable('CLASSROOM_DOCUMENTS').filter(d => String(d.year) === y && !d.archived);

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
    const studentId = student.id;
    if (studentId) {
      student.updated_at = new Date().toISOString();
      Sheets.updateRow('STUDENTS', 'id', studentId, student);
      return student;
    } else {
      student.id = Utils.generateId('std');
      student.created_at = new Date().toISOString();
      student.updated_at = new Date().toISOString();
      student.status = student.status || 'active';
      Sheets.appendRow('STUDENTS', student);
      return student;
    }
  },

  saveDocument: function(doc) {
    const docId = doc.id;
    if (docId) {
      doc.updated_at = new Date().toISOString();
      Sheets.updateRow('CLASSROOM_DOCUMENTS', 'id', docId, doc);
      return doc;
    } else {
      doc.id = Utils.generateId('cls_doc');
      doc.created_at = new Date().toISOString();
      doc.updated_at = new Date().toISOString();
      doc.published = true;
      doc.archived = false;
      Sheets.appendRow('CLASSROOM_DOCUMENTS', doc);
      return doc;
    }
  }
};
