/**
 * Excel / Google Sheets Viewer Modal Component
 * Displays Excel spreadsheets (.xlsx, .xls, .csv) in an interactive Google Sheets-like table.
 * Powered by SheetJS (Free & Open Source).
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';

export class ExcelViewerModal {
  static currentWorkbook = null;
  static activeSheetName = null;
  static modalEl = null;
  static rawData = null;

  /**
   * Open the Excel viewer
   * @param {Object} options
   * @param {string} options.title - Spreadsheet title
  /**
   * Extract Google Drive file ID from URL or explicit parameter
   */
  static extractDriveFileId(url, directId = '') {
    if (directId && typeof directId === 'string' && /^[a-zA-Z0-9_-]{15,}$/.test(directId)) {
      return directId;
    }
    if (!url || typeof url !== 'string') return null;
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) return m1[1];
    const m2 = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (m2) return m2[1];
    const m3 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m3) return m3[1];
    return null;
  }

  /**
   * Open the Excel viewer
   * @param {Object} options
   * @param {string} options.title - Spreadsheet title
   * @param {string} options.fileData - Base64 Data URL, ArrayBuffer, or public URL
   * @param {string} [options.downloadUrl] - Optional direct download link
   * @param {string} [options.driveFileId] - Optional Google Drive file ID
   */
  static async open({ title = 'สเปรดชีต Excel ออนไลน์', fileData, downloadUrl = '', driveFileId = '' }) {
    this._ensureModal();
    this.modalEl.classList.remove('d-none');
    document.body.classList.add('modal-open');

    const titleEl = document.getElementById('excel-modal-title');
    if (titleEl) titleEl.textContent = title;

    const downloadBtn = document.getElementById('excel-download-btn');
    const tableContainer = document.getElementById('excel-sheet-table-wrap');
    const tabsContainer = document.getElementById('excel-sheet-tabs');
    const footerEl = document.querySelector('.excel-modal-footer');
    const searchEl = document.querySelector('.excel-header-search');
    const iframe = document.getElementById('excel-drive-iframe');
    const loadingEl = document.getElementById('excel-loading');
    const errorEl = document.getElementById('excel-error');

    if (tableContainer) tableContainer.innerHTML = '';
    if (tabsContainer) tabsContainer.innerHTML = '';
    if (iframe) {
      iframe.classList.add('d-none');
      iframe.src = 'about:blank';
    }
    if (loadingEl) loadingEl.style.display = 'flex';
    if (errorEl) {
      errorEl.classList.add('d-none');
      errorEl.style.display = 'none';
      errorEl.innerHTML = '';
    }

    const resolvedDriveId = this.extractDriveFileId(fileData, driveFileId) || this.extractDriveFileId(downloadUrl);

    // Setup download button
    if (downloadBtn) {
      if (resolvedDriveId) {
        downloadBtn.href = downloadUrl || `https://drive.google.com/uc?export=download&id=${resolvedDriveId}`;
        downloadBtn.removeAttribute('download');
        downloadBtn.classList.remove('d-none');
      } else if (downloadUrl || (fileData && typeof fileData === 'string' && fileData.startsWith('data:'))) {
        downloadBtn.href = downloadUrl || fileData;
        downloadBtn.classList.remove('d-none');
      } else {
        downloadBtn.classList.add('d-none');
      }
    }

    // Engine A: Google Drive / Sheets Cloud Viewer
    if (resolvedDriveId) {
      if (footerEl) footerEl.classList.add('d-none');
      if (searchEl) searchEl.classList.add('d-none');
      Loading.start('กำลังเปิดสเปรดชีตจาก Google Drive...');

      let previewUrl = `https://drive.google.com/file/d/${resolvedDriveId}/preview`;
      if (typeof fileData === 'string' && fileData.includes('spreadsheets/d/')) {
        previewUrl = `https://docs.google.com/spreadsheets/d/${resolvedDriveId}/preview`;
      }

      let loadDone = false;
      const completeIframeDisplay = () => {
        if (loadDone) return;
        loadDone = true;
        if (loadingEl) loadingEl.style.display = 'none';
        if (iframe) iframe.classList.remove('d-none');
        Loading.done('เปิดตารางเรียบร้อย');
      };

      if (iframe) {
        iframe.onload = completeIframeDisplay;
        iframe.onerror = () => {
          if (loadDone) return;
          loadDone = true;
          this._showError(title, `https://drive.google.com/file/d/${resolvedDriveId}/view`, downloadUrl);
        };
        iframe.src = previewUrl;
        setTimeout(completeIframeDisplay, 3500);
      }
      return;
    }

    // Engine B: SheetJS Client-side Parser
    if (footerEl) footerEl.classList.remove('d-none');
    if (searchEl) searchEl.classList.remove('d-none');

    Loading.start('กำลังเปิดไฟล์ตาราง...');
    try {
      if (typeof window.XLSX === 'undefined') {
        await this._loadSheetJsLibrary();
      }

      let workbook;
      if (typeof fileData === 'string' && fileData.startsWith('data:')) {
        // Base64 Data URL
        const base64Data = fileData.split(',')[1];
        workbook = window.XLSX.read(base64Data, { type: 'base64' });
      } else if (typeof fileData === 'string' && fileData.startsWith('http')) {
        // Remote URL
        const response = await fetch(fileData);
        const arrayBuffer = await response.arrayBuffer();
        workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
      } else {
        workbook = window.XLSX.read(fileData, { type: 'array' });
      }

      this.currentWorkbook = workbook;
      Loading.set(85, 'กำลังจัดแสดงตาราง...');
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('ไม่พบแผ่นงาน (Sheet) ในไฟล์ Excel นี้');
      }

      if (loadingEl) loadingEl.style.display = 'none';

      // Render Sheet Tabs (Like Google Sheets bottom tabs)
      this._renderSheetTabs(workbook.SheetNames);

      // Render the first sheet
      this.switchSheet(workbook.SheetNames[0]);
      Loading.done('เปิดตารางเรียบร้อย');
    } catch (err) {
      console.error('Error loading Excel in Viewer:', err);
      this._showError(title, fileData, downloadUrl);
    }
  }

  static _showError(title, targetUrl = '', downloadUrl = '') {
    Loading.fail('เปิดตารางไม่สำเร็จ');
    const loadingEl = document.getElementById('excel-loading');
    const errorEl = document.getElementById('excel-error');
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.classList.remove('d-none');
      errorEl.style.display = 'block';
      const openUrl = targetUrl || downloadUrl;
      errorEl.innerHTML = `
        <div class="text-center p-6">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">📊</div>
          <h4 class="font-bold mb-2 text-lg">ไม่สามารถประมวลผลไฟล์ Excel ในระบบได้โดยตรง</h4>
          <p class="text-muted text-sm mb-4">ไฟล์อาจมีรูปแบบพิเศษ หรืออยู่บน Google Drive ที่จำกัดสิทธิ์</p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            ${openUrl && typeof openUrl === 'string' && openUrl.startsWith('http') ? `<a href="${openUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">🔗 เปิดในแท็บใหม่</a>` : ''}
            ${downloadUrl ? `<a href="${downloadUrl}" download class="btn btn-outline btn-sm">📥 ดาวน์โหลดไฟล์ต้นฉบับ</a>` : ''}
          </div>
        </div>
      `;
    }
  }

  static close() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('d-none');
    document.body.classList.remove('modal-open');
    this.currentWorkbook = null;
    const iframe = document.getElementById('excel-drive-iframe');
    if (iframe) {
      iframe.src = 'about:blank';
      iframe.classList.add('d-none');
    }
  }

  static switchSheet(sheetName) {
    if (!this.currentWorkbook || !this.currentWorkbook.Sheets[sheetName]) return;
    this.activeSheetName = sheetName;

    // Highlight active tab
    const tabs = document.querySelectorAll('.excel-sheet-tab');
    tabs.forEach(tab => {
      if (tab.dataset.sheet === sheetName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    const sheet = this.currentWorkbook.Sheets[sheetName];
    // Convert sheet to HTML table
    const rawHtml = window.XLSX.utils.sheet_to_html(sheet, {
      id: 'excel-rendered-table',
      editable: false
    });

    const tableContainer = document.getElementById('excel-sheet-table-wrap');
    if (tableContainer) {
      tableContainer.innerHTML = rawHtml;
      this._beautifyGoogleSheetsTable();
    }
  }

  static _renderSheetTabs(sheetNames) {
    const tabsContainer = document.getElementById('excel-sheet-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    sheetNames.forEach((name, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `excel-sheet-tab ${idx === 0 ? 'active' : ''}`;
      btn.dataset.sheet = name;
      btn.innerHTML = `<span>📄</span> ${name}`;
      btn.addEventListener('click', () => this.switchSheet(name));
      tabsContainer.appendChild(btn);
    });
  }

  static _beautifyGoogleSheetsTable() {
    const table = document.getElementById('excel-rendered-table');
    if (!table) return;

    table.className = 'google-sheets-table';

    // Add sticky header row and column headers if possible
    const rows = table.querySelectorAll('tr');
    if (rows.length === 0) return;

    // Add row numbers to each row
    rows.forEach((row, rowIdx) => {
      const rowNumCell = document.createElement('th');
      rowNumCell.className = 'gs-row-header';
      rowNumCell.textContent = rowIdx + 1;
      row.insertBefore(rowNumCell, row.firstChild);
    });

    // Create column header row (A, B, C, D...)
    const firstRowCells = rows[0].children.length;
    const colHeaderRow = document.createElement('tr');
    colHeaderRow.className = 'gs-col-header-row';

    for (let c = 0; c < firstRowCells; c++) {
      const colTh = document.createElement('th');
      colTh.className = 'gs-col-header';
      if (c === 0) {
        colTh.textContent = ''; // Corner cell
      } else {
        colTh.textContent = this._indexToColumnName(c - 1);
      }
      colHeaderRow.appendChild(colTh);
    }

    const thead = table.querySelector('thead') || table.createTHead();
    thead.insertBefore(colHeaderRow, thead.firstChild);
  }

  static _indexToColumnName(num) {
    let s = '';
    while (num >= 0) {
      s = String.fromCharCode((num % 26) + 65) + s;
      num = Math.floor(num / 26) - 1;
    }
    return s;
  }

  static _loadSheetJsLibrary() {
    return new Promise((resolve, reject) => {
      if (window.XLSX) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  static _filterTable(query) {
    const table = document.getElementById('excel-rendered-table');
    if (!table) return;

    const q = (query || '').toLowerCase().trim();
    const rows = table.querySelectorAll('tr');

    rows.forEach((row, idx) => {
      if (idx === 0) return; // Column headers
      if (!q) {
        row.style.display = '';
        row.classList.remove('gs-match-highlight');
        return;
      }
      const text = row.textContent.toLowerCase();
      if (text.includes(q)) {
        row.style.display = '';
        row.classList.add('gs-match-highlight');
      } else {
        row.style.display = 'none';
        row.classList.remove('gs-match-highlight');
      }
    });
  }

  static _ensureModal() {
    if (this.modalEl) return;

    const modal = document.createElement('div');
    modal.id = 'excel-viewer-modal';
    modal.className = 'excel-modal-overlay d-none';
    modal.innerHTML = `
      <div class="excel-modal-container">
        <!-- Top Google Sheets Style Header -->
        <div class="excel-modal-header">
          <div class="excel-header-brand">
            <div class="excel-gs-icon">📊</div>
            <div>
              <div class="d-flex align-center gap-2">
                <span class="excel-badge">GOOGLE SHEETS VIEWER</span>
                <span class="badge badge-sage">แบบอ่านอย่างเดียว</span>
              </div>
              <h3 class="excel-title" id="excel-modal-title">สเปรดชีต Excel ออนไลน์</h3>
            </div>
          </div>

          <!-- Middle Search -->
          <div class="excel-header-search">
            <input type="text" id="excel-search-input" class="form-control form-control-sm" placeholder="🔍 ค้นหาในแผ่นงานนี้...">
          </div>

          <div class="excel-header-actions">
            <a id="excel-download-btn" href="#" download class="btn btn-icon-light" title="ดาวน์โหลดไฟล์ Excel" target="_blank">📥</a>
            <button type="button" id="excel-fullscreen-btn" class="btn btn-icon-light" title="เต็มจอ">⛶</button>
            <button type="button" id="excel-close-btn" class="btn btn-icon-light" title="ปิดหน้าต่าง">&times;</button>
          </div>
        </div>

        <!-- Sheet Table Body -->
        <div class="excel-modal-body" id="excel-sheet-viewport">
          <div id="excel-loading" class="excel-loading-state">
            <div class="loading-spinner"></div>
            <p>กำลังเปิดและประมวลผลตารางสเปรดชีต...</p>
          </div>
          <div id="excel-error" class="d-none"></div>
          <div id="excel-sheet-table-wrap" class="excel-table-scroll-wrap"></div>
          <iframe id="excel-drive-iframe" class="ebook-drive-frame d-none" allow="autoplay" allowfullscreen></iframe>
        </div>

        <!-- Bottom Sheet Tabs Bar (Like Google Sheets) -->
        <div class="excel-modal-footer">
          <div class="excel-tabs-bar" id="excel-sheet-tabs">
            <!-- Populated with sheet tabs -->
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    // Bind events
    document.getElementById('excel-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('excel-search-input')?.addEventListener('input', (e) => {
      this._filterTable(e.target.value);
    });

    document.getElementById('excel-fullscreen-btn')?.addEventListener('click', () => {
      const container = document.querySelector('.excel-modal-container');
      if (!document.fullscreenElement) {
        container?.requestFullscreen().catch(err => console.warn(err));
      } else {
        document.exitFullscreen().catch(err => console.warn(err));
      }
    });

    window.addEventListener('keydown', (e) => {
      if (this.modalEl.classList.contains('d-none')) return;
      if (e.key === 'Escape') this.close();
    });
  }
}
