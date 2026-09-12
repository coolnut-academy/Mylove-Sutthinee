/**
 * Global Loading System
 * Theme: Lavender Cozy Academic
 */

class LoadingManager {
  constructor() {
    this.progress = 0;
    this.timer = null;
    this.barEl = null;
    this._ensureDOM();
  }

  _ensureDOM() {
    if (typeof document === 'undefined') return;
    this.barEl = document.getElementById('top-progress-bar');
    if (!this.barEl) {
      this.barEl = document.createElement('div');
      this.barEl.id = 'top-progress-bar';
      document.body.prepend(this.barEl);
    }
  }

  start() {
    this._ensureDOM();
    if (this.timer) clearInterval(this.timer);
    this.progress = 10;
    this._update(this.progress);

    // Subtle trickle
    this.timer = setInterval(() => {
      if (this.progress < 85) {
        this.progress += Math.floor(Math.random() * 8) + 2;
        this._update(this.progress);
      }
    }, 250);
  }

  set(percent) {
    this._ensureDOM();
    this.progress = Math.min(100, Math.max(0, percent));
    this._update(this.progress);
    if (this.progress >= 100) {
      this.done();
    }
  }

  inc(amount = 10) {
    this.set(this.progress + amount);
  }

  done() {
    this._ensureDOM();
    if (this.timer) clearInterval(this.timer);
    this.progress = 100;
    this._update(100);

    setTimeout(() => {
      if (this.barEl) {
        this.barEl.style.opacity = '0';
        setTimeout(() => {
          if (this.barEl) {
            this.barEl.style.width = '0%';
            this.barEl.style.opacity = '1';
            this.barEl.classList.remove('failed');
          }
        }, 300);
      }
    }, 200);
  }

  fail() {
    this._ensureDOM();
    if (this.timer) clearInterval(this.timer);
    if (this.barEl) {
      this.barEl.classList.add('failed');
      this.barEl.style.background = 'var(--danger-mid)';
      this._update(100);
      setTimeout(() => this.done(), 800);
    }
  }

  _update(percent) {
    if (this.barEl) {
      this.barEl.style.width = `${percent}%`;
    }
  }
}

export const Loading = new LoadingManager();
