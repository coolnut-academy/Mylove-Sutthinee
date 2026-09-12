import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { SettingsRepository } from '../js/data/repositories.js';
import { AppState } from '../js/app-state.js';

let writes = 0, maxRows = 6;
let rows = [['extra', 'value', 'key', 'updated_at'], ['=1+1', 'old-image', 'profile_image', 'old-time'], ['', 'Keep', 'school_name', 'old-time'], ['', '', '', ''], ['', 'Keep too', 'other', 'old-time']];
const sheet = {
  getLastRow: () => rows.length, getMaxColumns: () => 4,
  getMaxRows: () => maxRows, insertRowsAfter: (at, count) => { maxRows += count; },
  getDataRange: () => ({
    getValues: () => rows.map(row => row.map(v => v === '=1+1' ? 2 : v)),
    getFormulas: () => rows.map(row => row.map(v => v === '=1+1' ? v : ''))
  }),
  getRange: (r, c, h, w) => ({ setValues: values => {
    assert.ok(r + h - 1 <= maxRows);
    writes++;
    values.forEach((row, i) => row.forEach((v, j) => {
      assert.ok(String(v).length <= 50000, 'no oversized Sheets cell');
      rows[r - 1 + i] ||= Array(4).fill(''); rows[r - 1 + i][c - 1 + j] = v;
    }));
  } })
};
const uploads = [], removed = [];
let failUpload = 0;
const context = vm.createContext({ console, CONFIG: { getSpreadsheetId: () => 'test', getDefaultYear: () => '2567' },
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Drive: { saveFile: payload => {
    uploads.push(payload);
    if (failUpload && uploads.length === failUpload) throw Error('Drive failed');
    return { fileId: 'file-' + uploads.length, thumbnailUrl: 'https://drive.google.com/thumbnail?id=file-' + uploads.length };
  }, deleteFile: id => removed.push(id) }
});
for (const file of ['Utils', 'Sheets', 'Admin']) vm.runInContext(fs.readFileSync(`apps-script/${file}.gs`, 'utf8') + `\nglobalThis.${file}=${file};`, context);
const bigImage = 'data:image/webp;base64,' + 'YQ=='.repeat(18000);
const saved = context.Admin.saveSettings({ profile_image: bigImage, school_logo: bigImage, school_name: 'Updated' }, '2568');
assert.equal(writes, 1, 'settings changed in one batch');
assert.equal(saved.profile_image, 'https://drive.google.com/thumbnail?id=file-1');
assert.deepEqual(uploads.map(u => [u.year, u.subfolder, u.mimeType]), [
  ['2568', 'SETTINGS/profile_image', 'image/webp'], ['2568', 'SETTINGS/school_logo', 'image/webp']
]);
assert.equal(rows[1][0], '=1+1', 'unrelated formula preserved');
assert.equal(saved.other, 'Keep too');
assert.equal(rows[3].join(''), '', 'blank rows preserved');
const snapshot = JSON.stringify(rows);
assert.throws(() => context.Admin.saveSettings({ profile_image: bigImage, welcome_quote: 'x'.repeat(50001) }, '2568'));
assert.equal(uploads.length, 2, 'text validation happens before Drive writes');
failUpload = 4;
assert.throws(() => context.Admin.saveSettings({ profile_image: bigImage, school_logo: bigImage }, '2568'), /Drive failed/);
assert.equal(JSON.stringify(rows), snapshot, 'upload failure never partially changes settings');
assert.deepEqual(removed, ['file-3'], 'only this failed request\'s uploaded file is removed');
failUpload = 0;
context.Admin.saveSettings({ profile_image: saved.profile_image, teacher_name: 'Teacher', welcome_quote: 'Quote' });
assert.equal(uploads.length, 4, 'existing URLs do not get re-uploaded');
assert.ok(maxRows > 6, 'new setting keys can expand the sheet');

const repo = new SettingsRepository({ saveSettings: async () => saved });
assert.equal((await repo.saveSettings({ profile_image: bigImage })).profile_image, saved.profile_image);
assert.equal(AppState.settings.profile_image, saved.profile_image);
repo.provider.saveSettings = async () => ({ profile_image: bigImage });
await assert.rejects(repo.saveSettings({ profile_image: bigImage }), /ยืนยัน/);
console.log('Settings image tests passed: >50,000 characters become Drive URLs, year/field folders, batch write, preserved formulas/blank rows, preflight validation, failed-upload cleanup, URL reuse, schema expansion, canonical frontend state.');
