/**
 * Admin PA Manager Controller
 * Suttinee Teacher Workspace
 */

import { PaApi } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';
import { Utils } from '../utils.js';

export class AdminPaManagerController {
  constructor(getYear) {
    this.getYear = getYear;
    this.sections = [];
    this.items = [];
    this.container = document.getElementById('admin-pa-list');
  }

  async loadData(year) {
    try {
      const targetYear = year || this.getYear();
      const [sections, items] = await Promise.all([
        PaApi.getSections(targetYear),
        PaApi.getItems(targetYear)
      ]);
      this.sections = sections || [];
      this.items = items || [];
      this.render();
    } catch (err) {
      console.error("Failed to load PA manager data:", err);
    }
  }

  render() {
    if (!this.container) return;

    if (this.sections.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">ไม่พบรายการตัวชี้วัด ว.PA ในปีนี้</div>
        </div>
      `;
      return;
    }

    this.container.innerHTML = this.sections.map(sec => {
      const secItems = this.items.filter(i => i.section_code === sec.section_code);

      return `
        <div class="card" style="padding: var(--space-4);">
          <div class="d-flex align-center justify-between mb-3">
            <div class="d-flex align-center gap-2">
              <span class="font-bold text-purple">${Utils.escapeHtml(sec.section_code)}</span>
              <span class="font-semibold">${Utils.escapeHtml(sec.title)}</span>
            </div>
            <div class="d-flex align-center gap-2">
              <span class="badge ${secItems.length > 0 ? 'badge-purple' : 'badge-muted'}">
                ${secItems.length} หลักฐาน
              </span>
              <button type="button" class="btn btn-secondary btn-sm btn-add-pa-item" data-code="${sec.section_code}">
                + เพิ่มรายการ
              </button>
            </div>
          </div>

          ${secItems.length > 0 ? `
            <div class="d-flex flex-column gap-2 mt-2">
              ${secItems.map(item => `
                <div class="queue-item" style="padding: var(--space-2) var(--space-3); background: var(--surface-card-subtle);">
                  <div class="queue-item-header">
                    <div class="d-flex align-center gap-2" style="flex: 1;">
                      <span style="font-size: 1.1rem;">${Utils.getFileTypeInfo(item.title, item.mime_type).icon}</span>
                      <span class="font-medium text-truncate" style="max-width: 320px;">${Utils.escapeHtml(item.title)}</span>
                    </div>
                    <div class="d-flex align-center gap-3">
                      <label class="d-flex align-center gap-1" style="font-size: var(--font-size-xs); cursor: pointer;">
                        <input type="checkbox" class="toggle-published" data-item-id="${item.id}" ${item.published ? 'checked' : ''}>
                        <span>แสดงผล</span>
                      </label>
                      <button type="button" class="btn btn-subtle btn-sm text-danger btn-archive-item" data-item-id="${item.id}" title="ย้ายไปคลังประวัติ">
                        จัดเก็บ
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `<div class="text-muted" style="font-size: var(--font-size-xs);">ยังไม่มีหลักฐานในตัวชี้วัดนี้</div>`}
        </div>
      `;
    }).join('');

    // Bind publish toggles
    this.container.querySelectorAll('.toggle-published').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const id = e.target.dataset.itemId;
        const published = e.target.checked;
        try {
          await PaApi.setPublished(id, published);
          Toast.success(`เปลี่ยนการแสดงผลเป็น: ${published ? 'แสดง' : 'ซ่อน'}`);
        } catch (err) {
          Toast.error('เกิดข้อผิดพลาดในการปรับสถานะ');
          e.target.checked = !published;
        }
      });
    });

    // Bind archive buttons
    this.container.querySelectorAll('.btn-archive-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.itemId;
        Modal.confirm({
          title: 'ยืนยันการจัดเก็บหลักฐาน',
          message: 'คุณต้องการย้ายหลักฐานนี้ไปยังคลังประวัติ (Archive) ใช่หรือไม่?',
          danger: true,
          onConfirm: async () => {
            try {
              await PaApi.archiveItem(id, true);
              Toast.success('จัดเก็บหลักฐานเข้าคลังประวัติเรียบร้อย');
              await this.loadData(this.getYear());
              return true;
            } catch (err) {
              Toast.error('ไม่สามารถจัดเก็บรายการได้');
              return false;
            }
          }
        });
      });
    });

    // Bind Add PA Item buttons
    this.container.querySelectorAll('.btn-add-pa-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        this.openAddItemModal(code);
      });
    });
  }

  openAddItemModal(sectionCode) {
    const year = this.getYear();

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="pa-new-title">ชื่อหลักฐาน / ผลงาน</label>
        <input type="text" id="pa-new-title" class="form-control" placeholder="เช่น แผนการจัดการเรียนรู้ Active Learning" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="pa-new-desc">คำอธิบายเพิ่มเติม</label>
        <textarea id="pa-new-desc" class="form-control" rows="2" placeholder="รายละเอียดหรือผลลัพธ์ที่เกิดขึ้นกับผู้เรียน"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="pa-new-type">ประเภทสื่อ</label>
        <select id="pa-new-type" class="form-control">
          <option value="pdf">เอกสาร PDF</option>
          <option value="image">รูปภาพ / Infographic</option>
          <option value="link">เว็บไซต์ / สื่อดิจิทัลภายนอก</option>
          <option value="doc">เอกสาร Word / งานนำเสนอ</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="pa-new-url">ลิงก์ Google Drive หรือ URL ภายนอก</label>
        <input type="url" id="pa-new-url" class="form-control" placeholder="https://drive.google.com/file/d/...">
      </div>
    `;

    Modal.open({
      title: `เพิ่มหลักฐานตัวชี้วัด ${sectionCode}`,
      body,
      confirmText: 'บันทึกหลักฐาน',
      onConfirm: async () => {
        const title = body.querySelector('#pa-new-title')?.value.trim();
        const desc = body.querySelector('#pa-new-desc')?.value.trim();
        const type = body.querySelector('#pa-new-type')?.value;
        const url = body.querySelector('#pa-new-url')?.value.trim();

        if (!title) {
          Toast.error('กรุณากรอกชื่อหลักฐาน');
          return false;
        }

        try {
          await PaApi.saveItem({
            year,
            section_code: sectionCode,
            title,
            description: desc,
            type,
            external_url: url || 'https://drive.google.com/',
            file_size: 1500000
          });
          Toast.success('เพิ่มหลักฐาน ว.PA สำเร็จ');
          await this.loadData(year);
          return true;
        } catch (err) {
          Toast.error(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
          return false;
        }
      }
    });
  }
}
