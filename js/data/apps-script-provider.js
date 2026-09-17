/**
 * Live Google Apps Script Data Provider
 * Connects frontend to deployed Google Apps Script Web App /exec endpoint.
 * Suttinee Teacher Workspace
 */

import { BaseDataProvider } from './provider.js';
import { CONFIG } from '../config.js';
import { AppState } from '../app-state.js';

const ACTION_MESSAGES = {
  getBootstrap: 'กำลังโหลดข้อมูลระบบและปีการศึกษา...',
  getYears: 'กำลังดึงข้อมูลปีการศึกษา...',
  getSettings: 'กำลังดึงข้อมูลการตั้งค่า...',
  getStudents: 'กำลังดึงรายชื่อนักเรียน...',
  getClassroomData: 'กำลังดึงข้อมูลงานประจำชั้นและสุขภาพ...',
  getPaSections: 'กำลังดึงตัวชี้วัด ว.PA...',
  getPaItems: 'กำลังดึงเอกสารและหลักฐาน ว.PA...',
  getPaData: 'กำลังโหลดหมวดและเอกสาร ว.PA...',
  updatePaSection: 'กำลังบันทึกหัวข้อ ว.PA...',
  getItem: 'กำลังโหลดรายละเอียดเอกสาร...',
  saveSettings: 'กำลังอัปโหลดภาพและบันทึกการตั้งค่า...',
  createYear: 'กำลังสร้างปีการศึกษาใหม่...',
  saveStudent: 'กำลังบันทึกข้อมูลนักเรียน...',
  saveClassroomDocument: 'กำลังบันทึกเอกสารธุรการชั้นเรียน...',
  savePaItem: 'กำลังบันทึกข้อมูล ว.PA...',
  uploadFile: 'กำลังนำส่งไฟล์ขึ้น Google Cloud...'
};

export class AppsScriptDataProvider extends BaseDataProvider {
  constructor(apiUrl = CONFIG.API_URL) {
    super();
    this.apiUrl = apiUrl;
    this._pendingReads = new Map();
    this._readRevision = 0;
  }

  async _request(action, params = {}, methodOrOptions = 'GET', bodyParam = null) {
    const method = typeof methodOrOptions === 'string' ? methodOrOptions : (methodOrOptions?.method || 'GET');
    if (method.toUpperCase() !== 'GET') {
      this._readRevision++;
      try { return await this._sendRequest(action, params, methodOrOptions, bodyParam); }
      finally { this._readRevision++; }
    }
    // Share only concurrent reads. Settled responses are never retained here.
    const key = JSON.stringify([this.apiUrl, action, params, methodOrOptions, AppState.session?.token, this._readRevision]);
    if (this._pendingReads.has(key)) return this._pendingReads.get(key);
    const request = this._sendRequest(action, params, methodOrOptions, bodyParam);
    this._pendingReads.set(key, request);
    try { return await request; }
    finally { if (this._pendingReads.get(key) === request) this._pendingReads.delete(key); }
  }

