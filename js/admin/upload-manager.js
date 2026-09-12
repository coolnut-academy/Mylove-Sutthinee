/**
 * Bulk Upload UX Controller
 * Suttinee Teacher Workspace
 * Features: Drag & Drop, Multi-file Queue, Progress Bars, Concurrency, Retry
 */

import { FileApi, YearsApi, PaApi } from '../api.js';
import { CONFIG } from '../config.js';
import { Toast } from '../toast.js';
import { Utils } from '../utils.js';
import { prepareUploadPayload } from '../image-utils.js';

export class AdminUploadManagerController {
  constructor(getYear) {
    this.getYear = getYear;
    this.queue = [];
    this.isUploading = false;
    this.dropzone = document.getElementById('upload-dropzone');
    this.fileInput = document.getElementById('file-input-hidden');
    this.queueListEl = document.getElementById('upload-queue-list');
    this.queueCountEl = document.getElementById('queue-count');
    this.startBtn = document.getElementById('btn-start-upload');
    this.clearBtn = document.getElementById('btn-clear-queue');
    this.targetYearSelect = document.getElementById('upload-target-year');
    this.targetSectionSelect = document.getElementById('upload-target-section');

    this.init();
  }

  init() {
    this._bindDropzone();
    this._bindControls();
  }

  async loadOptions(targetYear = this.getYear()) {
    const year = String(targetYear);
    const requestId = this._optionsRequestId = (this._optionsRequestId || 0) + 1;
    this._optionsLoading = true;
    this._optionsError = false;
    if (this.startBtn) this.startBtn.disabled = true;
    try {
      const [years, sections] = await Promise.all([
        YearsApi.getYears(),
        PaApi.getSections(year)
      ]);
      if (requestId !== this._optionsRequestId) return;
      this._optionsYear = year;

      if (this.targetYearSelect && years) {
        this.targetYearSelect.innerHTML = years.map(y => `
          <option value="${y.year}" ${String(y.year) === year ? 'selected' : ''}>ปีการศึกษา ${y.year}</option>
        `).join('');
      }

      if (this.targetSectionSelect && sections) {
        this.targetSectionSelect.innerHTML = sections.map(s => `
          <option value="${s.section_code}">ตัวชี้วัด ${s.section_code} — ${Utils.escapeHtml(s.title)}</option>
        `).join('');
      }
    } catch (err) {
      if (requestId === this._optionsRequestId) this._optionsError = true;
      console.error("Failed to load upload manager options:", err);
    } finally {
      if (requestId === this._optionsRequestId) {
        this._optionsLoading = false;
        if (this._selectedSection && this.targetSectionSelect) this.targetSectionSelect.value = this._selectedSection;
        if (this.startBtn) this.startBtn.disabled = this.isUploading || this._optionsError;
      }
    }
  }

  selectSection(code) {
    this._selectedSection = code;
    if (this.targetSectionSelect) this.targetSectionSelect.value = code;
  }

