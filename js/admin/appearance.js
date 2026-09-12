/**
 * Admin Appearance & Profile Manager
 * Suttinee Teacher Workspace
 */

import { SettingsApi } from '../api.js';
import { AppState } from '../app-state.js';
import { Toast } from '../toast.js';

export class AdminAppearanceController {
  constructor() {
    this.form = document.getElementById('form-appearance');
    this.init();
  }

  init() {
    this._bindForm();
    this._bindImageInputs();
  }

  async loadSettings() {
    const settings = await SettingsApi.getSettings();
    if (!settings) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };

    setVal('app-site-title', settings.site_title);
    setVal('app-site-subtitle', settings.site_subtitle);
    setVal('app-teacher-name', settings.teacher_name);
    setVal('app-teacher-role', settings.teacher_role);
    setVal('app-school-name', settings.school_name);
    setVal('app-welcome-quote', settings.welcome_quote);

    if (settings.profile_image) {
      const img = document.getElementById('prev-profile');
      if (img) img.src = settings.profile_image;
    }
    if (settings.classroom_cover_image) {
      const img = document.getElementById('prev-cls-cover');
      if (img) img.src = settings.classroom_cover_image;
    }
    if (settings.pa_cover_image) {
      const img = document.getElementById('prev-pa-cover');
      if (img) img.src = settings.pa_cover_image;
    }
  }

  _bindImageInputs() {
    const setupPreview = (inputId, prevId) => {
      const input = document.getElementById(inputId);
      const prev = document.getElementById(prevId);
      input?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file && prev) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            prev.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    };

    setupPreview('input-profile-file', 'prev-profile');
    setupPreview('input-cls-cover-file', 'prev-cls-cover');
    setupPreview('input-pa-cover-file', 'prev-pa-cover');
  }

  _bindForm() {
    this.form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const getVal = (id) => document.getElementById(id)?.value.trim() || '';

      const payload = {
        site_title: getVal('app-site-title'),
        site_subtitle: getVal('app-site-subtitle'),
        teacher_name: getVal('app-teacher-name'),
        teacher_role: getVal('app-teacher-role'),
        school_name: getVal('app-school-name'),
        welcome_quote: getVal('app-welcome-quote'),
        profile_image: document.getElementById('prev-profile')?.src,
        classroom_cover_image: document.getElementById('prev-cls-cover')?.src,
        pa_cover_image: document.getElementById('prev-pa-cover')?.src
      };

      try {
        await SettingsApi.saveSettings(payload);
        AppState.setSettings(payload);
        Toast.success('บันทึกการตั้งค่าการแสดงผลเรียบร้อยแล้ว');
      } catch (err) {
        Toast.error(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    });
  }
}
