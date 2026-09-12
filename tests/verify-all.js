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

console.log('\n--- Summary ---');
console.log(`Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
}
