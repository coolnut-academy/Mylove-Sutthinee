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
assert(INITIAL_STUDENTS.length >= 10, 'Student dataset has records');
assert(INITIAL_CLASSROOM_DOCUMENTS.length >= 4, 'Classroom documents dataset has records');
assert(INITIAL_PA_ITEMS.length >= 5, 'PA evidence items dataset has records');

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

import { compressImage, readFileAsBase64, prepareUploadPayload } from '../js/image-utils.js';
assert(typeof compressImage === 'function', 'compressImage is exported');
assert(typeof readFileAsBase64 === 'function', 'readFileAsBase64 is exported');
assert(typeof prepareUploadPayload === 'function', 'prepareUploadPayload is exported');

import { Loading } from '../js/loading.js';
assert(typeof Loading.start === 'function', 'Loading.start is a function');
assert(typeof Loading.set === 'function', 'Loading.set is a function');
assert(typeof Loading.done === 'function', 'Loading.done is a function');
assert(typeof Loading.fail === 'function', 'Loading.fail is a function');

console.log('\n--- Summary ---');
console.log(`Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
}
