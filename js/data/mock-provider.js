/**
 * Mock Data Provider Implementation
 * Supports offline development, tests, and localStorage persistence for mutations.
 * Suttinee Teacher Workspace
 */

import { BaseDataProvider } from './provider.js';
import { INITIAL_SETTINGS } from '../mock/settings.js';
import { INITIAL_YEARS } from '../mock/years.js';
import { INITIAL_STUDENTS, INITIAL_ATTENDANCE, INITIAL_ROUTINES, INITIAL_HEALTH, INITIAL_SDQ } from '../mock/students.js';
import { INITIAL_CLASSROOM_DOCUMENTS } from '../mock/classroom.js';
import { INITIAL_PA_SECTIONS, INITIAL_PA_ITEMS } from '../mock/pa.js';

const MOCK_STORAGE_KEY = 'stw:mock_database';

export class MockDataProvider extends BaseDataProvider {
  constructor() {
    super();
    this.db = this._loadDatabase();
  }

  _loadDatabase() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('Failed reading mock database, falling back to defaults:', e);
      }
    }
    return this._getFreshDefaults();
  }

  _getFreshDefaults() {
    return {
      settings: { ...INITIAL_SETTINGS },
      years: [...INITIAL_YEARS],
      students: [...INITIAL_STUDENTS],
      attendance: [...INITIAL_ATTENDANCE],
      routines: [...INITIAL_ROUTINES],
      health: [...INITIAL_HEALTH],
      sdq: [...INITIAL_SDQ],
      classroomDocuments: [...INITIAL_CLASSROOM_DOCUMENTS],
      paSections: [...INITIAL_PA_SECTIONS],
      paItems: [...INITIAL_PA_ITEMS]
    };
  }

  _saveDatabase() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(this.db));
      } catch (e) {
        console.warn('Failed saving mock database:', e);
      }
    }
  }

  resetMockDatabase() {
    this.db = this._getFreshDefaults();
    this._saveDatabase();
  }

  async _delay(ms = 120) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Read Operations ---
  async getBootstrap({ module, year }) {
    await this._delay();
    return {
      settings: this.db.settings,
      years: this.db.years,
      activeYear: year || this.db.settings.default_year,
      module
    };
  }

  async getYears() {
    await this._delay(80);
    return [...this.db.years];
  }

  async getSettings() {
    await this._delay(80);
    return { ...this.db.settings };
  }

  async getStudents(year) {
    await this._delay();
    const students = this.db.students.filter(s => s.year === year);
    const attendance = this.db.attendance.filter(a => a.year === year);
    const routines = this.db.routines.filter(r => r.year === year);
    const health = this.db.health.filter(h => h.year === year);
    const sdq = this.db.sdq.filter(q => q.year === year);
    return { students, attendance, routines, health, sdq };
  }

  async getClassroomData(year) {
    await this._delay();
    const documents = this.db.classroomDocuments.filter(d => d.year === year);
    const studentData = await this.getStudents(year);
    return {
      documents,
      ...studentData
    };
  }

  async getPaSections(year) {
    await this._delay();
    return this.db.paSections
      .filter(s => s.year === year)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async getPaItems({ year, sectionCode }) {
    await this._delay();
    let items = this.db.paItems.filter(i => i.year === year);
    if (sectionCode) {
      items = items.filter(i => i.section_code === sectionCode);
    }
    return items.sort((a, b) => a.sort_order - b.sort_order);
  }

  async getItem(id) {
    await this._delay(60);
    const allItems = [...this.db.classroomDocuments, ...this.db.paItems];
    return allItems.find(i => i.id === id) || null;
  }

  // --- Auth Operations ---
  async login(password) {
    await this._delay(300);
    // In Mock Mode, any password with "admin" or "DEV ONLY" is accepted
    if (password === 'DEV ONLY' || password === 'admin' || password === 'admin123') {
      const session = {
        token: 'mock_token_' + Date.now(),
        user: { name: 'นางสาวศุทธินี ถาวร', role: 'admin' },
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
      };
      return { success: true, session };
    }
    throw new Error('รหัสผ่านไม่ถูกต้อง (สำหรับโหมดทดสอบ ให้ใช้ "DEV ONLY" หรือ "admin123")');
  }

  async logout() {
    await this._delay(100);
    return { success: true };
  }

  async validateSession(token) {
    return Boolean(token && token.startsWith('mock_token_'));
  }

  // --- Admin Mutations ---
  async saveSettings(payload) {
    await this._delay(200);
    this.db.settings = { ...this.db.settings, ...payload, updated_at: new Date().toISOString() };
    this._saveDatabase();
    return { success: true, settings: this.db.settings };
  }

  async createYear({ year, label, pa_period_start, pa_period_end, is_default }) {
    await this._delay(200);
    if (this.db.years.some(y => y.year === year)) {
      throw new Error(`ปีการศึกษา ${year} มีอยู่ในระบบแล้ว`);
    }

    if (is_default) {
      this.db.years.forEach(y => y.is_default = false);
    }

    const newYear = {
      id: `year-${year}`,
      year: String(year),
      label: label || `ปีการศึกษา ${year}`,
      status: "active",
      root_folder_id: `drive_folder_${year}`,
      pa_period_start: pa_period_start || `${year - 543}-10-01`,
      pa_period_end: pa_period_end || `${year - 542}-09-30`,
      is_default: Boolean(is_default),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.db.years.unshift(newYear);

    // Seed default PA sections for the new year
    INITIAL_PA_SECTIONS.forEach(sec => {
      this.db.paSections.push({
        ...sec,
        id: `pa-sec-${sec.section_code}-${year}`,
        year: String(year)
      });
    });

    this._saveDatabase();
    return { success: true, year: newYear };
  }

  async saveStudent(studentData) {
    await this._delay(150);
    const existingIndex = this.db.students.findIndex(s => s.id === studentData.id);
    if (existingIndex >= 0) {
      this.db.students[existingIndex] = { ...this.db.students[existingIndex], ...studentData, updated_at: new Date().toISOString() };
    } else {
      const newStudent = {
        id: studentData.id || `std-${studentData.year}-${Date.now()}`,
        student_no: studentData.student_no || (this.db.students.filter(s => s.year === studentData.year).length + 1),
        created_at: new Date().toISOString(),
        status: "active",
        ...studentData
      };
      this.db.students.push(newStudent);
    }
    this._saveDatabase();
    return { success: true };
  }

  async saveClassroomDocument(docData) {
    await this._delay(150);
    const idx = this.db.classroomDocuments.findIndex(d => d.id === docData.id);
    if (idx >= 0) {
      this.db.classroomDocuments[idx] = { ...this.db.classroomDocuments[idx], ...docData, updated_at: new Date().toISOString() };
    } else {
      const newDoc = {
        id: docData.id || `cls-doc-${Date.now()}`,
        published: true,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...docData
      };
      this.db.classroomDocuments.push(newDoc);
    }
    this._saveDatabase();
    return { success: true };
  }

  async savePaItem(itemData) {
    await this._delay(150);
    const idx = this.db.paItems.findIndex(i => i.id === itemData.id);
    if (idx >= 0) {
      this.db.paItems[idx] = { ...this.db.paItems[idx], ...itemData, updated_at: new Date().toISOString() };
    } else {
      const newItem = {
        id: itemData.id || `pa-item-${Date.now()}`,
        published: true,
        archived: false,
        sort_order: this.db.paItems.filter(i => i.section_code === itemData.section_code).length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...itemData
      };
      this.db.paItems.push(newItem);
    }
    this._saveDatabase();
    return { success: true };
  }

  async setPublished({ id, entity, published }) {
    await this._delay(100);
    const list = entity === 'pa' ? this.db.paItems : this.db.classroomDocuments;
    const item = list.find(x => x.id === id);
    if (item) {
      item.published = published;
      item.updated_at = new Date().toISOString();
      this._saveDatabase();
      return { success: true };
    }
    throw new Error('Item not found');
  }

  async archiveItem({ id, entity, archived = true }) {
    await this._delay(100);
    const list = entity === 'pa' ? this.db.paItems : this.db.classroomDocuments;
    const item = list.find(x => x.id === id);
    if (item) {
      item.archived = archived;
      item.updated_at = new Date().toISOString();
      this._saveDatabase();
      return { success: true };
    }
    throw new Error('Item not found');
  }

  async uploadFile({ name, size, type, sectionCode, year }) {
    await this._delay(350);
    const isImage = type.startsWith('image/');
    const isPdf = type === 'application/pdf';

    const newItem = {
      id: `mock-upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      year: year,
      section_code: sectionCode || "1.1",
      title: name.replace(/\.[^/.]+$/, ""),
      description: `อัปโหลดเมื่อ ${new Date().toLocaleDateString('th-TH')}`,
      type: isImage ? 'image' : (isPdf ? 'pdf' : 'file'),
      drive_file_id: `mock_drive_id_${Date.now()}`,
      external_url: isImage ? "./assets/fallback/classroom-cover.svg" : "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
      mime_type: type,
      file_size: size,
      sort_order: 1,
      published: true,
      archived: false,
      created_at: new Date().toISOString()
    };

    this.db.paItems.push(newItem);
    this._saveDatabase();
    return { success: true, item: newItem };
  }
}
