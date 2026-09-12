/**
 * Admin Year Manager
 * Suttinee Teacher Workspace
 */

import { YearsApi } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';
import { Utils } from '../utils.js';

export class AdminYearsController {
  constructor(onYearCreated) {
    this.onYearCreated = onYearCreated;
    this.years = [];
    this.tbody = document.getElementById('admin-years-tbody');
    this.createBtn = document.getElementById('btn-create-year');
    this.init();
  }

  init() {
    this.createBtn?.addEventListener('click', () => this.openCreateYearModal());
  }

  async loadYears() {
    try {
      this.years = await YearsApi.getYears();
      this.renderTable();
    } catch (err) {
      console.error("Failed to load years:", err);
    }
  }

  renderTable() {
    if (!this.tbody) return;

    if (!this.years || this.years.length === 0) {
      this.tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem;">ไม่มีข้อมูลปีการศึกษา</td></tr>`;
      return;
    }

    this.tbody.innerHTML = this.years.map(y => `
      <tr>
        <td class="font-semibold text-purple">${Utils.escapeHtml(y.year)}</td>
        <td>${Utils.escapeHtml(y.label)}</td>
        <td>
          <span class="badge ${y.status === 'active' ? 'badge-sage' : 'badge-muted'}">
            ${y.status === 'active' ? 'เปิดใช้งาน (Active)' : 'คลังประวัติ (Archived)'}
          </span>
        </td>
        <td>
          ${y.is_default ? '<span class="badge badge-purple">✓ ค่าเริ่มต้น</span>' : '<span class="text-muted">-</span>'}
        </td>
        <td style="font-size: var(--font-size-xs);" class="text-secondary">
          ${y.pa_period_start || '-'} ถึง ${y.pa_period_end || '-'}
        </td>
        <td style="font-size: var(--font-size-xs);" class="text-muted">
          ${y.created_at ? Utils.formatDateThai(y.created_at, true) : '-'}
        </td>
      </tr>
    `).join('');
  }

  openCreateYearModal() {
    const nextYear = String(parseInt(this.years[0]?.year || '2569') + 1);

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="modal-input-year">ปีการศึกษา (พ.ศ.)</label>
        <input type="text" id="modal-input-year" class="form-control" value="${nextYear}" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="modal-input-label">ชื่อกำกับ</label>
        <input type="text" id="modal-input-label" class="form-control" value="ปีการศึกษา ${nextYear}">
      </div>
      <div class="d-flex gap-4">
        <div class="form-group flex-1">
          <label class="form-label" for="modal-input-start">วันเริ่มรอบประเมิน ว.PA</label>
          <input type="date" id="modal-input-start" class="form-control">
        </div>
        <div class="form-group flex-1">
          <label class="form-label" for="modal-input-end">วันสิ้นสุดรอบประเมิน</label>
          <input type="date" id="modal-input-end" class="form-control">
        </div>
      </div>
      <div class="d-flex align-center gap-2 mt-2">
        <input type="checkbox" id="modal-input-default" style="width: 18px; height: 18px;">
        <label for="modal-input-default" class="form-label" style="margin-bottom: 0; cursor: pointer;">
          ตั้งเป็นปีการศึกษาเริ่มต้น (Default Active Year)
        </label>
      </div>
    `;

    Modal.open({
      title: 'สร้างปีการศึกษาใหม่',
      body,
      confirmText: 'บันทึกปีการศึกษา',
      onConfirm: async () => {
        const yearVal = body.querySelector('#modal-input-year')?.value.trim();
        const labelVal = body.querySelector('#modal-input-label')?.value.trim();
        const startVal = body.querySelector('#modal-input-start')?.value;
        const endVal = body.querySelector('#modal-input-end')?.value;
        const defaultVal = body.querySelector('#modal-input-default')?.checked;

        if (!yearVal || !/^\d{4}$/.test(yearVal)) {
          Toast.error('กรุณากรอกปีการศึกษาเป็นตัวเลข พ.ศ. 4 หลัก');
          return false;
        }

        try {
          await YearsApi.createYear({
            year: yearVal,
            label: labelVal,
            pa_period_start: startVal,
            pa_period_end: endVal,
            is_default: defaultVal
          });
          Toast.success(`สร้างปีการศึกษา ${yearVal} สำเร็จ`);
          await this.loadYears();
          if (this.onYearCreated) this.onYearCreated(yearVal);
          return true;
        } catch (err) {
          Toast.error(err.message || 'ไม่สามารถสร้างปีการศึกษาได้');
          return false;
        }
      }
    });
  }
}
