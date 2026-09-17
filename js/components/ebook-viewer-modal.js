/**
 * eBook Viewer Modal Component
 * Displays PDF documents in an interactive online eBook flip/reader experience.
 * Powered by Mozilla PDF.js (Free & Open Source).
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';

export class EbookViewerModal {
  static currentPdfDoc = null;
  static currentPageNum = 1;
  static totalPages = 0;
  static currentScale = 1.2;
  static isRendering = false;
  static pageNumPending = null;
  static modalEl = null;

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
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m2) return m2[1];
    return null;
  }

  /**
   * Open the eBook viewer
   * @param {Object} options
   * @param {string} options.title - Document title
   * @param {string} options.pdfUrl - Base64 Data URL or public PDF URL
   * @param {string} [options.downloadUrl] - Optional direct download link
   * @param {string} [options.driveFileId] - Optional Google Drive file ID
   */
  static async open({ title = 'เอกสาร eBook ออนไลน์', pdfUrl, downloadUrl = '', driveFileId = '' }) {
    this._ensureModal();
    this.modalEl.classList.remove('d-none');
    document.body.classList.add('modal-open');

    const titleEl = document.getElementById('ebook-modal-title');
    if (titleEl) titleEl.textContent = title;

    const downloadBtn = document.getElementById('ebook-download-btn');
    const externalBtn = document.getElementById('ebook-external-btn');
    const canvasWrap = document.getElementById('ebook-canvas-wrap');
    const canvas = document.getElementById('ebook-pdf-canvas');
    const iframe = document.getElementById('ebook-drive-iframe');
    const loadingEl = document.getElementById('ebook-loading');
    const errorEl = document.getElementById('ebook-error');
    const footerEl = document.getElementById('ebook-modal-footer');

    // Reset initial UI states
    if (canvasWrap) canvasWrap.style.display = 'none';
    if (canvas) canvas.style.display = 'none';
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

    const resolvedDriveId = this.extractDriveFileId(pdfUrl, driveFileId) || this.extractDriveFileId(downloadUrl);

    // 1. Setup Action Buttons (External Tab & Download)
    if (resolvedDriveId) {
      const driveViewUrl = `https://drive.google.com/file/d/${resolvedDriveId}/view`;
      const driveDownloadUrl = `https://drive.google.com/uc?export=download&id=${resolvedDriveId}`;
      if (externalBtn) {
        externalBtn.href = driveViewUrl;
        externalBtn.classList.remove('d-none');
      }
      if (downloadBtn) {
        downloadBtn.href = downloadUrl || driveDownloadUrl;
        downloadBtn.removeAttribute('download');
        downloadBtn.classList.remove('d-none');
      }
    } else {
      if (externalBtn) {
        if (typeof pdfUrl === 'string' && pdfUrl.startsWith('http')) {
          externalBtn.href = pdfUrl;
          externalBtn.classList.remove('d-none');
        } else {
          externalBtn.classList.add('d-none');
        }
      }
      if (downloadBtn) {
        if (downloadUrl || pdfUrl) {
          if (typeof pdfUrl === 'string' && (pdfUrl.startsWith('data:') || !pdfUrl.startsWith('http'))) {
            const downloadHref = pdfUrl.startsWith('data:') ? pdfUrl : `data:application/pdf;base64,${pdfUrl}`;
            downloadBtn.href = downloadHref;
            downloadBtn.setAttribute('download', `${title}.pdf`);
          } else {
            downloadBtn.href = downloadUrl || pdfUrl;
            downloadBtn.removeAttribute('download');
          }
          downloadBtn.classList.remove('d-none');
        } else {
          downloadBtn.classList.add('d-none');
        }
      }
    }

    // 2. Engine A: Google Drive Cloud Viewer (Zero-CORS, Native PDF Renderer)
    if (resolvedDriveId) {
      if (footerEl) footerEl.classList.add('d-none'); // Google Drive previewer provides its own navigation
      Loading.start('กำลังเปิดเอกสารจาก Google Drive...');
      
      const previewUrl = `https://drive.google.com/file/d/${resolvedDriveId}/preview`;
      let loadDone = false;

      const completeIframeDisplay = () => {
        if (loadDone) return;
        loadDone = true;
        if (loadingEl) loadingEl.style.display = 'none';
        if (iframe) iframe.classList.remove('d-none');
        Loading.done('เปิดเอกสารเรียบร้อย');
      };

      if (iframe) {
        iframe.onload = completeIframeDisplay;
        iframe.onerror = () => {
          if (loadDone) return;
          loadDone = true;
          this._showError(title, `https://drive.google.com/file/d/${resolvedDriveId}/view`, downloadUrl);
        };
        iframe.src = previewUrl;

        // Safety fallback: ensure iframe becomes visible if onload event is absorbed by browser
        setTimeout(completeIframeDisplay, 3500);
      }
      return;
    }

    // 3. Engine B: Mozilla PDF.js (Local/Base64 Documents)
    if (footerEl) footerEl.classList.remove('d-none');
    this.currentPageNum = 1;
    this.currentScale = window.innerWidth < 768 ? 0.8 : 1.2;

    Loading.start('กำลังโหลดเอกสาร PDF...');
    try {
      if (typeof window.pdfjsLib === 'undefined') {
        // Fallback if PDF.js is not loaded yet
        await this._loadPdfJsLibrary();
      }

      let docInit = pdfUrl;
      if (typeof pdfUrl === 'string') {
        if (pdfUrl.startsWith('data:application/pdf;base64,')) {
          const rawB64 = pdfUrl.substring('data:application/pdf;base64,'.length);
          const binaryStr = atob(rawB64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          docInit = { data: bytes };
        } else if (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://') && !pdfUrl.startsWith('./') && !pdfUrl.startsWith('/')) {
          try {
            const binaryStr = atob(pdfUrl);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            docInit = { data: bytes };
          } catch (e) {
            docInit = pdfUrl;
          }
        }
      }

      const loadingTask = window.pdfjsLib.getDocument(docInit);
      loadingTask.onProgress = ({ loaded, total }) => {
        if (total > 0) Loading.set(Math.min(90, 10 + loaded / total * 80), 'กำลังรับและเปิดเอกสาร PDF...');
      };
      this.currentPdfDoc = await loadingTask.promise;
      this.totalPages = this.currentPdfDoc.numPages;

      document.getElementById('ebook-page-total').textContent = this.totalPages;
      if (loadingEl) loadingEl.style.display = 'none';
      if (canvasWrap) canvasWrap.style.display = 'block';
      if (canvas) canvas.style.display = 'block';

      await this._renderPage(this.currentPageNum);
      Loading.done('เปิดเอกสารเรียบร้อย');
    } catch (err) {
      console.error('Error loading PDF in eBook Viewer:', err);
      this._showError(title, pdfUrl, downloadUrl);
    }
  }

  static _showError(title, targetUrl = '', downloadUrl = '') {
    Loading.fail('เปิดเอกสารไม่สำเร็จ');
    const loadingEl = document.getElementById('ebook-loading');
    const errorEl = document.getElementById('ebook-error');
    const footerEl = document.getElementById('ebook-modal-footer');
    if (loadingEl) loadingEl.style.display = 'none';
    if (footerEl) footerEl.classList.add('d-none');
    if (errorEl) {
      errorEl.classList.remove('d-none');
      errorEl.style.display = 'block';
      const openUrl = targetUrl || downloadUrl;
      errorEl.innerHTML = `
        <div class="text-center p-6" style="max-width: 480px; margin: 0 auto;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">⚠️</div>
          <h4 class="font-bold mb-2 text-lg">ไม่สามารถแสดงผลเอกสารในระบบอ่านได้โดยตรง</h4>
          <p class="text-muted text-sm mb-4">
            เอกสารอาจมีขนาดใหญ่ หรืออยู่บน Google Drive ที่จำกัดสิทธิ์การเข้าถึง
          </p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            ${openUrl && openUrl.startsWith('http') ? `<a href="${openUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">🔗 เปิดอ่านผ่านหน้าต่างใหม่</a>` : ''}
            ${downloadUrl ? `<a href="${downloadUrl}" download class="btn btn-outline btn-sm">📥 ดาวน์โหลดเอกสาร</a>` : ''}
          </div>
        </div>
      `;
    }
  }

  static close() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('d-none');
    document.body.classList.remove('modal-open');
    this.currentPdfDoc = null;
    const iframe = document.getElementById('ebook-drive-iframe');
    if (iframe) {
      iframe.src = 'about:blank';
      iframe.classList.add('d-none');
    }
  }

  static async _renderPage(num) {
    if (!this.currentPdfDoc) return;
    Loading.start(`กำลังแสดงหน้า ${num}...`);
    this.isRendering = true;

    try {
      const page = await this.currentPdfDoc.getPage(num);
      const canvas = document.getElementById('ebook-pdf-canvas');
      const ctx = canvas.getContext('2d');

      const viewport = page.getViewport({ scale: this.currentScale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      this.isRendering = false;

      if (this.pageNumPending !== null) {
        this._renderPage(this.pageNumPending);
        this.pageNumPending = null;
      }

      // Update page indicators
      const currentInput = document.getElementById('ebook-page-current');
      if (currentInput) currentInput.value = num;

      // Update prev/next button states
      const prevBtn = document.getElementById('ebook-prev-page');
      const nextBtn = document.getElementById('ebook-next-page');
      if (prevBtn) prevBtn.disabled = num <= 1;
      if (nextBtn) nextBtn.disabled = num >= this.totalPages;
      Loading.done('แสดงหน้าเอกสารเรียบร้อย');
    } catch (e) {
      console.error('Error rendering page:', e);
      Loading.fail('แสดงหน้าเอกสารไม่สำเร็จ');
      this.isRendering = false;
    }
  }

  static queueRenderPage(num) {
    if (this.isRendering) {
      this.pageNumPending = num;
    } else {
      this._renderPage(num);
    }
  }

  static prevPage() {
    if (this.currentPageNum <= 1) return;
    this.currentPageNum--;
    this.queueRenderPage(this.currentPageNum);
  }

  static nextPage() {
    if (this.currentPageNum >= this.totalPages) return;
    this.currentPageNum++;
    this.queueRenderPage(this.currentPageNum);
  }

  static zoomIn() {
    if (this.currentScale >= 2.5) return;
    this.currentScale += 0.2;
    this.queueRenderPage(this.currentPageNum);
  }

  static zoomOut() {
    if (this.currentScale <= 0.6) return;
    this.currentScale -= 0.2;
    this.queueRenderPage(this.currentPageNum);
  }

  static _loadPdfJsLibrary() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  static _ensureModal() {
    if (this.modalEl) return;

    const modal = document.createElement('div');
    modal.id = 'ebook-viewer-modal';
    modal.className = 'ebook-modal-overlay d-none';
    modal.innerHTML = `
      <div class="ebook-modal-container">
        <!-- Top Bar -->
        <div class="ebook-modal-header">
          <div class="ebook-header-left">
            <span class="ebook-badge">📖 EBOOK READER</span>
            <h3 class="ebook-title" id="ebook-modal-title">เอกสาร eBook ออนไลน์</h3>
          </div>
          <div class="ebook-header-right">
            <a id="ebook-external-btn" href="#" class="btn btn-icon-light d-none" title="เปิดในหน้าต่างใหม่" target="_blank" rel="noopener noreferrer">↗</a>
            <a id="ebook-download-btn" href="#" download class="btn btn-icon-light" title="ดาวน์โหลด PDF" target="_blank">📥</a>
            <button type="button" id="ebook-fullscreen-btn" class="btn btn-icon-light" title="เต็มจอ">⛶</button>
            <button type="button" id="ebook-close-btn" class="btn btn-icon-light" title="ปิดหน้าต่าง">&times;</button>
          </div>
        </div>

        <!-- Canvas Body / Reader Viewport -->
        <div class="ebook-modal-body" id="ebook-viewport">
          <div id="ebook-loading" class="ebook-loading-state">
            <div class="loading-spinner"></div>
            <p>กำลังเปิดเอกสาร eBook...</p>
          </div>
          <div id="ebook-error" class="d-none"></div>
          <div class="ebook-canvas-wrapper" id="ebook-canvas-wrap" style="display: none;">
            <canvas id="ebook-pdf-canvas"></canvas>
          </div>
          <iframe id="ebook-drive-iframe" class="ebook-drive-frame d-none" allow="autoplay" allowfullscreen></iframe>
        </div>

        <!-- Floating Bottom Controls -->
        <div class="ebook-modal-footer" id="ebook-modal-footer">
          <div class="ebook-controls-pill">
            <button type="button" id="ebook-prev-page" class="ebook-ctrl-btn" title="หน้าก่อนหน้า">◀ ก่อนหน้า</button>
            <div class="ebook-page-counter">
              <span>หน้า</span>
              <input type="number" id="ebook-page-current" value="1" min="1" class="ebook-page-input">
              <span>/</span>
              <span id="ebook-page-total">1</span>
            </div>
            <button type="button" id="ebook-next-page" class="ebook-ctrl-btn" title="หน้าถัดไป">ถัดไป ▶</button>
            <div class="ebook-ctrl-divider"></div>
            <button type="button" id="ebook-zoom-out" class="ebook-ctrl-icon-btn" title="ซูมออก">🔍−</button>
            <button type="button" id="ebook-zoom-in" class="ebook-ctrl-icon-btn" title="ซูมเข้า">🔍＋</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    // Bind events
    document.getElementById('ebook-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('ebook-prev-page')?.addEventListener('click', () => this.prevPage());
    document.getElementById('ebook-next-page')?.addEventListener('click', () => this.nextPage());
    document.getElementById('ebook-zoom-in')?.addEventListener('click', () => this.zoomIn());
    document.getElementById('ebook-zoom-out')?.addEventListener('click', () => this.zoomOut());

    const currentInput = document.getElementById('ebook-page-current');
    currentInput?.addEventListener('change', (e) => {
      const page = parseInt(e.target.value, 10);
      if (page >= 1 && page <= this.totalPages) {
        this.currentPageNum = page;
        this.queueRenderPage(page);
      }
    });

    document.getElementById('ebook-fullscreen-btn')?.addEventListener('click', () => {
      const container = document.querySelector('.ebook-modal-container');
      if (!document.fullscreenElement) {
        container?.requestFullscreen().catch(err => console.warn(err));
      } else {
        document.exitFullscreen().catch(err => console.warn(err));
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (this.modalEl.classList.contains('d-none')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prevPage();
      if (e.key === 'ArrowRight') this.nextPage();
    });
  }
}
