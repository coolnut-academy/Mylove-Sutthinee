/**
 * File Viewer Controller
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';
import { RouterUtils } from '../router-utils.js';
import { FileApi, SettingsApi } from '../api.js';
import { Utils } from '../utils.js';
import { Toast } from '../toast.js';

class ViewerPageController {
  constructor() {
    this.itemId = RouterUtils.getParam('id');
    this.year = RouterUtils.resolveYear();
    this.init();
  }

  async init() {
    Loading.start();
    this._bindActions();
    await this._loadSettings();

    if (!this.itemId) {
      this._renderNotFound("ไม่พบรหัสเอกสารที่ต้องการดู");
      Loading.fail();
      return;
    }

    try {
      Loading.set(50);
      const item = await FileApi.getItem(this.itemId);
      if (!item) {
        this._renderNotFound("ไม่พบเอกสารนี้ในระบบ หรือเอกสารอาจถูกลบไปแล้ว");
        Loading.fail();
        return;
      }

      this._renderItem(item);
      Loading.done();
    } catch (err) {
      console.error("Failed to load viewer item:", err);
      this._renderNotFound("เกิดข้อผิดพลาดในการโหลดเอกสาร");
      Loading.fail();
    }
  }

  _bindActions() {
    const btnBack = document.getElementById('btn-back');
    btnBack?.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        RouterUtils.navigateTo('./index.html');
      }
    });

    const btnCopy = document.getElementById('btn-copy-link');
    btnCopy?.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        Toast.success('คัดลอกลิงก์เอกสารเรียบร้อยแล้ว');
      }
    });

    // Update nav links
    const setLink = (id, page) => {
      const el = document.getElementById(id);
      if (el) el.href = RouterUtils.buildUrl(page, { year: this.year });
    };
    setLink('nav-home', './index.html');
    setLink('nav-classroom', './classroom.html');
    setLink('nav-pa', './pa.html');
    setLink('breadcrumb-home', './index.html');
  }

  async _loadSettings() {
    const settings = await SettingsApi.getSettings();
    if (settings?.profile_image) {
      const avatar = document.getElementById('header-avatar');
      if (avatar) avatar.src = settings.profile_image;
    }
  }

  _renderItem(item) {
    const typeInfo = Utils.getFileTypeInfo(item.title, item.mime_type || item.type);

    // Breadcrumbs
    const bcTitle = document.getElementById('breadcrumb-title');
    if (bcTitle) bcTitle.textContent = item.title;

    const bcCat = document.getElementById('breadcrumb-category');
    if (bcCat) bcCat.textContent = item.section_code ? `ว.PA ตัวชี้วัด ${item.section_code}` : (item.category || 'เอกสาร');

    // Sidebar Meta
    const metaTitle = document.getElementById('meta-title');
    if (metaTitle) metaTitle.textContent = item.title;

    const metaDesc = document.getElementById('meta-desc');
    if (metaDesc) metaDesc.textContent = item.description || 'ไม่มีคำอธิบายเพิ่มเติม';

    const metaBadge = document.getElementById('meta-badge-type');
    if (metaBadge) {
      metaBadge.textContent = typeInfo.label;
      metaBadge.className = `badge ${typeInfo.badgeClass} mb-2`;
    }

    const metaYear = document.getElementById('meta-year');
    if (metaYear) metaYear.textContent = item.year || this.year;

    const metaSection = document.getElementById('meta-section');
    if (metaSection) metaSection.textContent = item.section_code ? `ตัวชี้วัด ${item.section_code}` : (item.category || '-');

    const metaSize = document.getElementById('meta-size');
    if (metaSize) metaSize.textContent = item.file_size ? Utils.formatFileSize(item.file_size) : '-';

    const metaDate = document.getElementById('meta-date');
    if (metaDate) metaDate.textContent = item.created_at ? Utils.formatDateThai(item.created_at, true) : '-';

    // External Link Button
    const btnOpen = document.getElementById('btn-open-external');
    if (btnOpen) {
      btnOpen.href = item.external_url || '#';
      if (!item.external_url) {
        btnOpen.style.display = 'none';
      }
    }

    // Viewport Render
    const viewport = document.getElementById('preview-viewport');
    if (!viewport) return;

    if (typeInfo.type === 'image') {
      viewport.style.background = '#2E253E';
      viewport.innerHTML = `
        <img src="${item.external_url}" alt="${Utils.escapeHtml(item.title)}" class="viewer-image-preview">
      `;
    } else if (typeInfo.type === 'pdf') {
      viewport.style.background = '#2E253E';
      viewport.innerHTML = `
        <iframe src="${item.external_url}" title="${Utils.escapeHtml(item.title)}" allow="autoplay"></iframe>
      `;
    } else {
      viewport.style.background = 'var(--purple-50)';
      viewport.innerHTML = `
        <div class="empty-state" style="background: transparent; border: none;">
          <div class="empty-state-icon" style="font-size: 4rem;">${typeInfo.icon}</div>
          <div class="empty-state-title">${Utils.escapeHtml(item.title)}</div>
          <p class="empty-state-text">ไฟล์ประเภท ${typeInfo.label} สามารถเปิดดูได้โดยตรงจาก Google Drive</p>
          <a href="${item.external_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-4">
            เปิดดูใน Google Drive &rarr;
          </a>
        </div>
      `;
    }
  }

  _renderNotFound(message) {
    const container = document.getElementById('viewer-container');
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 4rem;">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">ไม่พบเอกสาร</div>
        <p class="empty-state-text">${Utils.escapeHtml(message)}</p>
        <button type="button" class="btn btn-primary mt-4" onclick="window.history.back()">
          &larr; กลับหน้าที่แล้ว
        </button>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ViewerPageController());
} else {
  new ViewerPageController();
}