  _bindDropzone() {
    if (!this.dropzone) return;

    this.dropzone.addEventListener('click', () => {
      this.fileInput?.click();
    });

    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('dragover');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      if (e.dataTransfer?.files?.length) {
        this.addFiles(Array.from(e.dataTransfer.files));
      }
    });

    this.fileInput?.addEventListener('change', (e) => {
      if (e.target.files?.length) {
        this.addFiles(Array.from(e.target.files));
        e.target.value = ''; // Reset
      }
    });
  }

  _bindControls() {
    this.targetYearSelect?.addEventListener('change', event => {
      this._selectedSection = null;
      this.loadOptions(event.target.value);
    });
    this.targetSectionSelect?.addEventListener('change', event => {
      this._selectedSection = event.target.value;
    });
    this.startBtn?.addEventListener('click', () => {
      this.startUpload();
    });

    this.clearBtn?.addEventListener('click', () => {
      this.queue = [];
      this.renderQueue();
    });
  }

  addFiles(files) {
    let warningTriggered = false;

    files.forEach(file => {
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > CONFIG.MAX_UPLOAD_SIZE_MB) {
        Toast.error(`ไฟล์ "${file.name}" มีขนาดเกิน ${CONFIG.MAX_UPLOAD_SIZE_MB}MB แนะนำเพิ่มผ่าน Google Drive Link`);
        return;
      }

      if (sizeMb > CONFIG.WARN_LARGE_FILE_MB && !warningTriggered) {
        Toast.info(`บางไฟล์มีขนาดค่อนข้างใหญ่ อาจใช้เวลาอัปโหลดนานขึ้น`);
        warningTriggered = true;
      }

      const queueItem = {
        id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'waiting', // waiting | reading | uploading | success | failed
        progress: 0,
        error: null
      };

      this.queue.push(queueItem);
    });

    this.renderQueue();
  }

  renderQueue() {
    if (!this.queueListEl) return;

    if (this.queueCountEl) this.queueCountEl.textContent = this.queue.length;
    if (this.startBtn) {
      const hasPending = this.queue.some(i => i.status === 'waiting' || i.status === 'failed');
      this.startBtn.disabled = !hasPending || this.isUploading;
    }

    if (this.queue.length === 0) {
      this.queueListEl.innerHTML = `
        <div class="text-muted text-center" style="padding: 2rem; font-size: var(--font-size-sm);">
          ยังไม่มีไฟล์ในคิวอัปโหลด
        </div>
      `;
      return;
    }

    this.queueListEl.innerHTML = this.queue.map(item => {
      const typeInfo = Utils.getFileTypeInfo(item.name, item.type);
      const statusLabels = {
        waiting: '<span class="badge badge-muted">รออัปโหลด</span>',
        reading: '<span class="badge badge-purple">กำลังอ่านไฟล์...</span>',
        uploading: `<span class="badge badge-purple">กำลังส่งขึ้นคลาวด์ ประมาณ ${item.progress}%</span>`,
        success: '<span class="badge badge-sage">✓ อัปโหลดสำเร็จ</span>',
        failed: '<span class="badge badge-rose">✕ ไม่สำเร็จ</span>'
      };

      return `
        <div class="queue-item" id="item-${item.id}">
          <div class="queue-item-header">
            <div class="d-flex align-center gap-2" style="flex: 1;">
              <span style="font-size: 1.25rem;">${typeInfo.icon}</span>
              <span class="font-medium text-truncate" style="max-width: 380px;">${Utils.escapeHtml(item.name)}</span>
              <span class="text-muted" style="font-size: var(--font-size-xs);">(${Utils.formatFileSize(item.size)})</span>
            </div>
            <div class="d-flex align-center gap-2">
              ${statusLabels[item.status] || ''}
              ${item.status === 'failed' ? `<button type="button" class="btn btn-subtle btn-sm btn-retry-item" data-id="${item.id}">ลองใหม่</button>` : ''}
              ${item.status === 'waiting' ? `<button type="button" class="btn-icon btn-remove-item" data-id="${item.id}">&times;</button>` : ''}
            </div>
          </div>
          <div class="queue-progress-track">
            <div class="queue-progress-bar ${item.status}" style="width: ${item.progress}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    // Bind remove
    this.queueListEl.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.queue = this.queue.filter(i => i.id !== id);
        this.renderQueue();
      });
    });

    // Bind retry
    this.queueListEl.querySelectorAll('.btn-retry-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = this.queue.find(i => i.id === id);
        if (item) {
          item.status = 'waiting';
          item.progress = 0;
          this.renderQueue();
          this.startUpload();
        }
      });
    });
  }

  async startUpload() {
    if (this.isUploading || this._optionsLoading || this._optionsError) return;
    if (!this.targetSectionSelect?.value) {
      Toast.error('กรุณาเลือกตัวชี้วัดก่อนอัปโหลด');
      return;
    }
    this.isUploading = true;
    if (this.startBtn) this.startBtn.disabled = true;

    const targetYear = this.targetYearSelect?.value || this.getYear();
    const targetSection = this.targetSectionSelect?.value || '1.1';

    for (const item of this.queue) {
      if (item.status === 'success') continue;

      item.status = 'uploading';
      item.progress = 20;
      this.renderQueue();

      try {
        // ขั้นตอนที่ 1: บีบอัดภาพด้วย Canvas / เตรียม Base64
        item.progress = 40;
        this.renderQueue();

        let uploadPayload;
        if (item.file) {
          uploadPayload = await prepareUploadPayload(item.file, {
            sectionCode: targetSection,
            year: targetYear
          });
        } else {
          uploadPayload = {
            name: item.name,
            size: item.size,
            type: item.type,
            sectionCode: targetSection,
            year: targetYear
          };
        }

        // ขั้นตอนที่ 2: นำส่งขึ้น Cloud และบันทึกฐานข้อมูล
        item.progress = 75;
        this.renderQueue();

        await FileApi.uploadFile(uploadPayload);

        item.status = 'success';
        item.progress = 100;
        this.renderQueue();
      } catch (err) {
        console.error(`Upload error for ${item.name}:`, err);
        item.status = 'failed';
        item.error = err.message || 'เกิดข้อผิดพลาดในการอัปโหลด';
        this.renderQueue();
      }
    }

    this.isUploading = false;
    const successCount = this.queue.filter(i => i.status === 'success').length;
    Toast.success(`อัปโหลดหลักฐานเสร็จสิ้น (${successCount}/${this.queue.length} ไฟล์)`);
    if (this.startBtn) this.startBtn.disabled = false;
  }
}
