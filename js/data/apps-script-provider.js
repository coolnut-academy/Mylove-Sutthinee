/**
 * Live Google Apps Script Data Provider
 * Connects frontend to deployed Google Apps Script Web App /exec endpoint.
 * Suttinee Teacher Workspace
 */

import { BaseDataProvider } from './provider.js';
import { CONFIG } from '../config.js';
import { AppState } from '../app-state.js';

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

    if (method === 'GET') {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
    }

    const headers = { 'Accept': 'application/json' };
    const session = AppState.session;
    if (session && session.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }

    const options = {
      method,
      headers
    };

    if (method === 'POST') {
      options.body = JSON.stringify({ action, ...params, ...(body || {}) });
      headers['Content-Type'] = 'text/plain;charset=utf-8'; // Prevent CORS preflight issues with GAS Web App
    }

    try {
      const resp = await fetch(url.toString(), options);
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || 'Server request failed');
      }
      return data.data;
    } catch (err) {
      console.error(`AppsScript Provider error [${action}]:`, err);
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
    return this._request('login', {}, 'POST', { password });
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
