/**
 * Test & Verification Suite
 * Suttinee Teacher Workspace
 * Verifies Mock Data, Providers, Formatters, Routing, and Contracts
 */

import { INITIAL_SETTINGS } from '../js/mock/settings.js';
import { INITIAL_YEARS } from '../js/mock/years.js';
import { INITIAL_STUDENTS } from '../js/mock/students.js';
import { INITIAL_PA_SECTIONS, INITIAL_PA_ITEMS } from '../js/mock/pa.js';
import { INITIAL_CLASSROOM_DOCUMENTS } from '../js/mock/classroom.js';
import { Utils } from '../js/utils.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✕ FAILED: ${message}`);
    failed++;
  }
}

console.log('--- 1. Testing Mock Datasets ---');
assert(INITIAL_SETTINGS.teacher_name.includes('นางสาวศุทธินี ถาวร'), 'Teacher name contains "นางสาวศุทธินี ถาวร"');
assert(INITIAL_YEARS.length >= 2, 'At least 2 academic years exist');
assert(INITIAL_YEARS.some(y => y.is_default), 'A default active year is configured');
assert(INITIAL_PA_SECTIONS.filter(s => s.year === '2567').length === 16, 'PA sections contain 15 indicators + 1 challenge section for year 2567');
assert(INITIAL_STUDENTS.length === 0, 'Student mock dataset is purged to clean empty state (0 records)');
assert(INITIAL_CLASSROOM_DOCUMENTS.length === 0, 'Classroom documents mock dataset is purged to clean empty state (0 records)');
assert(INITIAL_PA_ITEMS.length === 0, 'PA evidence items mock dataset is purged to clean empty state (0 records)');


console.log('\n--- 2. Testing Utilities & Formatters ---');
const dateStr = Utils.formatDateThai('2026-09-12');
assert(dateStr.includes('2569'), `Thai Buddhist year formatted correctly: "${dateStr}"`);
assert(dateStr.includes('กันยายน'), `Thai month formatted correctly: "${dateStr}"`);

const sizeStr = Utils.formatFileSize(2048576);
assert(sizeStr === '2 MB', `File size formatted correctly: "${sizeStr}"`);

const safeStr = Utils.escapeHtml('<script>alert("xss")</script>');
assert(!safeStr.includes('<script>'), `XSS escaped correctly: "${safeStr}"`);

const pdfType = Utils.getFileTypeInfo('report.pdf');
assert(pdfType.type === 'pdf' && pdfType.label === 'PDF', 'PDF file type detected');

const imgType = Utils.getFileTypeInfo('photo.png');
assert(imgType.type === 'image' && imgType.label === 'รูปภาพ', 'Image file type detected');

console.log('\n--- 3. Testing Smart Formula Sanitizer (GAS Security) ---');
function testSanitizer(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val;
  var str = String(val).trim();
  if (str.length === 0) return '';
  var firstChar = str.charAt(0);
  if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
    if ((firstChar === '-' || firstChar === '+') && !isNaN(Number(str))) {
      return Number(str);
    }
    return "'" + str;
  }
  return str;
}

assert(testSanitizer('=cmd|calc!A0') === "'=cmd|calc!A0", 'Escapes formula starting with "="');
assert(testSanitizer('@SUM(A1:A10)') === "'@SUM(A1:A10)", 'Escapes formula starting with "@"');
assert(testSanitizer(-25.5) === -25.5, 'Preserves negative numbers as number: -25.5');
assert(testSanitizer('-50') === -50, 'Preserves numeric string "-50" as number without prepending quote');
assert(testSanitizer('+66812345678') === 66812345678, 'Preserves positive phone/int string "+66812345678"');
assert(testSanitizer('-cmd|dangerous') === "'-cmd|dangerous", 'Escapes non-numeric string starting with "-"');
assert(testSanitizer('เอกสารปกติ') === 'เอกสารปกติ', 'Leaves safe text untouched');

