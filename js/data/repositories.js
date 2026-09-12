/**
 * Domain Repositories
 * Wraps active data provider with caching, SWR, and validation.
 * Suttinee Teacher Workspace
 */

import { Cache } from '../cache.js';

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

  async getClassroomData(year) {
    const key = Cache.buildKey('classroom', year);
    return Cache.swr(key, () => this.provider.getClassroomData(year));
  }

  async saveStudent(payload) {
    const res = await this.provider.saveStudent(payload);
    Cache.invalidate(`classroom:${payload.year}`);
    return res;
  }

  async saveDocument(payload) {
    const res = await this.provider.saveClassroomDocument(payload);
    Cache.invalidate(`classroom:${payload.year}`);
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
    const key = Cache.buildKey(`pa_items_${sectionCode || 'all'}`, year);
    return Cache.swr(key, () => this.provider.getPaItems({ year, sectionCode }));
  }

  async saveItem(payload) {
    const res = await this.provider.savePaItem(payload);
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
