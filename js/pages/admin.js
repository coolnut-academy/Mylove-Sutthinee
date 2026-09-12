/**
 * Main Admin Page Orchestrator
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';
import { RouterUtils } from '../router-utils.js';
import { AppState } from '../app-state.js';
import { CONFIG } from '../config.js';
import { YearsApi, ClassroomApi, PaApi, DevApi } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';

import { AdminAuthController } from '../admin/auth.js';
import { AdminAppearanceController } from '../admin/appearance.js';
import { AdminYearsController } from '../admin/years.js';
import { AdminStudentsController } from '../admin/students.js';
import { AdminPaManagerController } from '../admin/pa-manager.js';
import { AdminUploadManagerController } from '../admin/upload-manager.js';

class AdminPageController {
  constructor() {
    this.currentYear = RouterUtils.resolveYear();
    this.init();
  }

  async init() {
    this.authController = new AdminAuthController(() => this.onAuthenticated());
    this.appearanceController = new AdminAppearanceController();
    this.yearsController = new AdminYearsController((newYear) => this.onYearCreated(newYear));
    this.studentsController = new AdminStudentsController(() => this.currentYear);
    this.paController = new AdminPaManagerController(() => this.currentYear);
    this.uploadController = new AdminUploadManagerController(() => this.currentYear);

    this._bindTabs();
    this._bindYearSwitcher();
    this._bindDevReset();
  }

  async onAuthenticated() {
    Loading.start();
    try {
      await this.loadYears();
      await this.loadOverviewStats();
      this.appearanceController.loadSettings();
      this.yearsController.loadYears();
      this.studentsController.loadStudents(this.currentYear);
      this.paController.loadData(this.currentYear);
      this.uploadController.loadOptions();
      Loading.done();
    } catch (err) {
      console.error("Admin init error:", err);
      Loading.fail();
    }
  }

  _bindTabs() {
    const tabBtns = document.querySelectorAll('[data-admin-tab]');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.dataset.adminTab;
        document.querySelectorAll('.admin-sec').forEach(sec => sec.classList.add('d-none'));

        const activeSec = document.getElementById(`admin-sec-${target}`);
        if (activeSec) {
          activeSec.classList.remove('d-none');
          activeSec.classList.add('animate-fade-in');

          // Lazy refresh sub-controllers
          if (target === 'students') this.studentsController.loadStudents(this.currentYear);
          if (target === 'pa') this.paController.loadData(this.currentYear);
          if (target === 'years') this.yearsController.loadYears();
          if (target === 'appearance') this.appearanceController.loadSettings();
          if (target === 'upload') this.uploadController.loadOptions();
        }
      });
    });
  }

  _bindYearSwitcher() {
    const select = document.getElementById('admin-year-select');
    select?.addEventListener('change', (e) => {
      const year = e.target.value;
      if (year) {
        this.currentYear = year;
        AppState.setYear(year);
        this._updateYearBadge(year);
        this.loadOverviewStats();
        this.studentsController.loadStudents(year);
        this.paController.loadData(year);
        this.uploadController.loadOptions();
      }
    });
  }

  _bindDevReset() {
    const btn = document.getElementById('btn-reset-mock');
    btn?.addEventListener('click', () => {
      Modal.confirm({
        title: 'ยืนยันรีเซ็ต Mock Database',
        message: 'คุณต้องการล้างข้อมูลที่แก้ไขทั้งหมด และคืนค่ากลับสู่ชุดข้อมูลเริ่มต้นหรือไม่?',
        danger: true,
        confirmText: 'รีเซ็ตข้อมูล',
        onConfirm: () => {
          DevApi.resetMockDatabase();
          Toast.success('รีเซ็ต Mock Database เรียบร้อยแล้ว กำลังรีโหลด...');
          setTimeout(() => window.location.reload(), 800);
          return true;
        }
      });
    });
  }

  async loadYears() {
    const years = await YearsApi.getYears();
    const select = document.getElementById('admin-year-select');
    if (!select || !years) return;

    select.innerHTML = years.map(y => `
      <option value="${y.year}" ${y.year === this.currentYear ? 'selected' : ''}>ปีการศึกษา ${y.year}</option>
    `).join('');

    this._updateYearBadge(this.currentYear);
  }

  _updateYearBadge(year) {
    const badge = document.getElementById('admin-active-year-badge');
    if (badge) badge.textContent = `ปีการศึกษา ${year}`;
  }

  async loadOverviewStats() {
    try {
      const [clsData, paItems, years] = await Promise.all([
        ClassroomApi.getClassroomData(this.currentYear),
        PaApi.getItems(this.currentYear),
        YearsApi.getYears()
      ]);

      const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      setEl('ad-stat-students', clsData?.students?.length || 0);
      setEl('ad-stat-cls-docs', clsData?.documents?.length || 0);
      setEl('ad-stat-pa-items', paItems?.length || 0);
      setEl('ad-stat-years', years?.length || 0);
    } catch (err) {
      console.warn("Failed to load overview stats:", err);
    }
  }

  onYearCreated(newYear) {
    this.currentYear = newYear;
    AppState.setYear(newYear);
    this.loadYears();
    this.loadOverviewStats();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AdminPageController());
} else {
  new AdminPageController();
}
