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

export function renderUniversalCard(item, { index = 0, onDelete = null } = {}) {
  const card = document.createElement('div');
  card.className = 'universal-showcase-card';
  card.dataset.id = item.id;

  const ratio = item.cover_ratio || '16:9';
  let ratioClass = 'ratio-16-9';
  if (ratio === '3:4') ratioClass = 'ratio-3-4';
  else if (ratio === '1:1') ratioClass = 'ratio-1-1';

  // Parse fields safely
  let fieldsArr = item.fields;
  if (typeof fieldsArr === 'string' && fieldsArr.trim().startsWith('[')) {
    try {
      fieldsArr = JSON.parse(fieldsArr);
    } catch (e) {
      fieldsArr = [];
    }
  }
  if (!Array.isArray(fieldsArr)) fieldsArr = [];

  // Determine Title, Creator, Index Badge, and Chips
  let title = item.title || '';
  let creator = '';
  let customBadgeNum = null;
  const chips = [];

  // Extract metadata from fields
  fieldsArr.forEach((f, fIdx) => {
    const label = (f.label || '').trim();
    const val = (f.value || '').trim();
    if (!val) return;

    if (!title && fIdx === 0) {
      title = val;
    } else if (!creator && (label.includes('ผู้จัดทำ') || label.includes('เจ้าของ') || label.includes('ผู้สร้าง') || label.includes('ครู') || label.includes('นักเรียน') || label.includes('ชื่อ-สกุล'))) {
      creator = val;
    } else if (label.includes('เลขที่') || label.includes('ลำดับ')) {
      customBadgeNum = val;
    } else {
      chips.push(val);
    }
  });

  if (!title) title = item.title || 'รายการผลงาน';
  if (!creator) creator = item.author || item.creator || 'นางสาวศุทธินี ถาวร';
  const badgeLabel = customBadgeNum ? `เลขที่ ${customBadgeNum}` : `ลำดับที่ ${index + 1}`;

  // Cover image URL
  const coverUrl = item.cover_url || item.thumbnail_url || './assets/fallback/classroom-cover.svg';

  // Type Tag on Top Right
  let typeTag = '<span class="u-card-type-tag">🔗 ลิงก์</span>';
  if (item.type === 'ebook' || item.type === 'pdf') {
    typeTag = '<span class="u-card-type-tag">📖 EBOOK</span>';
  } else if (item.type === 'excel' || item.type === 'sheet') {
    typeTag = '<span class="u-card-type-tag">📊 EXCEL</span>';
  }

  // Chips HTML
  let chipsHtml = '';
  if (chips.length > 0) {
    chipsHtml = chips.map(c => `<span class="u-card-chip">${Utils.escapeHtml(c)}</span>`).join('');
  } else if (item.category || item.section_code) {
    chipsHtml = `<span class="u-card-chip">${Utils.escapeHtml(item.category || item.section_code)}</span>`;
  }

  // Action Button
  let actionHtml = '';
  if (item.type === 'ebook' || item.type === 'pdf') {
    actionHtml = `
      <button type="button" class="btn u-card-btn u-btn-ebook btn-open-ebook">
        <span>📖</span> ${Utils.escapeHtml(item.button_text || 'เปิดอ่าน eBook ออนไลน์')}
      </button>
    `;
  } else if (item.type === 'excel' || item.type === 'sheet') {
    actionHtml = `
      <button type="button" class="btn u-card-btn u-btn-excel btn-open-excel">
        <span>📊</span> ${Utils.escapeHtml(item.button_text || 'เปิดดูสเปรดชีตออนไลน์')}
      </button>
    `;
  } else {
    // Link / Web app type
    const targetUrl = item.item_url || item.external_url || '#';
    const btnLabel = item.button_text || '🚀 เปิดเว็บแอป';
    actionHtml = `
      <a href="${Utils.escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="btn u-card-btn u-btn-primary">
        <span>🚀</span> ${Utils.escapeHtml(btnLabel)}
      </a>
    `;
  }

  // เฉพาะแอดมินที่ล็อกอินแล้วเท่านั้นจึงจะเห็นปุ่มลบ
  const isAdmin = AppState.isAdmin();
  const deleteBtnHtml = (isAdmin && onDelete)
    ? `<button type="button" class="u-card-delete-btn btn-delete-item" title="ลบรายการนี้">🗑️</button>`
    : '';

  card.innerHTML = `
    <div class="u-card-cover-wrapper ${ratioClass}">
      <img src="${coverUrl}" alt="${Utils.escapeHtml(title)}" class="u-card-cover-img" loading="lazy" onerror="this.src='./assets/fallback/classroom-cover.svg'">
      <div class="u-card-index-badge">${badgeLabel}</div>
      ${typeTag}
    </div>
    <div class="u-card-body">
      <div>
        <h4 class="u-card-title" title="${Utils.escapeHtml(title)}">${Utils.escapeHtml(title)}</h4>
        <div class="u-card-creator">
          <span>👤</span>
          <span class="u-card-creator-name">${Utils.escapeHtml(creator)}</span>
        </div>
        <div class="u-card-chips">
          ${chipsHtml}
        </div>
      </div>
      <div class="u-card-actions-row">
        <div style="flex: 1;">${actionHtml}</div>
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
        title: item.title || item.file_name || 'หนังสือ eBook ออนไลน์',
        pdfUrl: pdfData,
        downloadUrl: item.item_url || item.external_url || '',
        driveFileId: item.drive_file_id || ''
      });
    });
  }

  const openExcelBtn = card.querySelector('.btn-open-excel');
  if (openExcelBtn) {
    openExcelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fileData = item.file_data || item.external_url || item.item_url;
      ExcelViewerModal.open({
        title: item.title || item.file_name || 'สเปรดชีต Excel ออนไลน์',
        fileData: fileData,
        downloadUrl: item.item_url || item.external_url || '',
        driveFileId: item.drive_file_id || ''
      });
    });
  }

  const deleteBtn = card.querySelector('.btn-delete-item');
  if (deleteBtn && onDelete) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`ต้องการลบรายการ "${title}" หรือไม่?`)) {
        onDelete(item.id);
      }
    });
  }

  return card;
}