console.log('\n--- 4. Testing Frontend Architecture Modules ---');
import { SubmissionProgress } from '../js/submission-progress.js';
assert(typeof SubmissionProgress.start === 'function', 'SubmissionProgress.start is a function');
assert(typeof SubmissionProgress.setStep === 'function', 'SubmissionProgress.setStep is a function');
assert(typeof SubmissionProgress.simulateProgress === 'function', 'SubmissionProgress.simulateProgress is a function');
assert(typeof SubmissionProgress.complete === 'function', 'SubmissionProgress.complete is a function');
assert(typeof SubmissionProgress.error === 'function', 'SubmissionProgress.error is a function');

import { compressImage, readFileAsBase64, prepareUploadPayload, A4_DIMENSIONS } from '../js/image-utils.js';
assert(typeof compressImage === 'function', 'compressImage is exported');
assert(typeof readFileAsBase64 === 'function', 'readFileAsBase64 is exported');
assert(typeof prepareUploadPayload === 'function', 'prepareUploadPayload is exported');
assert(A4_DIMENSIONS.MAX_LONG === 1754 && A4_DIMENSIONS.MAX_SHORT === 1240, 'A4 standard dimensions (1754x1240) configured for client compression');

import { Loading } from '../js/loading.js';
assert(typeof Loading.start === 'function', 'Loading.start is a function');
assert(typeof Loading.set === 'function', 'Loading.set is a function');
assert(typeof Loading.done === 'function', 'Loading.done is a function');
assert(typeof Loading.fail === 'function', 'Loading.fail is a function');

console.log('\n--- 5. Testing Google Sites+ UX Redesign Requirements ---');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
const classroomHtml = fs.readFileSync(path.join(rootDir, 'classroom.html'), 'utf-8');
const paHtml = fs.readFileSync(path.join(rootDir, 'pa.html'), 'utf-8');
const adminHtml = fs.readFileSync(path.join(rootDir, 'admin.html'), 'utf-8');

// Jargon check
const forbiddenJargon = ['Mock Mode', 'DEV ONLY', 'admin123', 'Reset Mock Database', 'Data Provider: Mock'];
forbiddenJargon.forEach(term => {
  assert(!indexHtml.includes(term), `index.html does not contain developer jargon "${term}"`);
  assert(!classroomHtml.includes(term), `classroom.html does not contain developer jargon "${term}"`);
  assert(!paHtml.includes(term), `pa.html does not contain developer jargon "${term}"`);
  assert(!adminHtml.includes(term), `admin.html does not contain developer jargon "${term}"`);
});

// Homepage 2-card gateway check
assert(indexHtml.includes('gateway-grid'), 'index.html contains 2-card gateway grid');
assert(indexHtml.includes('classroom.html') && indexHtml.includes('pa.html'), 'index.html routes to classroom.html and pa.html');
assert(!indexHtml.includes('stat-card'), 'index.html does not contain fake statistical metric cards');

// Classroom menu-first and single-job view check
assert(classroomHtml.includes('classroom-menu-view'), 'classroom.html contains menu-first container (classroom-menu-view)');
assert(classroomHtml.includes('classroom-job-view'), 'classroom.html contains single-job view container (classroom-job-view)');
assert(classroomHtml.includes('classroom-breadcrumb'), 'classroom.html contains breadcrumb navigation');

// PA Digital Binder check
assert(paHtml.includes('pa-binder-view'), 'pa.html contains Table of Contents container (pa-binder-view)');
assert(paHtml.includes('pa-detail-view'), 'pa.html contains sequential reader container (pa-detail-view)');
assert(paHtml.includes('btn-reader-prev') && paHtml.includes('btn-reader-next'), 'pa.html contains prev/next sequential reader controls');

// Admin task-first check
assert(adminHtml.includes('จัดการเว็บไซต์'), 'admin.html title is "จัดการเว็บไซต์"');
assert(adminHtml.includes('data-task="home"') && adminHtml.includes('data-task="classroom"') && adminHtml.includes('data-task="pa"'), 'admin.html has task-first navigation tabs');

console.log('\n--- 6. Testing Universal Add Item, Dynamic Fields & Viewers ---');
import { UniversalItemModal } from '../js/components/universal-item-modal.js';
import { EbookViewerModal } from '../js/components/ebook-viewer-modal.js';
import { ExcelViewerModal } from '../js/components/excel-viewer-modal.js';
import { renderUniversalCard } from '../js/components/universal-card-renderer.js';

