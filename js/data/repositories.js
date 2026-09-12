/**
 * Domain Repositories
 * Wraps active data provider with caching, SWR, and validation.
 * Suttinee Teacher Workspace
 */

import { Cache } from '../cache.js';

async function verifySavedItem(provider, result, payload) {
  if (!result?.id) throw new Error('เซิร์ฟเวอร์ไม่ส่งรหัสรายการที่บันทึก กรุณาตรวจสอบเวอร์ชัน Apps Script');
  try {
    const item = result._persisted === true ? result : await provider.getItem(result.id, { timeoutMs: 75000 });
    if (!item || String(item.year) !== String(payload.year) ||
        item.title !== payload.title ||
        (payload.category && item.category !== payload.category) ||
        (payload.section_code && String(item.section_code) !== String(payload.section_code)) ||
        (payload.cover_url && item.cover_url !== payload.cover_url) ||
        (payload.drive_file_id && item.drive_file_id !== payload.drive_file_id)) {
      throw new Error('ข้อมูลที่อ่านกลับไม่ตรงกับรายการที่บันทึก');
    }
    return item;
  } catch (error) {
    error.savedItem = result;
    throw error;
  }
}

export class SettingsRepository {
  constructor(provider) {
    this.provider = provider;
  }

  async getSettings() {
    const key = Cache.buildKey('settings');
    return Cache.swr(key, () => this.provider.getSettings());
  }

  async saveSettings(payload) {
    const res = await this.provider.saveSettings(payload);
    Cache.invalidate('settings');
    return res;
  }
}

export class YearsRepository {
  constructor(provider) {
    this.provider = provider;
  }

  async getYears() {
    const key = Cache.buildKey('years');
    return Cache.swr(key, () => this.provider.getYears());
  }

  async createYear(payload) {
    const res = await this.provider.createYear(payload);
    Cache.invalidate('years');
    return res;
  }
}

export class ClassroomRepository {
  constructor(provider) {
    this.provider = provider;
  }

  async getStudents(year) {
    return this.provider.getStudents(year);
  }

  async getClassroomData(year, options = {}) {
    return this.provider.getClassroomData(year, options);
  }

  async saveStudent(payload) {
    const res = await this.provider.saveStudent(payload);
    Cache.invalidate('classroom');
    return res;
  }

  async saveDocument(payload) {
    const res = await this.provider.saveClassroomDocument(payload);
    Cache.invalidate('classroom');
    return verifySavedItem(this.provider, res, payload);
  }

  async deleteDocument(id, year) {
    const res = await this.provider.deleteItem(id);
    Cache.invalidate('classroom');
    return res;
  }
}

export class PaRepository {
  constructor(provider) {
    this.provider = provider;
  }

  async getSections(year) {
    const key = Cache.buildKey('pa_sections', year);
    return Cache.swr(key, () => this.provider.getPaSections(year));
  }

  async getItems(year, sectionCode = '') {
    return this.provider.getPaItems({ year, sectionCode });
  }

  async getPaData(year) {
    if (typeof this.provider.getPaData === 'function') return this.provider.getPaData(year);
    const [sections, items] = await Promise.all([
      this.getSections(year),
      this.getItems(year)
    ]);
    return { sections: sections || [], items: items || [] };
  }

  async saveItem(payload) {
    const res = await this.provider.savePaItem(payload);
    Cache.invalidate(`pa_items`);
    return verifySavedItem(this.provider, res, payload);
  }

  async deleteItem(id) {
    const res = await this.provider.deleteItem(id);
    Cache.invalidate(`pa_items`);
    return res;
  }

  async setPublished(id, published) {
    const res = await this.provider.setPublished({ id, entity: 'pa', published });
    Cache.invalidate(`pa_items`);
    return res;
  }

  async archiveItem(id, archived = true) {
    const res = await this.provider.archiveItem({ id, entity: 'pa', archived });
    Cache.invalidate(`pa_items`);
    return res;
  }
}
