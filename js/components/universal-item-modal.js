/**
 * Universal Item Entry Modal
 * Supports:
 * 1. Image + Text + Link (If no link, click produces no action)
 * 2. eBook (PDF) + Dynamic Fields + Cover -> Online Flipbook Reader
 * 3. Excel (.xlsx/.xls/.csv) + Dynamic Fields + Cover -> Google Sheets Viewer
 * 4. Cover Aspect Ratio (16:9 Landscape, 3:4 Portrait, 1:1 Square)
 * 5. Dynamic Custom Fields with `+` and `-`
 * Suttinee Teacher Workspace
 */

import { compressImage, readFileAsBase64 } from '../image-utils.js';
import { Toast } from '../toast.js';
import { AppState } from '../app-state.js';
import { Cache } from '../cache.js';
import { Loading } from '../loading.js';

export class UniversalItemModal {
  static saving = false;
  static modalEl = null;
  static currentContext = {
    module: 'classroom', // 'classroom' | 'pa'
    year: '2569',
    category: '',
    sectionCode: '',
    sectionTitle: '',
    onSaveSuccess: null
  };

  static state = {
    selectedType: 'link', // 'link' | 'ebook' | 'excel'
    selectedRatio: '16:9', // '16:9' | '3:4' | '1:1'
    coverBase64: null,
    fileBase64: null,
    fileName: '',
    fileSize: 0,
    fields: []
  };

  static open(options = {}) {
    if (this.saving) return;
    this.currentContext = {
      module: options.module || 'classroom',
      year: options.year || '2569',
      category: options.category || '',
      sectionCode: options.sectionCode || '',
      sectionTitle: options.sectionTitle || '',
      onSaveSuccess: options.onSaveSuccess || null
    };

    this._ensureModal();
    this._resetState();

    const titleEl = document.getElementById('u-modal-context-title');
    if (titleEl) {
      titleEl.textContent = this.currentContext.sectionTitle || 'เพิ่มข้อมูลใหม่';
    }

    const yearBadge = document.getElementById('u-modal-year-badge');
    if (yearBadge) {
      yearBadge.textContent = `ปีการศึกษา ${this.currentContext.year}`;
    }

    this.modalEl.classList.remove('d-none');
    document.body.classList.add('modal-open');
  }

  static close() {
    if (this.saving) {
      Toast.error('กำลังบันทึก กรุณารอผลก่อนปิดหน้าต่าง');
      return;
    }
    if (!this.modalEl) return;
    this.modalEl.classList.add('d-none');
    document.body.classList.remove('modal-open');
  }

  static _resetState() {
    document.getElementById('u-save-progress')?.classList.add('d-none');
    this.state = {
      selectedType: 'link',
      selectedRatio: '16:9',
      coverBase64: null,
      fileBase64: null,
      fileName: '',
      fileSize: 0,
      fields: []
    };

    // Reset radio buttons
    const typeRadios = document.querySelectorAll('input[name="u-content-type"]');
    typeRadios.forEach(r => r.checked = r.value === 'link');

    const ratioRadios = document.querySelectorAll('input[name="u-cover-ratio"]');
    ratioRadios.forEach(r => r.checked = r.value === '16:9');

    // Reset inputs
    const urlInput = document.getElementById('u-item-url');
    if (urlInput) urlInput.value = '';

    const btnTextInput = document.getElementById('u-item-btn-text');
    if (btnTextInput) btnTextInput.value = '';

    const coverInput = document.getElementById('u-cover-input');
    if (coverInput) coverInput.value = '';

    const fileInput = document.getElementById('u-doc-file-input');
    if (fileInput) fileInput.value = '';

    const coverPreview = document.getElementById('u-cover-preview');
    if (coverPreview) {
      coverPreview.style.backgroundImage = 'none';
      coverPreview.classList.add('empty');
    }

    this._updateTypeVisibility('link');
    this._updateRatioDisplay('16:9');

    // Reset Dynamic Fields
    this._initDynamicFields([
      { label: 'ชื่อรายการ / ผลงาน', value: '' },
      { label: 'ผู้จัดทำ / เจ้าของผลงาน', value: 'นางสาวศุทธินี ถาวร' },
      { label: 'รายละเอียดโดยย่อ', value: '' }
    ]);
  }

