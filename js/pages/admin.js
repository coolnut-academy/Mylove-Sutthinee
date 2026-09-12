/**
 * Admin Page Orchestrator — Task-First & Zero Developer Jargon
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';
import { RouterUtils } from '../router-utils.js';
import { AppState } from '../app-state.js';
import { YearsApi, PaApi, SettingsApi } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';
import { Utils } from '../utils.js';

import { AdminAuthController } from '../admin/auth.js';
import { AdminAppearanceController } from '../admin/appearance.js';
import { AdminYearsController } from '../admin/years.js';
import { AdminUploadManagerController } from '../admin/upload-manager.js';

class AdminPageController {
  constructor() {
    this.currentYear = RouterUtils.resolveYear();
    this.currentTask = 'home';
    this.init();
  }

  async init() {
    this.authController = new AdminAuthController(() => this.onAuthenticated());
    this.appearanceController = new AdminAppearanceController();
    this.yearsController = new AdminYearsController((newYear) => this.onYearCreated(newYear));
    this.uploadController = new AdminUploadManagerController(() => this.currentYear);

    this._bindTaskTabs();
    this._bindYearSwitcher();
  }

  async onAuthenticated() {
    const session = AppState.session;
    let loadError = null;
    Loading.start();
    try {
      await this.loadYears();
      if (AppState.session !== session) return;
      await this.loadSettingsProfile();
      if (AppState.session !== session) return;
      this.appearanceController.loadSettings();
      this.yearsController.loadYears();
      this.uploadController.loadOptions();
      await this._renderPaTocList();
      this._bindClassroomActions();
    } catch (err) {
      console.error("Admin init error:", err);
      loadError = err;
    } finally {
      if (loadError) Loading.fail();
      else Loading.done();
    }
  }

  _bindTaskTabs() {
    const taskBtns = document.querySelectorAll('.admin-task-tab-btn');
    taskBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        taskBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const task = btn.dataset.task;
        this.currentTask = task;

        document.querySelectorAll('.admin-task-sec').forEach(sec => sec.classList.add('d-none'));

        const activeSec = document.getElementById(`task-sec-${task}`);
        if (activeSec) {
          activeSec.classList.remove('d-none');
          activeSec.classList.add('animate-fade-in');

          if (task === 'home') this.appearanceController.loadSettings();
          if (task === 'years') this.yearsController.loadYears();
          if (task === 'upload') this.uploadController.loadOptions();
          if (task === 'pa') this._renderPaTocList();
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
        this.uploadController.loadOptions();
        this._renderPaTocList();
      }
    });
  }

  _updateYearBadge(year) {
    const badge = document.getElementById('admin-active-year-badge');
    if (badge) badge.textContent = `ปีการศึกษา ${year}`;
  }

  async loadYears() {
    const years = await YearsApi.getYears();
    const select = document.getElementById('admin-year-select');
    if (!select || !years) return;

    select.innerHTML = '';
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y.year;
      opt.textContent = `ปีการศึกษา ${y.year}${y.is_default ? ' (ปีปัจจุบัน)' : ''}`;
      if (y.year === this.currentYear) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    this._updateYearBadge(this.currentYear);
  }

  async loadSettingsProfile() {
    const settings = await SettingsApi.getSettings();
    if (!settings) return;
    if (settings.profile_image) {
      const avatar = document.getElementById('admin-top-avatar');
      if (avatar) avatar.src = settings.profile_image;
    }
  }

  async onYearCreated(newYear) {
    Toast.success(`สร้างปีการศึกษา ${newYear} สำเร็จ`);
    this.currentYear = newYear;
    AppState.setYear(newYear);
    await this.loadYears();
    this.yearsController.loadYears();
    this.uploadController.loadOptions();
    await this._renderPaTocList();
  }

  _bindClassroomActions() {
    document.querySelectorAll('.btn-cls-manage').forEach(btn => {
      btn.addEventListener('click', () => {
        const job = btn.getAttribute('data-job');
        window.open(`./classroom.html?view=${job}&year=${this.currentYear}`, '_blank');
      });
    });
  }

  async _renderPaTocList() {
    const container = document.getElementById('admin-pa-toc-list');
    if (!container) return;

    try {
      const data = await PaApi.getPaData(this.currentYear);
      const sections = data.sections || [];

      container.innerHTML = sections.map(sec => `
        <div class="card p-3 d-flex align-center justify-between flex-wrap gap-3" style="border-left: 4px solid var(--purple-400);">
          <div>
            <div class="d-flex align-center gap-2 mb-1">
              <span class="badge badge-purple font-mono">${sec.section_code}</span>
              <span class="font-semibold text-purple" style="font-size: var(--font-size-sm);">${Utils.escapeHtml(sec.title)}</span>
            </div>
            <div class="text-secondary" style="font-size: var(--font-size-xs); max-width: 600px;">
              ${Utils.escapeHtml(sec.description || 'ยังไม่มีคำอธิบาย')}
            </div>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-subtle btn-sm btn-edit-pa-sec" data-code="${sec.section_code}" data-title="${Utils.escapeHtml(sec.title)}">
              ✏️ แก้ไขข้อความ
            </button>
            <button type="button" class="btn btn-primary btn-sm btn-upload-pa-sec" data-code="${sec.section_code}">
              ⬆️ เพิ่มหลักฐาน
            </button>
          </div>
        </div>
      `).join('');

      // Bind edit button
      container.querySelectorAll('.btn-edit-pa-sec').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.getAttribute('data-code');
          const title = btn.getAttribute('data-title');
          this._openEditPaSectionModal(code, title);
        });
      });

      // Bind upload button
      container.querySelectorAll('.btn-upload-pa-sec').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.getAttribute('data-code');
          // Switch to upload task tab and pre-select section
          document.querySelector('[data-task="upload"]')?.click();
          setTimeout(() => {
            const secSelect = document.getElementById('upload-target-section');
            if (secSelect) secSelect.value = code;
          }, 150);
        });
      });

    } catch (err) {
      console.error("Failed to render PA TOC in admin:", err);
      container.innerHTML = `<div class="text-muted text-center py-4">ไม่สามารถโหลดรายการตัวชี้วัดได้</div>`;
    }
  }

  _openEditPaSectionModal(secCode, currentTitle) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="mb-3">
        <span class="badge badge-purple">ปีการศึกษา ${this.currentYear}</span>
        <span class="badge badge-gold">ตัวชี้วัด ${secCode}</span>
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-pa-title">หัวข้อตัวชี้วัด</label>
        <input type="text" id="edit-pa-title" class="form-control" value="${currentTitle}" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-pa-desc">คำอธิบายรายละเอียดการปฏิบัติงาน</label>
        <textarea id="edit-pa-desc" class="form-control" rows="4" placeholder="ระบุการปฏิบัติงานและผลลัพธ์..."></textarea>
      </div>
    `;

    Modal.open({
      title: `แก้ไขตัวชี้วัด ${secCode}`,
      body,
      confirmText: 'บันทึกข้อมูล',
      onConfirm: async () => {
        const titleInput = body.querySelector('#edit-pa-title');
        const descInput = body.querySelector('#edit-pa-desc');
        const newTitle = titleInput?.value.trim();
        const newDesc = descInput?.value.trim();

        if (!newTitle) {
          Toast.error('กรุณากรอกหัวข้อ');
          return false;
        }

        try {
          await PaApi.updateSection(secCode, {
            title: newTitle,
            description: newDesc
          });
          Toast.success(`บันทึกตัวชี้วัด "${newTitle}" เรียบร้อยแล้ว`);
          await this._renderPaTocList();
          return true;
        } catch (e) {
          Toast.error(e.message || 'บันทึกไม่สำเร็จ');
          return false;
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AdminPageController();
});
