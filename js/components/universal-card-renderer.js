/**
 * Universal Card Renderer
 * Renders items created by UniversalItemModal with chosen aspect ratio,
 * dynamic fields, and interactive viewer triggers (eBook, Excel, Link).
 * Suttinee Teacher Workspace
 */

import { EbookViewerModal } from './ebook-viewer-modal.js';
import { ExcelViewerModal } from './excel-viewer-modal.js';
import { Utils } from '../utils.js';
import { AppState } from '../app-state.js';

export function renderUniversalCard(item, { onDelete = null } = {}) {
  const card = document.createElement('div');
  card.className = 'universal-showcase-card card';
  card.dataset.id = item.id;

  const ratio = item.cover_ratio || '16:9';
  let ratioClass = 'ratio-16-9';
  if (ratio === '3:4') ratioClass = 'ratio-3-4';
  else if (ratio === '1:1') ratioClass = 'ratio-1-1';

  // Type badge info
  let typeBadge = '<span class="badge badge-purple">🔗 ลิงก์ผลงาน</span>';
  if (item.type === 'ebook' || item.type === 'pdf') {
    typeBadge = '<span class="badge badge-gold">📖 EBOOK ออนไลน์ (PDF)</span>';
  } else if (item.type === 'excel' || item.type === 'sheet') {
    typeBadge = '<span class="badge badge-sage">📊 GOOGLE SHEETS / EXCEL</span>';
  }

  // Cover image URL
  const coverUrl = item.cover_url || item.thumbnail_url || './assets/fallback/classroom-cover.svg';

  // Render Dynamic Custom Fields
  let fieldsHtml = '';
  let fieldsArr = item.fields;
  if (typeof fieldsArr === 'string' && fieldsArr.trim().startsWith('[')) {
    try {
      fieldsArr = JSON.parse(fieldsArr);
    } catch (e) {
      fieldsArr = [];
    }
  }

  if (fieldsArr && Array.isArray(fieldsArr) && fieldsArr.length > 0) {
    fieldsHtml = fieldsArr.map(f => `
      <div class="u-card-meta-line">
        <span class="u-card-meta-label">${Utils.escapeHtml(f.label)}:</span>
        <span class="u-card-meta-val">${Utils.escapeHtml(f.value)}</span>
      </div>
    `).join('');
  } else {
    // Fallback to title and description
    fieldsHtml = `
      <div class="u-card-meta-line">
        <span class="u-card-meta-label">ชื่อรายการ:</span>
        <span class="u-card-meta-val">${Utils.escapeHtml(item.title || 'ไม่มีชื่อ')}</span>
      </div>
      ${item.description ? `
      <div class="u-card-meta-line">
        <span class="u-card-meta-label">รายละเอียด:</span>
        <span class="u-card-meta-val">${Utils.escapeHtml(item.description)}</span>
      </div>` : ''}
    `;
  }

  // Action Button
  let actionHtml = '';
  if (item.type === 'ebook' || item.type === 'pdf') {
    actionHtml = `
      <button type="button" class="btn btn-primary btn-block btn-open-ebook">
        📖 เปิดอ่าน eBook ออนไลน์
      </button>
    `;
  } else if (item.type === 'excel' || item.type === 'sheet') {
    actionHtml = `
      <button type="button" class="btn btn-success btn-block btn-open-excel">
        📊 เปิดดูสเปรดชีตออนไลน์
      </button>
    `;
  } else {
    // Link type
    if (item.item_url || item.external_url) {
      const targetUrl = item.item_url || item.external_url;
      const btnLabel = item.button_text || item.button_label || '🚀 เปิดดูผลงาน';
      actionHtml = `
        <a href="${Utils.escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-block">
          ${Utils.escapeHtml(btnLabel)}
        </a>
      `;
    } else {
      actionHtml = `
        <div class="u-card-no-link text-center text-muted text-xs p-2">
          ℹ️ รายการข้อมูล (ไม่มีลิงก์ภายนอก)
        </div>
      `;
    }
  }

  // เฉพาะแอดมินที่ล็อกอินแล้วเท่านั้นจึงจะเห็นปุ่มลบ (คนทั่วไปมองเห็นและกดใช้งานได้ แต่ลบ/แก้ไขไม่ได้)
  const isAdmin = AppState.isAdmin();
  const deleteBtnHtml = (isAdmin && onDelete)
    ? `<button type="button" class="btn btn-icon btn-subtle btn-delete-item" title="ลบรายการนี้">🗑️</button>`
    : '';

  card.innerHTML = `
    <div class="u-card-cover-wrapper ${ratioClass}">
      <img src="${coverUrl}" alt="Cover" class="u-card-cover-img" loading="lazy" onerror="this.src='./assets/fallback/classroom-cover.svg'">
      <div class="u-card-badge-overlay">${typeBadge}</div>
    </div>
    <div class="u-card-body">
      <div class="u-card-meta-list mb-3">
        ${fieldsHtml}
      </div>
      <div class="u-card-actions-row">
        <div class="flex-1">${actionHtml}</div>
        ${deleteBtnHtml}
      </div>
    </div>
  `;

  // Bind Actions
  const openEbookBtn = card.querySelector('.btn-open-ebook');
  if (openEbookBtn) {
    openEbookBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pdfData = item.file_data || item.external_url || item.item_url;
      EbookViewerModal.open({
        title: item.title || 'หนังสือ eBook ออนไลน์',
        pdfUrl: pdfData,
        downloadUrl: item.item_url || ''
      });
    });
  }

  const openExcelBtn = card.querySelector('.btn-open-excel');
  if (openExcelBtn) {
    openExcelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fileData = item.file_data || item.external_url || item.item_url;
      ExcelViewerModal.open({
        title: item.title || 'สเปรดชีต Excel ออนไลน์',
        fileData: fileData,
        downloadUrl: item.item_url || ''
      });
    });
  }

  const deleteBtn = card.querySelector('.btn-delete-item');
  if (deleteBtn && onDelete) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`ต้องการลบรายการ "${item.title || 'นี้'}" หรือไม่?`)) {
        onDelete(item.id);
      }
    });
  }

  return card;
}
