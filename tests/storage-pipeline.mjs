import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Sheet {
  constructor(rows = []) { this.rows = rows; this.columns = 12; }
  getLastRow() { return this.rows.length; }
  getMaxColumns() { return this.columns; }
  insertColumnsAfter(n, count) { this.columns += count; }
  getDataRange() { return { getValues: () => this.rows.length ? this.rows.map(r => [...r]) : [['']] }; }
  appendRow(row) { this.rows.push([...row]); }
  getRange(r, c, h, w) {
    assert.ok(c + w - 1 <= this.columns, 'write stays inside sheet grid');
    return { setValues: values => values.forEach((row, i) => {
      this.rows[r - 1 + i] ||= [];
      row.forEach((val, j) => { this.rows[r - 1 + i][c - 1 + j] = val; });
    }) };
  }
}
const tabs = new Map();
const spreadsheet = { getSheetByName: name => tabs.get(name), insertSheet: name => {
  const sheet = new Sheet(); tabs.set(name, sheet); return sheet;
} };
const context = vm.createContext({ console, CONFIG: {
  getSpreadsheetId: () => 'database', getRootDriveFolderId: () => ''
}, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }, SpreadsheetApp: { openById: () => spreadsheet, flush() {} }, Logger: { log() {} } });
for (const name of ['Utils', 'Sheets', 'Drive', 'Classroom', 'PA', 'Upload']) {
  vm.runInContext(fs.readFileSync(`apps-script/${name}.gs`, 'utf8') + `\nglobalThis.${name} = ${name};`, context);
}
const { Sheets, Classroom, PA, Drive, Upload } = context;
tabs.set('CLASSROOM_DOCUMENTS', new Sheet([['id', 'year', 'category', 'archived', 'published', 'title'],
  ['old', 2567, 'students', 'FALSE', 'TRUE', 'Existing member'],
  ['hidden', 2567, 'students', 'TRUE', 'TRUE', 'Archived member']]));
assert.equal(Classroom.getData(2567).documents.length, 1, 'text FALSE must remain visible');
const required = ['id', 'year', 'category', 'cover_url', 'fields', 'item_url'];
Sheets.ensureHeaders('CLASSROOM_DOCUMENTS', required);
Sheets.ensureHeaders('CLASSROOM_DOCUMENTS', required);
assert.equal(Sheets.getTable('CLASSROOM_DOCUMENTS')[0].title, 'Existing member');
assert.equal(tabs.get('CLASSROOM_DOCUMENTS').rows[0].filter(x => x === 'cover_url').length, 1);
for (const category of ['students', 'attendance', 'teeth', 'milk', 'growth', 'health', 'sdq', 'pp', 'media', 'plc', 'research', 'plan', 'awards', 'sar', 'other']) {
  assert.equal(Drive.getFeaturePath({ module: 'classroom', category }), `CLASSROOM/${category}`);
  const saved = Classroom.saveDocument({ year: '2567', category, title: category, cover_url: 'https://example.org/image',
    fields: [{ label: 'Name', value: category }], published: true, archived: false });
  assert.ok(Classroom.getData(2567).documents.some(x => x.id === saved.id && x.category === category));
  assert.equal(saved._persisted, true);
  const count = Classroom.getData(2567).documents.length;
  Classroom.saveDocument({ ...saved, title: category + ' updated' });
  assert.equal(Classroom.getData(2567).documents.length, count, 'retry preserves the same record ID');
}
assert.equal(Drive.getFeaturePath({ sectionCode: '2.3' }), 'PA/2.3');
assert.throws(() => Drive.getRootFolder(), /ROOT_DRIVE_FOLDER_ID/);
assert.throws(() => Drive.getFeaturePath({ module: 'classroom', category: '../wrong' }));
assert.throws(() => Drive.getYearFolder(undefined), /4/);
const paths = [];
Drive.saveFile = payload => {
  paths.push(payload.subfolder);
  return { fileId: 'file1', thumbnailUrl: 'https://example.org/thumb', url: 'https://example.org/file', size: 1, mimeType: 'image/png' };
};
const upload = Upload.handleUpload({ year: '2567', name: 'cover.png', module: 'classroom', category: 'students', mimeType: 'image/png', base64Data: 'YQ==', skipSheetInsert: true });
assert.equal(paths.at(-1), 'CLASSROOM/students');
assert.equal(upload.item.drive_file_id, 'file1');
assert.equal(tabs.has('PA_ITEMS'), false, 'cover-only uploads must not create PA records');
Drive.saveFile = () => { throw new Error('Drive unavailable'); };
const before = tabs.get('CLASSROOM_DOCUMENTS').rows.length;
assert.throws(() => Classroom.saveDocument({ year: '2567', category: 'students', cover_url: 'data:image/png;base64,YQ==' }), /Drive unavailable/);
assert.throws(() => PA.saveItem({ year: '2567', section_code: '1.1', file_data: 'YQ==' }), /Drive unavailable/);
assert.equal(tabs.get('CLASSROOM_DOCUMENTS').rows.length, before, 'failed upload never saves a fallback record');

