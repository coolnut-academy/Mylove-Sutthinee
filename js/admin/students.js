/**
 * Admin Student Roster Manager
 * Suttinee Teacher Workspace
 */

import { ClassroomApi } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';
import { Utils } from '../utils.js';

export class AdminStudentsController {
  constructor(getYear) {
    this.getYear = getYear;
    this.students = [];
    this.tbody = document.getElementById('admin-students-tbody');
    this.addBtn = document.getElementById('btn-add-student');
    this.init();
  }

  init() {
    this.addBtn?.addEventListener('click', () => this.openStudentModal());
  }

  async loadStudents(year) {
    try {
      const data = await ClassroomApi.getClassroomData(year || this.getYear());
      this.students = data?.students || [];
      this.renderTable();
    } catch (err) {
      console.error("Failed to load students in admin:", err);
    }
  }

  renderTable() {
    if (!this.tbody) return;

    if (!this.students || this.students.length === 0) {
      this.tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem;">ไม่มีข้อมูลนักเรียนในปีนี้</td></tr>`;
      return;
    }

    this.tbody.innerHTML = this.students.map(s => `
      <tr>
        <td style="text-align: center; font-weight: 600;">${s.student_no}</td>
        <td><code>${Utils.escapeHtml(s.student_id)}</code></td>
        <td class="font-medium">${Utils.escapeHtml(s.prefix)}${Utils.escapeHtml(s.first_name)} ${Utils.escapeHtml(s.last_name)}</td>
        <td>${Utils.escapeHtml(s.class || '-')}</td>
        <td><span class="badge ${s.status === 'active' ? 'badge-sage' : 'badge-muted'}">${s.status === 'active' ? 'กำลังศึกษา' : s.status}</span></td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-subtle btn-sm btn-edit-student" data-std-id="${s.id}">แก้ไข</button>
        </td>
      </tr>
    `).join('');

    this.tbody.querySelectorAll('.btn-edit-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.stdId;
        const student = this.students.find(x => x.id === id);
        if (student) this.openStudentModal(student);
      });
    });
  }

  openStudentModal(student = null) {
    const isEdit = Boolean(student);
    const year = this.getYear();

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="d-flex gap-3">
        <div class="form-group" style="width: 100px;">
          <label class="form-label" for="std-modal-no">เลขที่</label>
          <input type="number" id="std-modal-no" class="form-control" value="${student?.student_no || (this.students.length + 1)}" required>
        </div>
        <div class="form-group flex-1">
          <label class="form-label" for="std-modal-id">รหัสประจำตัว</label>
          <input type="text" id="std-modal-id" class="form-control" value="${student?.student_id || ''}" required>
        </div>
      </div>
      <div class="d-flex gap-3">
        <div class="form-group" style="width: 120px;">
          <label class="form-label" for="std-modal-prefix">คำนำหน้า</label>
          <select id="std-modal-prefix" class="form-control">
            <option value="เด็กชาย" ${student?.prefix === 'เด็กชาย' ? 'selected' : ''}>เด็กชาย</option>
            <option value="เด็กหญิง" ${student?.prefix === 'เด็กหญิง' ? 'selected' : ''}>เด็กหญิง</option>
            <option value="นาย" ${student?.prefix === 'นาย' ? 'selected' : ''}>นาย</option>
            <option value="นางสาว" ${student?.prefix === 'นางสาว' ? 'selected' : ''}>นางสาว</option>
          </select>
        </div>
        <div class="form-group flex-1">
          <label class="form-label" for="std-modal-first">ชื่อ</label>
          <input type="text" id="std-modal-first" class="form-control" value="${student?.first_name || ''}" required>
        </div>
        <div class="form-group flex-1">
          <label class="form-label" for="std-modal-last">นามสกุล</label>
          <input type="text" id="std-modal-last" class="form-control" value="${student?.last_name || ''}" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="std-modal-class">ระดับชั้น</label>
        <input type="text" id="std-modal-class" class="form-control" value="${student?.class || 'ชั้นประถมศึกษาปีที่ 1/1'}">
      </div>
      <div class="form-group">
        <label class="form-label" for="std-modal-note">หมายเหตุ</label>
        <input type="text" id="std-modal-note" class="form-control" value="${student?.note || ''}">
      </div>
    `;

    Modal.open({
      title: isEdit ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่',
      body,
      confirmText: 'บันทึกข้อมูล',
      onConfirm: async () => {
        const noVal = parseInt(body.querySelector('#std-modal-no')?.value);
        const idVal = body.querySelector('#std-modal-id')?.value.trim();
        const prefixVal = body.querySelector('#std-modal-prefix')?.value;
        const firstVal = body.querySelector('#std-modal-first')?.value.trim();
        const lastVal = body.querySelector('#std-modal-last')?.value.trim();
        const classVal = body.querySelector('#std-modal-class')?.value.trim();
        const noteVal = body.querySelector('#std-modal-note')?.value.trim();

        if (!idVal || !firstVal || !lastVal) {
          Toast.error('กรุณากรอกรหัสประจำตัว ชื่อ และนามสกุลให้ครบถ้วน');
          return false;
        }

        try {
          await ClassroomApi.saveStudent({
            id: student?.id,
            year,
            student_no: noVal || 1,
            student_id: idVal,
            prefix: prefixVal,
            first_name: firstVal,
            last_name: lastVal,
            class: classVal,
            note: noteVal,
            status: student?.status || 'active'
          });
          Toast.success('บันทึกข้อมูลนักเรียนเรียบร้อยแล้ว');
          await this.loadStudents(year);
          return true;
        } catch (err) {
          Toast.error(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
          return false;
        }
      }
    });
  }
}
