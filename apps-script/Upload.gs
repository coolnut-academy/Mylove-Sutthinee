/**
 * File Upload Handler
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const Upload = {
  handleUpload: function(payload) {
    const name = payload.name;
    const year = payload.year || '2569';
    const sectionCode = payload.sectionCode || '1.1';
    const mimeType = payload.mimeType || payload.type || 'application/octet-stream';
    const base64Data = payload.base64Data;

    if (!name) throw new Error('File name is required');
    if (!base64Data) throw new Error('Base64 file data is required');

    // Save file into Drive
    const driveRes = Drive.saveFile({
      name: name,
      mimeType: mimeType,
      base64Data: base64Data,
      year: year,
      subfolder: 'PA'
    });

    const isImage = mimeType.indexOf('image') !== -1;
    const isPdf = mimeType.indexOf('pdf') !== -1;

    // Insert record in PA_ITEMS sheet
    const newItem = {
      id: Utils.generateId('pa_item'),
      year: year,
      section_code: sectionCode,
      title: name.replace(/\.[^/.]+$/, ""),
      description: 'อัปโหลดผ่านระบบ Suttinee Workspace',
      type: isImage ? 'image' : (isPdf ? 'pdf' : 'file'),
      drive_file_id: driveRes.fileId,
      external_url: driveRes.url,
      mime_type: driveRes.mimeType,
      file_size: driveRes.size,
      sort_order: 1,
      published: true,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    Sheets.appendRow('PA_ITEMS', newItem);

    return {
      success: true,
      item: newItem
    };
  }
};