  static _initDynamicFields(defaultFields = []) {
    const container = document.getElementById('u-dynamic-fields-container');
    if (!container) return;
    container.innerHTML = '';
    defaultFields.forEach(f => this.addFieldRow(f.label, f.value));
  }

  static addFieldRow(label = '', value = '') {
    const container = document.getElementById('u-dynamic-fields-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'u-field-row';
    row.innerHTML = `
      <div class="u-field-col-label">
        <input type="text" class="form-control u-field-label-input" placeholder="ชื่อหัวข้อ (เช่น ชื่อเกม, ระดับชั้น)" value="${this._escape(label)}" required>
      </div>
      <div class="u-field-col-val">
        <input type="text" class="form-control u-field-val-input" placeholder="ข้อความรายละเอียด" value="${this._escape(value)}" required>
      </div>
      <button type="button" class="btn btn-icon btn-danger btn-remove-field" title="ลบหัวข้อนี้">&times;</button>
    `;

    row.querySelector('.btn-remove-field').addEventListener('click', () => {
      const rows = container.querySelectorAll('.u-field-row');
      if (rows.length > 1) {
        row.remove();
      } else {
        Toast.info('ต้องมีข้อมูลอย่างน้อย 1 หัวข้อ');
      }
    });

    container.appendChild(row);
  }

  static _getFieldsData() {
    const container = document.getElementById('u-dynamic-fields-container');
    if (!container) return [];

    const rows = container.querySelectorAll('.u-field-row');
    const result = [];
    rows.forEach(r => {
      const label = r.querySelector('.u-field-label-input')?.value.trim() || '';
      const value = r.querySelector('.u-field-val-input')?.value.trim() || '';
      if (label || value) {
        result.push({ label, value });
      }
    });
    return result;
  }

  static _updateTypeVisibility(type) {
    this.state.selectedType = type;
    const linkGroup = document.getElementById('u-link-group');
    const docFileGroup = document.getElementById('u-doc-file-group');
    const docFileLabel = document.getElementById('u-doc-file-label');
    const docFileInput = document.getElementById('u-doc-file-input');
    const docFileHint = document.getElementById('u-doc-file-hint');

    if (type === 'link') {
      if (linkGroup) linkGroup.classList.remove('d-none');
      if (docFileGroup) docFileGroup.classList.add('d-none');
    } else if (type === 'ebook') {
      if (linkGroup) linkGroup.classList.add('d-none');
      if (docFileGroup) docFileGroup.classList.remove('d-none');
      if (docFileLabel) docFileLabel.textContent = '📄 แนบไฟล์ PDF สำหรับ eBook ออนไลน์ *';
      if (docFileInput) docFileInput.accept = '.pdf,application/pdf';
      if (docFileHint) docFileHint.textContent = 'รองรับไฟล์ PDF ขนาดไม่เกิน 30MB';
    } else if (type === 'excel') {
      if (linkGroup) linkGroup.classList.add('d-none');
      if (docFileGroup) docFileGroup.classList.remove('d-none');
      if (docFileLabel) docFileLabel.textContent = '📊 แนบไฟล์สเปรดชีต Excel *';
      if (docFileInput) docFileInput.accept = '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
      if (docFileHint) docFileHint.textContent = 'รองรับไฟล์ .xlsx, .xls, .csv';
    }
  }

  static _updateRatioDisplay(ratio) {
    this.state.selectedRatio = ratio;
    const preview = document.getElementById('u-cover-preview');
    if (!preview) return;

    preview.classList.remove('ratio-16-9', 'ratio-3-4', 'ratio-1-1');
    if (ratio === '16:9') preview.classList.add('ratio-16-9');
    else if (ratio === '3:4') preview.classList.add('ratio-3-4');
    else if (ratio === '1:1') preview.classList.add('ratio-1-1');
  }

  static async _handleCoverSelected(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    this.state.coverPending = true;
    this.state.coverBase64 = null;
    const progressBox = document.getElementById('u-cover-progress-box');
    const progressBar = document.getElementById('u-cover-progress-bar');
    const progressPercent = document.getElementById('u-cover-progress-percent');
    const progressStatus = document.getElementById('u-cover-progress-status');

    try {
      if (progressBox) progressBox.classList.remove('d-none');

      // Compress with Client-Side Canvas (Enforcing A4 Max Dimensions)
      const compressed = await compressImage(file, {
        quality: 0.82,
        onProgress: (pct, msg) => {
          if (progressPercent) progressPercent.textContent = `${pct}%`;
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (progressStatus) progressStatus.textContent = msg;
        }
      });

      this.state.coverBase64 = compressed.dataUrl;
      const preview = document.getElementById('u-cover-preview');
      if (preview) {
        preview.style.backgroundImage = `url("${compressed.dataUrl}")`;
        preview.classList.remove('empty');
      }
      Toast.success(`บีบอัดภาพหน้าปกเรียบร้อย ขนาดไม่เกิน A4 (${Math.round(compressed.size / 1024)} KB)`);
    } catch (err) {
      console.error('Failed to compress cover image:', err);
      // Fallback direct base64
      const b64 = await readFileAsBase64(file);
      const dataUrl = `data:${file.type};base64,${b64}`;
      this.state.coverBase64 = dataUrl;
      const preview = document.getElementById('u-cover-preview');
      if (preview) {
        preview.style.backgroundImage = `url("${dataUrl}")`;
        preview.classList.remove('empty');
      }
    } finally {
      this.state.coverPending = false;
      setTimeout(() => {
        if (progressBox) progressBox.classList.add('d-none');
      }, 600);
    }
  }

  static async _handleDocFileSelected(file) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      Toast.error('ไฟล์มีขนาดใหญ่เกิน 25MB (ขีดจำกัด Google Apps Script)');
      return;
    }
    this.state.fileName = file.name;
    this.state.fileSize = file.size;

