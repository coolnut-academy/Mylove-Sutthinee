/**
 * Live Google Apps Script Data Provider
 * Connects frontend to deployed Google Apps Script Web App /exec endpoint.
 * Suttinee Teacher Workspace
 */

import { BaseDataProvider } from './provider.js';
import { CONFIG } from '../config.js';
import { AppState } from '../app-state.js';
import { Loading } from '../loading.js';

const ACTION_MESSAGES = {
  getBootstrap: 'กำลังโหลดข้อมูลระบบและปีการศึกษา...',
  getYears: 'กำลังดึงข้อมูลปีการศึกษา...',
  getSettings: 'กำลังดึงข้อมูลการตั้งค่า...',
  getStudents: 'กำลังดึงรายชื่อนักเรียน...',
  getClassroomData: 'กำลังดึงข้อมูลงานประจำชั้นและสุขภาพ...',
  getPaSections: 'กำลังดึงตัวชี้วัด ว.PA...',
  getPaItems: 'กำลังดึงเอกสารและหลักฐาน ว.PA...',
  getItem: 'กำลังโหลดรายละเอียดเอกสาร...',
  saveSettings: 'กำลังบันทึกการตั้งค่าลง Google Sheets...',
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
  }

  async _request(action, params = {}, method = 'GET', body = null) {
    if (!this.apiUrl) {
      throw new Error("Apps Script API URL is not configured. Please set CONFIG.API_URL in js/config.js.");
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
    // อนุญาตให้อัปโหลดไฟล์มีเวลา timeout 60 วิ ส่วนคำขอทั่วไป 45 วิ
    const timeoutMs = (action === 'uploadFile') ? 60000 : 45000;
    const timerId = setTimeout(() => abortController.abort(), timeoutMs);

    const options = {
      method,
      headers,
      redirect: 'follow', // 💡 บังคับตาม Google 302 Redirect
      signal: abortController.signal
    };

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

      options.body = JSON.stringify(postPayload);
      // 💡 Simple Request Header
      headers['Content-Type'] = 'text/plain;charset=utf-8';
    }

    const friendlyMsg = ACTION_MESSAGES[action] || `กำลังเชื่อมต่อ Google Apps Script (${action})...`;
    if (!Loading.isShowing) {
      Loading.start(friendlyMsg);
    } else {
      Loading.set(25, friendlyMsg);
    }

    try {
      Loading.set(45);
      const resp = await fetch(url.toString(), options);
      clearTimeout(timerId);

      Loading.set(80, 'ประมวลผลข้อมูลที่ได้รับ...');
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || 'Server request failed');
      }

      Loading.done('ดึงข้อมูลสำเร็จ');
      return data.data;
    } catch (err) {
      clearTimeout(timerId);
      if (err.name === 'AbortError') {
        const timeoutMsg = `การเชื่อมต่อไปยัง Google Apps Script หมดเวลา (${timeoutMs / 1000} วินาที) กรุณาลองใหม่อีกครั้ง`;
        console.error(`[${action}] Timeout:`, timeoutMsg);
        Loading.fail(timeoutMsg);
        throw new Error(timeoutMsg);
      }
      console.error(`AppsScript Provider error [${action}]:`, err);
      Loading.fail(err.message || 'การเชื่อมต่อคลาวด์ขัดข้อง');
      throw err;
    }
  }

  async getBootstrap({ module, year }) {
    return this._request('getBootstrap', { module, year });
  }

  async getYears() {
    return this._request('getYears');
  }

  async getSettings() {
    return this._request('getSettings');
  }

  async getStudents(year) {
    return this._request('getStudents', { year });
  }

  async getClassroomData(year) {
    return this._request('getClassroomData', { year });
  }

  async getPaSections(year) {
    return this._request('getPaSections', { year });
  }

  async getPaItems({ year, sectionCode }) {
    return this._request('getPaItems', { year, sectionCode });
  }

  async getItem(id) {
    return this._request('getItem', { id });
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
    return this._request('saveSettings', {}, 'POST', { settings: payload });
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

  async setPublished(payload) {
    return this._request('setPublished', {}, 'POST', payload);
  }

  async archiveItem(payload) {
    return this._request('archiveItem', {}, 'POST', payload);
  }

  async uploadFile(payload) {
    return this._request('uploadFile', {}, 'POST', payload);
  }
}