assert(typeof UniversalItemModal.open === 'function', 'UniversalItemModal.open is a function');
assert(typeof UniversalItemModal.close === 'function', 'UniversalItemModal.close is a function');
assert(typeof UniversalItemModal.addFieldRow === 'function', 'UniversalItemModal.addFieldRow is a function');

assert(typeof EbookViewerModal.open === 'function', 'EbookViewerModal.open is a function');
assert(typeof EbookViewerModal.close === 'function', 'EbookViewerModal.close is a function');
assert(typeof EbookViewerModal.prevPage === 'function', 'EbookViewerModal.prevPage is a function');
assert(typeof EbookViewerModal.nextPage === 'function', 'EbookViewerModal.nextPage is a function');

assert(typeof ExcelViewerModal.open === 'function', 'ExcelViewerModal.open is a function');
assert(typeof ExcelViewerModal.close === 'function', 'ExcelViewerModal.close is a function');
assert(typeof ExcelViewerModal.switchSheet === 'function', 'ExcelViewerModal.switchSheet is a function');

assert(typeof renderUniversalCard === 'function', 'renderUniversalCard is exported');

// Test CDN presence in HTML
assert(classroomHtml.includes('xlsx.full.min.js'), 'classroom.html includes SheetJS (Excel viewer)');
assert(classroomHtml.includes('pdf.min.js'), 'classroom.html includes PDF.js (eBook viewer)');
assert(paHtml.includes('xlsx.full.min.js'), 'pa.html includes SheetJS (Excel viewer)');
assert(paHtml.includes('pdf.min.js'), 'pa.html includes PDF.js (eBook viewer)');

console.log('\n--- 7. Testing Homepage Inline Editor Targets & Methods ---');
import { InlineEditor } from '../js/admin/inline-editor.js';
assert(typeof InlineEditor.editHeaderBrand === 'function', 'InlineEditor.editHeaderBrand is a function');
assert(typeof InlineEditor.editHeroProfile === 'function', 'InlineEditor.editHeroProfile is a function');
assert(typeof InlineEditor.editGatewayCard === 'function', 'InlineEditor.editGatewayCard is a function');
assert(typeof InlineEditor._createImageUploadField === 'function', 'InlineEditor._createImageUploadField is a function');

assert(indexHtml.includes('data-editable="header-brand"'), 'index.html contains data-editable="header-brand"');
assert(indexHtml.includes('data-editable="hero-profile"'), 'index.html contains data-editable="hero-profile"');
assert(indexHtml.includes('data-editable="gateway-classroom"'), 'index.html contains data-editable="gateway-classroom"');
assert(indexHtml.includes('data-editable="gateway-pa"'), 'index.html contains data-editable="gateway-pa"');

assert(indexHtml.includes('id="header-avatar"'), 'index.html contains #header-avatar');
assert(indexHtml.includes('id="header-title"'), 'index.html contains #header-title');
assert(indexHtml.includes('id="header-subtitle"'), 'index.html contains #header-subtitle');
assert(indexHtml.includes('id="hero-avatar"'), 'index.html contains #hero-avatar');
assert(indexHtml.includes('id="hero-school-logo"'), 'index.html contains #hero-school-logo');
assert(indexHtml.includes('id="cover-classroom"'), 'index.html contains #cover-classroom');
assert(indexHtml.includes('id="icon-classroom"'), 'index.html contains #icon-classroom');
assert(indexHtml.includes('id="title-classroom"'), 'index.html contains #title-classroom');
assert(indexHtml.includes('id="desc-classroom"'), 'index.html contains #desc-classroom');
assert(indexHtml.includes('id="cover-pa"'), 'index.html contains #cover-pa');
assert(indexHtml.includes('id="icon-pa"'), 'index.html contains #icon-pa');
assert(indexHtml.includes('id="title-pa"'), 'index.html contains #title-pa');
assert(indexHtml.includes('id="desc-pa"'), 'index.html contains #desc-pa');

console.log('\n--- Summary ---');
console.log(`Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
}



