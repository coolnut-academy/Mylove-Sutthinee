/**
 * Accessible Modal Manager
 * Suttinee Teacher Workspace
 */

class ModalManager {
  constructor() {
    this.activeBackdrop = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  open({ title = '', body = '', footer = '', onConfirm = null, confirmText = 'ตกลง', closeText = 'ปิด', closeOnBackdrop = true }) {
    this.close();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    backdrop.innerHTML = `
      <div class="modal-container" tabindex="-1">
        <div class="modal-header">
          <h3 class="modal-title">${this._sanitize(title)}</h3>
          <button type="button" class="btn-icon modal-close-btn" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">${typeof body === 'string' ? body : ''}</div>
        <div class="modal-footer">
          ${footer ? footer : `
            <button type="button" class="btn btn-subtle modal-cancel-btn">${closeText}</button>
            ${onConfirm ? `<button type="button" class="btn btn-primary modal-confirm-btn">${confirmText}</button>` : ''}
          `}
        </div>
      </div>
    `;

    if (body instanceof HTMLElement) {
      backdrop.querySelector('.modal-body').appendChild(body);
    }

    // Handlers
    const closeBtn = backdrop.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const cancelBtn = backdrop.querySelector('.modal-cancel-btn');
    if (cancelBtn) cancelBtn.onclick = () => this.close();

    const confirmBtn = backdrop.querySelector('.modal-confirm-btn');
    if (confirmBtn && onConfirm) {
      confirmBtn.onclick = async () => {
        const shouldClose = await onConfirm();
        if (shouldClose !== false) {
          this.close();
        }
      };
    }

    if (closeOnBackdrop) {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) this.close();
      };
    }

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    this.activeBackdrop = backdrop;

    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      const container = backdrop.querySelector('.modal-container');
      if (container) container.focus();
    });

    document.addEventListener('keydown', this._handleKeyDown);
    return backdrop;
  }

  confirm({ title = 'ยืนยันการดำเนินการ', message = 'คุณต้องการดำเนินการนี้ใช่หรือไม่?', onConfirm, confirmText = 'ยืนยัน', danger = false }) {
    const footer = `
      <button type="button" class="btn btn-subtle modal-cancel-btn">ยกเลิก</button>
      <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'} modal-confirm-btn">${confirmText}</button>
    `;
    return this.open({
      title,
      body: `<p style="color: var(--text-secondary);">${this._sanitize(message)}</p>`,
      footer,
      onConfirm
    });
  }

  close() {
    if (!this.activeBackdrop) return;
    const backdrop = this.activeBackdrop;
    this.activeBackdrop = null;

    backdrop.classList.remove('open');
    document.removeEventListener('keydown', this._handleKeyDown);
    document.body.style.overflow = '';

    setTimeout(() => {
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    }, 250);
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  _sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

export const Modal = new ModalManager();
