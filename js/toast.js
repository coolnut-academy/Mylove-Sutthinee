/**
 * Toast Notification System
 * Suttinee Teacher Workspace
 */

class ToastService {
  constructor() {
    this.container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    if (typeof document === 'undefined') return;
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  }

  show({ message, title = '', type = 'info', duration = 3500 }) {
    this._ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div style="font-weight: bold; color: var(--color-primary-dark);">${icons[type] || '•'}</div>
      <div style="flex: 1;">
        ${title ? `<div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 2px;">${this._escape(title)}</div>` : ''}
        <div style="color: var(--text-secondary);">${this._escape(message)}</div>
      </div>
      <button type="button" style="color: var(--text-muted); cursor: pointer; padding: 2px;" aria-label="Close">&times;</button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.onclick = () => this._remove(toast);

    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const timer = setTimeout(() => {
      this._remove(toast);
    }, duration);

    toast._timer = timer;
  }

  success(message, title = 'สำเร็จ') {
    this.show({ message, title, type: 'success' });
  }

  error(message, title = 'เกิดข้อผิดพลาด') {
    this.show({ message, title, type: 'error' });
  }

  info(message, title = 'แจ้งเตือน') {
    this.show({ message, title, type: 'info' });
  }

  _remove(toast) {
    if (toast._timer) clearTimeout(toast._timer);
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }

  _escape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

export const Toast = new ToastService();