    const b64 = await readFileAsBase64(file);
    this.state.fileBase64 = b64;
    Toast.success(`โหลดไฟล์ ${file.name} เรียบร้อย (${Math.round(file.size / 1024)} KB)`);
  }

  static async _handleSave() {
    if (this.saving) return;
    if (this.state.coverPending) {
      Toast.error('กรุณารอเตรียมภาพหน้าปกให้เสร็จก่อนบันทึก');
      return;
    }
    if (!AppState.isAdmin()) {
      Toast.error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถบันทึกข้อมูลได้ กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    const fields = this._getFieldsData();
    if (fields.length === 0) {
      Toast.error('กรุณาระบุข้อมูลอย่างน้อย 1 หัวข้อ');
      return;
    }

    const type = this.state.selectedType;
    let itemUrl = '';
    let btnText = '';

    if (type === 'link') {
      const rawUrl = document.getElementById('u-item-url')?.value.trim() || '';
      if (rawUrl) {
        itemUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      }
      btnText = document.getElementById('u-item-btn-text')?.value.trim() || 'เปิดเว็บแอป';
    } else {
      if (!this.state.fileBase64) {
        Toast.error(type === 'ebook' ? 'กรุณาแนบไฟล์ PDF สำหรับ eBook' : 'กรุณาแนบไฟล์ Excel');
        return;
      }
      btnText = document.getElementById('u-item-btn-text')?.value.trim() || (type === 'ebook' ? '📖 เปิดอ่าน eBook ออนไลน์' : '📊 เปิดดูสเปรดชีตออนไลน์');
    }

    // Determine primary title from the first field value
    const primaryTitle = fields[0]?.value || 'รายการผลงาน';

    const saveBtn = document.getElementById('u-modal-save-btn');
    this.saving = true;
    this.state.submissionId ||= this.currentContext.editingItem?.id ||
      `${this.currentContext.module === 'pa' ? 'pa_item' : 'cls_doc'}_${crypto.randomUUID()}`;
    document.getElementById('u-save-progress')?.classList.remove('d-none');
    Loading.start('กำลังเตรียมข้อมูลสำหรับบันทึก...');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '⏳ กำลังเตรียมนำส่งข้อมูล...';
    }

    try {
      const { DataProvider } = await import('../data-provider.js');

      // 1. อัปโหลดภาพหน้าปกขึ้น Google Drive หากผู้ใช้อัปโหลดภาพเข้ามาเอง
      let coverUrl = this.state.coverBase64;
      if (coverUrl && coverUrl.startsWith('data:image/')) {
        try {
          if (saveBtn) saveBtn.innerHTML = '⏳ กำลังนำส่งภาพหน้าปกขึ้น Google Drive...';
          Loading.set(15, 'กำลังอัปโหลดภาพหน้าปก...');
          const commaIdx = coverUrl.indexOf(',');
          const mimeMatch = coverUrl.substring(0, commaIdx).match(/:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const rawBase64 = coverUrl.substring(commaIdx + 1);

          const coverRes = await DataProvider.file.uploadFile({
            name: `${primaryTitle.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, '_')}_cover_${Date.now()}.jpg`,
            year: String(this.currentContext.year || '2567'),
            sectionCode: this.currentContext.sectionCode || this.currentContext.category || '1.1',
            type: mimeType,
            base64Data: rawBase64,
            module: this.currentContext.module,
            category: this.currentContext.category,
            skipSheetInsert: true
          });

          const coverItem = coverRes?.item || coverRes;
          if (!coverItem?.drive_file_id || !(coverItem.thumbnail_url || coverItem.external_url)) {
            throw new Error('ไม่ได้รับผลยืนยันการอัปโหลดภาพจาก Google Drive');
          }
          if (coverItem) {
            coverUrl = coverItem.thumbnail_url || coverItem.external_url || coverItem.drive_url || coverUrl;
            this.state.coverBase64 = coverUrl;
          }
        } catch (coverErr) {
          throw new Error('อัปโหลดภาพหน้าปกไม่สำเร็จ: ' + coverErr.message);
        }
      } else if (!coverUrl) {
        coverUrl = './assets/fallback/classroom-cover.svg';
      }

      // 2. อัปโหลดไฟล์เอกสาร (PDF หรือ Excel) ขึ้น Google Drive
      let driveFileId = '';
      if (this.state.fileBase64) {
        if (saveBtn) saveBtn.innerHTML = '⏳ กำลังนำส่งไฟล์เอกสารขึ้น Google Drive...';
        Loading.set(45, 'กำลังอัปโหลดไฟล์เอกสาร...');
        let rawDocB64 = this.state.fileBase64;
        let docMime = type === 'ebook' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        if (rawDocB64.startsWith('data:')) {
          const commaIdx = rawDocB64.indexOf(',');
          const m = rawDocB64.substring(0, commaIdx).match(/:(.*?);/);
          if (m) docMime = m[1];
          rawDocB64 = rawDocB64.substring(commaIdx + 1);
        }

        const docRes = await DataProvider.file.uploadFile({
          name: this.state.fileName || `${primaryTitle.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, '_')}.${type === 'ebook' ? 'pdf' : 'xlsx'}`,
          year: String(this.currentContext.year || '2567'),
          sectionCode: this.currentContext.sectionCode || this.currentContext.category || '1.1',
          type: docMime,
          base64Data: rawDocB64,
          module: this.currentContext.module,
            category: this.currentContext.category,
            skipSheetInsert: true
        });

        const docItem = docRes?.item || docRes;
        if (!docItem?.drive_file_id || !(docItem.external_url || docItem.drive_url || docItem.preview_url)) {
          throw new Error('ไม่ได้รับผลยืนยันการอัปโหลดเอกสารจาก Google Drive');
        }
        if (docItem) {
          driveFileId = docItem.drive_file_id || '';
          itemUrl = docItem.external_url || docItem.drive_url || docItem.preview_url || itemUrl;
        }
      }

      // 3. บันทึกข้อมูลกำกับลง Google Sheets
      if (saveBtn) saveBtn.innerHTML = '⏳ กำลังบันทึกข้อมูลลง Google Sheets...';
      Loading.set(70, 'กำลังบันทึกและยืนยันข้อมูลใน Google Sheets...');
      const newItem = {
        id: this.state.submissionId,
        year: String(this.currentContext.year || '2567'),
        category: this.currentContext.category || '',
        section_code: this.currentContext.sectionCode || '',
        title: primaryTitle,
        description: fields[1]?.value || '',
        type: type,
        cover_url: coverUrl,
        cover_ratio: this.state.selectedRatio || '16:9',
        item_url: itemUrl,
        button_text: btnText,
        drive_file_id: driveFileId,
        file_name: this.state.fileName || '',
        file_size: this.state.fileSize || 0,
        fields: fields,
        sort_order: 1,
        published: true,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 💡 ส่ง id เฉพาะเมื่อเป็นการแก้ไขรายการเดิม (สำหรับรายการใหม่ ให้ Google Sheets ทำการ appendRow ลงแถวใหม่)
      if (this.currentContext.editingItem && this.currentContext.editingItem.id) {
        newItem.id = this.currentContext.editingItem.id;
      }

      let savedResult = null;
      if (this.currentContext.module === 'pa') {
        savedResult = await DataProvider.pa.saveItem(newItem);
      } else {
        savedResult = await DataProvider.classroom.saveDocument(newItem);
      }

      // Force-clear localStorage cache for fresh data
      Cache.invalidate('classroom');
      Cache.invalidate('pa');

      this.currentContext.editingItem = savedResult;
      Loading.set(95, 'กำลังแสดงรายการที่บันทึกแล้ว...');
      if (typeof this.currentContext.onSaveSuccess === 'function') {
        await this.currentContext.onSaveSuccess(savedResult || newItem);
      }
      Toast.success('บันทึกข้อมูลและนำส่ง Google Cloud เรียบร้อยแล้ว');
      Loading.done('บันทึกและแสดงรายการเรียบร้อย');
      this.saving = false;
      this.close();
    } catch (err) {
      console.error('Error saving universal item:', err);
      Loading.fail(err.message || 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง');
      if (err.savedItem) this.currentContext.editingItem = err.savedItem;
      Toast.error('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      this.saving = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 บันทึกข้อมูล';
      }
    }
  }

  static _escape(str) {
    return String(str || '').replace(/"/g, '&quot;');
  }

  static _ensureModal() {
    if (this.modalEl) return;

    const modal = document.createElement('div');
    modal.id = 'universal-item-modal';
    modal.className = 'u-modal-overlay d-none';
    modal.innerHTML = `
      <div class="u-modal-dialog">
        <!-- Header -->
        <div class="u-modal-header">
          <div>
            <div class="d-flex align-center gap-2 mb-1">
              <span class="badge badge-purple" id="u-modal-year-badge">ปีการศึกษา 2569</span>
              <span class="badge badge-gold">เพิ่มข้อมูลจัดแสดง</span>
            </div>
            <h3 class="u-modal-title" id="u-modal-context-title">เพิ่มข้อมูลผลงาน / จัดแสดง</h3>
          </div>
          <button type="button" class="btn btn-icon" id="u-modal-close-btn" aria-label="Close">&times;</button>
        </div>

        <!-- Body -->
        <div class="u-modal-body">
          <!-- Step 1: Content Type Selection -->
          <div class="form-group mb-4">
            <label class="form-label font-bold text-purple">1. เลือกรูปแบบข้อมูลที่ต้องการนำเสนอ</label>
            <div class="u-type-selector-grid">
              <label class="u-type-card">
                <input type="radio" name="u-content-type" value="link" checked>
                <div class="u-type-card-body">
                  <span class="u-type-icon">🖼️</span>
                  <div class="u-type-text">
                    <div class="font-bold">รูปภาพ + ข้อมูล + ลิงก์</div>
                    <div class="text-muted text-xs">ภาพ Cover + รายละเอียด + URL (ถ้าไม่มีลิงก์ กดแล้วไม่มีอะไรเกิดขึ้น)</div>
                  </div>
                </div>
              </label>

              <label class="u-type-card">
                <input type="radio" name="u-content-type" value="ebook">
                <div class="u-type-card-body">
                  <span class="u-type-icon">📖</span>
                  <div class="u-type-text">
                    <div class="font-bold">หนังสือ eBook ออนไลน์ (PDF)</div>
                    <div class="text-muted text-xs">โยนไฟล์ PDF + ภาพ Cover + เปิดอ่านแบบพลิกหน้าหนังสือในเว็บ</div>
                  </div>
                </div>
              </label>

              <label class="u-type-card">
                <input type="radio" name="u-content-type" value="excel">
                <div class="u-type-card-body">
                  <span class="u-type-icon">📊</span>
                  <div class="u-type-text">
                    <div class="font-bold">สเปรดชีต Excel (Google Sheets)</div>
                    <div class="text-muted text-xs">โยนไฟล์ Excel (.xlsx) + ภาพ Cover + เปิดดูตารางแบบชีตออนไลน์</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 2: Cover Aspect Ratio Selection -->
          <div class="form-group mb-4">
            <label class="form-label font-bold text-purple">2. สัดส่วนภาพหน้าปก (Cover Ratio)</label>
            <div class="u-ratio-selector-row">
              <label class="u-ratio-chip">
                <input type="radio" name="u-cover-ratio" value="16:9" checked>
                <span>แนวนอน (16:9)</span>
              </label>
              <label class="u-ratio-chip">
                <input type="radio" name="u-cover-ratio" value="3:4">
                <span>แนวตั้ง (3:4 / A4)</span>
              </label>
              <label class="u-ratio-chip">
                <input type="radio" name="u-cover-ratio" value="1:1">
                <span>สี่เหลี่ยมจัตุรัส (1:1)</span>
              </label>
            </div>
          </div>

          <!-- Step 3: Cover Image Upload -->
          <div class="form-group mb-4">
            <label class="form-label font-bold text-purple">3. ภาพหน้าปก (Cover Image)</label>
            <div class="u-cover-upload-wrapper">
              <div class="u-cover-preview empty ratio-16-9" id="u-cover-preview">
                <div class="u-cover-placeholder-content">
                  <span style="font-size: 2rem;">🖼️</span>
                  <span>คลิกหรือลากภาพมาวางที่นี่</span>
                </div>
              </div>
              <input type="file" id="u-cover-input" accept="image/jpeg,image/png,image/webp" class="u-hidden-file-input">
            </div>

            <!-- Live Progress Box during Compression -->
            <div id="u-cover-progress-box" class="d-none" style="background: var(--purple-50); padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--purple-200); margin-top: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--purple-900); margin-bottom: 4px;">
                <span id="u-cover-progress-status" style="font-weight: 500;">กำลังบีบอัดภาพหน้าปก (ขนาดไม่เกิน A4)...</span>
                <span id="u-cover-progress-percent" style="font-weight: 700; color: var(--purple-700); font-size: 0.8125rem;">0%</span>
              </div>
              <div style="width: 100%; height: 6px; background: rgba(169, 134, 222, 0.2); border-radius: 999px; overflow: hidden;">
                <div id="u-cover-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #8E54E9, #4776E6); transition: width 0.1s ease-out; border-radius: 999px;"></div>
              </div>
            </div>

            <div class="text-muted text-xs mt-1">ระบบจะบีบอัดและปรับสัดส่วนภาพบนเครื่องอัตโนมัติ (ขนาดไม่เกิน A4 ก่อนส่งบันทึก)</div>
          </div>

          <!-- Conditional Input A: Link URL -->
          <div class="form-group mb-4" id="u-link-group">
            <label class="form-label font-bold text-purple" for="u-item-url">
              🔗 ลิงก์ปลายทาง / เว็บเกม / สื่อออนไลน์ภายนอก (URL)
              <span class="text-muted font-normal text-xs">(ไม่จำเป็น - หากไม่ระบุ กดที่การ์ดแล้วจะไม่มีอะไรเกิดขึ้น)</span>
            </label>
            <input type="url" id="u-item-url" class="form-control mb-2" placeholder="https://wordwall.net/... หรือ URL อื่นๆ">
            <label class="form-label text-xs text-secondary mb-1" for="u-item-btn-text">
              ข้อความบนปุ่มกด (ตัวเลือกเสริม เช่น "🎮 เล่นเกม", "🚀 เข้าสู่เว็บไซต์")
            </label>
            <input type="text" id="u-item-btn-text" class="form-control" placeholder="🚀 เปิดเว็บแอป (ค่าเริ่มต้น)">
          </div>

          <!-- Conditional Input B: Document File Upload (PDF or Excel) -->
          <div class="form-group mb-4 d-none" id="u-doc-file-group">
            <label class="form-label font-bold text-purple" id="u-doc-file-label">แนบไฟล์เอกสาร *</label>
            <input type="file" id="u-doc-file-input" class="form-control">
            <div class="text-muted text-xs mt-1" id="u-doc-file-hint"></div>
          </div>

          <!-- Step 4: Dynamic Custom Fields (+ / -) -->
          <div class="form-group mb-2">
            <div class="d-flex align-center justify-between mb-2">
              <label class="form-label font-bold text-purple mb-0">
                📋 ข้อมูลกำกับผลงาน (กด + เพื่อเพิ่มหัวข้อ / กด - เพื่อลบ)
              </label>
              <button type="button" class="btn btn-sm btn-secondary" id="u-add-field-btn">
                ➕ เพิ่มหัวข้อ
              </button>
            </div>
            <div id="u-dynamic-fields-container" class="u-dynamic-fields-list">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="u-modal-footer">
          <div id="u-save-progress" class="save-progress d-none">
            <div class="save-progress-heading"><span data-loading-message role="status">กำลังเตรียมข้อมูล...</span><strong data-loading-percent>0%</strong></div>
            <div class="loading-indicator-track" role="progressbar" aria-label="ความคืบหน้าการบันทึกโดยประมาณ" aria-valuemin="0" aria-valuemax="100" data-loading-bar><div class="loading-indicator-fill" data-loading-fill></div></div>
            <small class="loading-detail" data-loading-detail></small>
          </div>
          <button type="button" class="btn btn-subtle" id="u-modal-cancel-btn">ยกเลิก</button>
          <button type="button" class="btn btn-primary" id="u-modal-save-btn">💾 บันทึกข้อมูล</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    // Bind event listeners
    document.getElementById('u-modal-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('u-modal-cancel-btn')?.addEventListener('click', () => this.close());
    document.getElementById('u-modal-save-btn')?.addEventListener('click', () => this._handleSave());
    document.getElementById('u-add-field-btn')?.addEventListener('click', () => this.addFieldRow('', ''));

    // Content Type change listener
    const typeRadios = modal.querySelectorAll('input[name="u-content-type"]');
    typeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this._updateTypeVisibility(e.target.value);
      });
    });

    // Ratio change listener
    const ratioRadios = modal.querySelectorAll('input[name="u-cover-ratio"]');
    ratioRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this._updateRatioDisplay(e.target.value);
      });
    });

    // Cover upload triggers
    const coverPreview = document.getElementById('u-cover-preview');
    const coverInput = document.getElementById('u-cover-input');
    coverPreview?.addEventListener('click', () => coverInput?.click());
    coverInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this._handleCoverSelected(e.target.files[0]);
      }
    });

    // Document file listener
    const docFileInput = document.getElementById('u-doc-file-input');
    docFileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this._handleDocFileSelected(e.target.files[0]);
      }
    });
  }
}