  async _sendRequest(action, params = {}, methodOrOptions = 'GET', bodyParam = null) {
    if (!this.apiUrl) {
      throw new Error("Apps Script API URL is not configured. Please set CONFIG.API_URL in js/config.js.");
    }

    let method = 'GET';
    let body = null;
    let customTimeout = null;

    if (typeof methodOrOptions === 'object' && methodOrOptions !== null) {
      method = (methodOrOptions.method || 'GET').toUpperCase();
      body = methodOrOptions.body || null;
      customTimeout = methodOrOptions.timeoutMs;
    } else if (typeof methodOrOptions === 'string') {
      method = methodOrOptions.toUpperCase();
      body = bodyParam;
    }

    const url = new URL(this.apiUrl);
    url.searchParams.set('action', action);

    const session = AppState.session;

    if (method === 'GET') {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
      // 💡 Cache-Busting: ป้องกัน Edge CDN และ Browser แคชข้อมูลเก่า
      url.searchParams.set('_t', String(Date.now()));
      if (session && session.token) {
        url.searchParams.set('token', session.token);
      }
    }

    // 💡 กฎเหล็ก CORS Simple Request: ไม่ส่ง Authorization Header เพื่อไม่ให้เกิด Preflight OPTIONS
    const headers = { 'Accept': 'application/json' };

    const abortController = new AbortController();
    const writeActions = [
      'savePaItem',
      'updatePaSection',
      'saveClassroomDocument',
      'saveSettings',
      'saveStudent',
      'uploadFile',
      'createYear',
      'deleteItem',
      'archiveItem',
      'setPublished'
    ];
    // 💡 คำขอประเภทเขียนข้อมูลหรืออัปโหลดไฟล์ให้เวลา 75 วินาที, คำขออ่านให้เวลา 60 วินาที (รองรับ Cold Start ของ Google Apps Script)
    const timeoutMs = customTimeout || (writeActions.includes(action) ? 75000 : 60000);

    const baseHeaders = { 'Accept': 'application/json' };
    let postBody = null;

    if (method === 'POST') {
      // ส่ง Session Token ใน JSON Body ปลอดภัยและไม่ติด CORS
      const postPayload = {
        action,
        ...params,
        ...(body || {})
      };
      if (session && session.token && !postPayload.token) {
        postPayload.token = session.token;
      }
      postBody = JSON.stringify(postPayload);
      baseHeaders['Content-Type'] = 'text/plain;charset=utf-8';
    }

    const maxAttempts = method === 'GET' ? 2 : 1;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const abortController = new AbortController();
      const timerId = setTimeout(() => abortController.abort(), timeoutMs);

      const options = {
        method,
        headers: baseHeaders,
        redirect: 'follow', // 💡 บังคับตาม Google 302 Redirect
        signal: abortController.signal
      };
      if (postBody) options.body = postBody;

      try {
        const resp = await fetch(url.toString(), options);
        const text = await resp.text();
        clearTimeout(timerId);

        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          throw new Error('Google Apps Script ส่งข้อมูลไม่ถูกต้อง (ตรวจสอบสิทธิ์หรือ URL Web App)');
        }
        if (!data.success) {
          throw new Error(data.error || 'Server request failed');
        }

        return data.data;
      } catch (err) {
        clearTimeout(timerId);
        const isAbort = err.name === 'AbortError';
        lastError = isAbort
          ? new Error(`การเชื่อมต่อไปยัง Google Apps Script หมดเวลา (${timeoutMs / 1000} วินาที) กรุณาลองใหม่อีกครั้ง`)
          : err;

        if (attempt < maxAttempts) {
          console.warn(`[${action}] Attempt ${attempt} failed (${lastError.message}), retrying in 1.2s...`);
          await new Promise(r => setTimeout(r, 1200));
          url.searchParams.set('_t', String(Date.now()));
          continue;
        }

        console.error(`AppsScript Provider error [${action}]:`, lastError);
        throw lastError;
      }
    }
  }

  async getBootstrap({ module, year }) {
    const data = await this._request('getBootstrap', { module, year });
    if (data && data.paData) {
      if (Array.isArray(data.paData.items)) {
        data.paData.items.forEach(i => {
          if (i && typeof i === 'object') {
            if (i.year !== undefined) i.year = String(i.year).trim();
            if (i.section_code !== undefined) i.section_code = String(i.section_code).trim();
          }
        });
      }
      if (Array.isArray(data.paData.sections)) {
        data.paData.sections.forEach(s => {
          if (s && typeof s === 'object') {
            if (s.year !== undefined) s.year = String(s.year).trim();
            if (s.section_code !== undefined) s.section_code = String(s.section_code).trim();
          }
        });
      }
    }
    return data;
  }

  async getYears() {
    return (await this.getBootstrap({})).years;
  }

  async getSettings() {
    return (await this.getBootstrap({})).settings;
  }

  async getStudents(year) {
    return this._request('getStudents', { year });
  }

  async getClassroomData(year, options = {}) {
    return this._request('getClassroomData', { year, documentsOnly: options.documentsOnly || undefined }, { timeoutMs: 75000 });
  }

  async getPaSections(year) {
    const sections = await this._request('getPaSections', { year });
    if (Array.isArray(sections)) {
      sections.forEach(s => {
        if (s && typeof s === 'object') {
          if (s.year !== undefined) s.year = String(s.year).trim();
          if (s.section_code !== undefined) s.section_code = String(s.section_code).trim();
        }
      });
    }
    return sections;
  }

  async getPaItems({ year, sectionCode }) {
    const items = await this._request('getPaItems', { year, sectionCode });
    if (Array.isArray(items)) {
      items.forEach(i => {
        if (i && typeof i === 'object') {
          if (i.year !== undefined) i.year = String(i.year).trim();
          if (i.section_code !== undefined) i.section_code = String(i.section_code).trim();
        }
      });
    }
    return items;
  }

  async getPaData(year) {
    const data = await this._request('getPaData', { year }, { timeoutMs: 75000 });
    if (data) {
      if (Array.isArray(data.items)) {
        data.items.forEach(i => {
          if (i && typeof i === 'object') {
            if (i.year !== undefined) i.year = String(i.year).trim();
            if (i.section_code !== undefined) i.section_code = String(i.section_code).trim();
          }
        });
      }
      if (Array.isArray(data.sections)) {
        data.sections.forEach(s => {
          if (s && typeof s === 'object') {
            if (s.year !== undefined) s.year = String(s.year).trim();
            if (s.section_code !== undefined) s.section_code = String(s.section_code).trim();
          }
        });
      }
    }
    return data;
  }

  async getItem(id, options = {}) {
    return this._request('getItem', { id }, { timeoutMs: options.timeoutMs });
  }

  async login(password) {
    const data = await this._request('login', {}, 'POST', { password });
    return { success: true, session: (data && data.token) ? data : (data?.session || data) };
  }

  async logout() {
    return this._request('logout', {}, 'POST');
  }

  async validateSession(token) {
    return this._request('validateSession', {}, 'POST', { token });
  }

  async saveSettings(payload) {
    return this._request('saveSettings', {}, 'POST', { settings: payload, year: AppState.currentYear });
  }

  async createYear(payload) {
    return this._request('createYear', {}, 'POST', payload);
  }

  async saveStudent(payload) {
    return this._request('saveStudent', {}, 'POST', payload);
  }

  async saveClassroomDocument(payload) {
    return this._request('saveClassroomDocument', {}, 'POST', payload);
  }

  async savePaItem(payload) {
    return this._request('savePaItem', {}, 'POST', payload);
  }

  async updatePaSection(payload) {
    return this._request('updatePaSection', {}, 'POST', payload);
  }

  async setPublished(payload) {
    return this._request('setPublished', {}, 'POST', payload);
  }

  async archiveItem(payload) {
    return this._request('archiveItem', {}, 'POST', payload);
  }

  async deleteItem(id) {
    return this._request('deleteItem', {}, 'POST', { id });
  }

  async uploadFile(payload) {
    return this._request('uploadFile', {}, 'POST', payload);
  }
}
