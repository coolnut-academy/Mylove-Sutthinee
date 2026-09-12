/**
 * Accessible Modal Manager
 * Suttinee Teacher Workspace
 */

import { Loading } from './loading.js';
import { Toast } from './toast.js';

class ModalManager {
  constructor() {
    this.activeBackdrop = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  open({ title = '', body = '', footer = '', onConfirm = null, confirmText = 'ตกลง', closeText = 'ปิด', closeOnBackdrop = true }) {
    if (this.activeBackdrop?._saving) return this.activeBackdrop;
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
    // Focus explicitly after mounting; native autofocus conflicts with the opener.
    const focusTarget = backdrop.querySelector('[autofocus]');
    backdrop.querySelectorAll('[autofocus]').forEach(el => el.removeAttribute('autofocus'));

    // Handlers
    const closeBtn = backdrop.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const cancelBtn = backdrop.querySelector('.modal-cancel-btn');
    if (cancelBtn) cancelBtn.onclick = () => this.close();

    const confirmBtn = backdrop.querySelector('.modal-confirm-btn');
    if (confirmBtn && onConfirm) {
      confirmBtn.onclick = async () => {
        if (backdrop._saving) return;
        if ([...backdrop.querySelectorAll('[data-pending-images]')].some(el => Number(el.dataset.pendingImages) > 0)) {
          Toast.info('กำลังเตรียมรูปภาพ กรุณารอให้เสร็จก่อนบันทึก');
          return;
        }
        backdrop._saving = true;
        const controls = [...backdrop.querySelectorAll('button, input, textarea, select')];
        const disabled = controls.map(el => el.disabled);
        controls.forEach(el => { el.disabled = true; });
        progress.classList.remove('d-none');
        Loading.start('กำลังดำเนินการ...');
        let shouldClose = false;
        try {
          shouldClose = await onConfirm();
          if (shouldClose === false) Loading.fail('ยังไม่บันทึก กรุณาตรวจสอบข้อมูลแล้วลองใหม่');
          else Loading.done('ดำเนินการเรียบร้อย');
        } catch (error) {
          Loading.fail(error.message || 'ดำเนินการไม่สำเร็จ');
          Toast.error(error.message || 'ดำเนินการไม่สำเร็จ');
        } finally {
          backdrop._saving = false;
          controls.forEach((el, i) => { el.disabled = disabled[i]; });
        }
        if (shouldClose !== false && this.activeBackdrop === backdrop) this.close();
      };
    }

    const progress = document.createElement('div');
    progress.className = 'd-none';
    progress.style.cssText = 'flex:0 0 100%;font-size:0.9rem;';
    progress.innerHTML = '<strong data-loading-percent>0%</strong> <span data-loading-message></span><div><small data-loading-detail></small></div>';
    backdrop.querySelector('.modal-footer').prepend(progress);
    backdrop.querySelector('.modal-footer').style.flexWrap = 'wrap';

    if (closeOnBackdrop) {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) this.close();
      };
    }

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    this.activeBackdrop = backdrop;

    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      if (this.activeBackdrop !== backdrop) return;
      const target = focusTarget || backdrop.querySelector('.modal-container');
      if (target && !backdrop.contains(document.activeElement)) target.focus();
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
    if (this.activeBackdrop._saving) return;
    const backdrop = this.activeBackdrop;
    this.activeBackdrop = null;

    backdrop.classList.remove('open');
    document.removeEventListener('keydown', this._handleKeyDown);
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');

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
