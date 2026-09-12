/**
 * Global Loading System with Real-Time Percentage & Floating Pill Badge
 * Theme: Lavender Cozy Academic
 * Features: Top Screen Glow Bar + Floating Glassmorphism Indicator with % Numbers
 */

class LoadingManager {
  constructor() {
    this.progress = 0;
    this.targetProgress = 0;
    this.timer = null;
    this.tweenTimer = null;
    this.barEl = null;
    this.indicatorEl = null;
    this.msgEl = null;
    this.percentEl = null;
    this.pillFillEl = null;
    this.iconEl = null;
    this.isShowing = false;
    this._ensureDOM();
  }

  _ensureDOM() {
    if (typeof document === 'undefined') return;

    // 1. Top Edge Bar
    this.barEl = document.getElementById('top-progress-bar');
    if (!this.barEl) {
      this.barEl = document.createElement('div');
      this.barEl.id = 'top-progress-bar';
      this.barEl.setAttribute('role', 'progressbar');
      this.barEl.setAttribute('aria-valuemin', '0');
      this.barEl.setAttribute('aria-valuemax', '100');
      document.body.prepend(this.barEl);
    }

    // 2. Floating Percentage Pill Indicator
    this.indicatorEl = document.getElementById('global-loading-indicator');
    if (!this.indicatorEl) {
      this.indicatorEl = document.createElement('aside');
      this.indicatorEl.id = 'global-loading-indicator';
      this.indicatorEl.className = 'global-loading-indicator hidden';
      this.indicatorEl.setAttribute('aria-live', 'polite');
      this.indicatorEl.innerHTML = `
        <div class="loading-indicator-pill">
          <div class="loading-indicator-icon-wrap">
            <span id="global-loading-icon" class="loading-indicator-icon">☁️</span>
            <span class="loading-spinner-ring"></span>
          </div>
          <div class="loading-indicator-info">
            <div class="loading-indicator-header">
              <span id="global-loading-msg" class="loading-indicator-text">กำลังดึงข้อมูลจาก Google Sheets...</span>
              <span class="loading-indicator-percent">
                <strong id="global-loading-percent-number">0</strong><small>%</small>
              </span>
            </div>
            <div class="loading-indicator-track">
              <div id="global-loading-pill-fill" class="loading-indicator-fill" style="width: 0%;"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(this.indicatorEl);
    }

    this.msgEl = document.getElementById('global-loading-msg');
    this.percentEl = document.getElementById('global-loading-percent-number');
    this.pillFillEl = document.getElementById('global-loading-pill-fill');
    this.iconEl = document.getElementById('global-loading-icon');
  }

  /**
   * เริ่มต้นแสดง Progress Bar พร้อมตัวเลข %
   * @param {string} [message] - ข้อความที่ต้องการแสดง
   */
  start(message = 'กำลังดึงข้อมูลจาก Google Sheets...') {
    this._ensureDOM();
    if (this.timer) clearInterval(this.timer);
    if (this.tweenTimer) clearInterval(this.tweenTimer);

    this.progress = 12;
    this.targetProgress = 12;
    this.isShowing = true;

    if (this.msgEl) this.msgEl.textContent = message;
    if (this.iconEl) this.iconEl.textContent = '☁️';
    if (this.indicatorEl) {
      this.indicatorEl.classList.remove('hidden', 'success', 'failed');
      this.indicatorEl.classList.add('show');
    }
    if (this.barEl) {
      this.barEl.classList.remove('failed', 'success');
      this.barEl.style.opacity = '1';
    }

    this._update(this.progress);

    // จำลองเปอร์เซ็นต์ไหลนุ่มนวล (Trickle) ระหว่างรอ Network
    this.timer = setInterval(() => {
      if (this.progress < 85) {
        const step = Math.floor(Math.random() * 5) + 2; // เพิ่มทีละ 2-6%
        this.progress = Math.min(85, this.progress + step);
        this._update(this.progress);
      }
    }, 280);
  }

  /**
   * กำหนดค่าเปอร์เซ็นต์เป้าหมาย
   * @param {number} percent - ค่าเปอร์เซ็นต์ 0-100
   * @param {string} [message] - ข้อความเสริม
   */
  set(percent, message) {
    this._ensureDOM();
    if (!this.isShowing) {
      this.start(message);
    }

    if (message && this.msgEl) {
      this.msgEl.textContent = message;
    }

    const target = Math.min(100, Math.max(0, percent));
    this._animateTo(target);

    if (target >= 100) {
      this.done();
    }
  }

  inc(amount = 10) {
    this.set(this.progress + amount);
  }

  /**
   * เสร็จสิ้นการโหลด (100%)
   * @param {string} [message]
   */
  done(message = 'โหลดข้อมูลสำเร็จเรียบร้อย') {
    this._ensureDOM();
    if (this.timer) clearInterval(this.timer);
    if (this.tweenTimer) clearInterval(this.tweenTimer);

    this.progress = 100;
    this._update(100);

    if (this.iconEl) this.iconEl.textContent = '✅';
    if (this.msgEl) this.msgEl.textContent = message;
    if (this.indicatorEl) this.indicatorEl.classList.add('success');

    // หน่วงเวลาเล็กน้อยเพื่อให้ผู้ใช้เห็นว่าครบ 100% แล้วค่อยสไลด์ปิด
    setTimeout(() => {
      if (this.indicatorEl) {
        this.indicatorEl.classList.remove('show');
        setTimeout(() => {
          if (this.indicatorEl) this.indicatorEl.classList.add('hidden');
        }, 300);
      }

      if (this.barEl) {
        this.barEl.style.opacity = '0';
        setTimeout(() => {
          if (this.barEl) {
            this.barEl.style.width = '0%';
            this.barEl.style.opacity = '1';
            this.barEl.classList.remove('failed', 'success');
          }
        }, 300);
      }

      this.isShowing = false;
    }, 500);
  }

  /**
   * แจ้งเตือนกรณีเกิดข้อผิดพลาดในการโหลด
   * @param {string} [message]
   */
  fail(message = 'การเชื่อมต่อคลาวด์ขัดข้อง') {
    this._ensureDOM();
    if (this.timer) clearInterval(this.timer);
    if (this.tweenTimer) clearInterval(this.tweenTimer);

    if (this.iconEl) this.iconEl.textContent = '⚠️';
    if (this.msgEl) this.msgEl.textContent = message;
    if (this.indicatorEl) {
      this.indicatorEl.classList.add('failed');
      this.indicatorEl.classList.add('show');
    }
    if (this.barEl) {
      this.barEl.classList.add('failed');
      this.barEl.style.background = 'var(--danger-mid)';
    }

    this._update(100);

    setTimeout(() => {
      if (this.indicatorEl) {
        this.indicatorEl.classList.remove('show');
        setTimeout(() => {
          if (this.indicatorEl) this.indicatorEl.classList.add('hidden');
        }, 300);
      }
      this.isShowing = false;
    }, 1200);
  }

  _animateTo(target) {
    if (this.tweenTimer) clearInterval(this.tweenTimer);
    target = Math.min(100, Math.max(0, target));

    this.tweenTimer = setInterval(() => {
      if (this.progress < target) {
        this.progress = Math.min(target, this.progress + 2);
        this._update(this.progress);
      } else {
        clearInterval(this.tweenTimer);
      }
    }, 20);
  }

  _update(percent) {
    const rounded = Math.round(percent);
    if (this.barEl) {
      this.barEl.style.width = `${percent}%`;
      this.barEl.setAttribute('aria-valuenow', String(rounded));
    }
    if (this.pillFillEl) {
      this.pillFillEl.style.width = `${percent}%`;
    }
    if (this.percentEl) {
      this.percentEl.textContent = String(rounded);
    }
  }
}

export const Loading = new LoadingManager();