const { ClassroomRepository } = await import('../js/data/repositories.js');
const payload = { year: '2567', category: 'students', title: 'Member' };
const saved = { ...payload, id: 'member-1' };
const repo = new ClassroomRepository({ saveClassroomDocument: async () => saved, getItem: async () => saved });
assert.equal((await repo.saveDocument(payload)).id, saved.id);
repo.provider.getItem = async () => null;
await assert.rejects(() => repo.saveDocument(payload), error => error.savedItem.id === saved.id);
repo.provider.saveClassroomDocument = async () => ({ success: true });
await assert.rejects(() => repo.saveDocument(payload), /Apps Script/);
repo.provider.saveClassroomDocument = async () => ({ ...saved, _persisted: true });
repo.provider.getItem = async () => { throw Error('This redundant network read must not happen'); };
assert.equal((await repo.saveDocument(payload)).id, saved.id);
console.log('Storage pipeline tests passed: legacy schema, 15 classroom categories, PA routing, upload failures, readback verification.');

// Exercise the actual modal orchestration without contacting production.
const { UniversalItemModal: Modal } = await import('../js/components/universal-item-modal.js');
const { AppState } = await import('../js/app-state.js');
const { DataProvider } = await import('../js/data-provider.js');
const { Toast } = await import('../js/toast.js');
globalThis.document = { getElementById: () => null };
AppState.session = { token: 'test-session' };
let successes = 0, errors = 0, writes = 0, refreshes = 0;
Toast.success = () => successes++;
Toast.error = () => errors++;
Modal._getFieldsData = () => [{ label: 'Name', value: 'Member' }];
Modal.close = () => {};
Modal.currentContext = { module: 'classroom', year: '2567', category: 'students', onSaveSuccess: async () => { refreshes++; } };
Modal.state = { selectedType: 'link', coverBase64: 'data:image/png;base64,YQ==' };
DataProvider.classroom.saveDocument = async data => { writes++; return { ...data, id: 'verified-id' }; };
DataProvider.file.uploadFile = async () => { throw new Error('Simulated Drive failure'); };
const originalError = console.error;
console.error = () => {};
try {
  await Modal._handleSave();
  assert.equal(writes, 0);
  assert.equal(successes, 0);
  assert.equal(errors, 1);
  DataProvider.file.uploadFile = async payload => {
    assert.equal(payload.module, 'classroom');
    assert.equal(payload.category, 'students');
    assert.equal(payload.skipSheetInsert, true);
    return { item: { drive_file_id: 'cover-id', thumbnail_url: 'https://example.org/cover' } };
  };
  await Modal._handleSave();
  assert.equal(writes, 1);
  assert.equal(successes, 1);
  assert.equal(refreshes, 1);
  Modal.state.coverPending = true;
  await Modal._handleSave();
  assert.equal(writes, 1, 'pending image prevents save');
} finally { console.error = originalError; }
console.log('Modal regression tests passed: failed Drive upload blocks success and sheet write; successful save refreshes; image preparation blocks premature save.');
