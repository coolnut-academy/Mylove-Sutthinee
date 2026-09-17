/** Shared progress for real pending work. Network percentages are estimates. */
export class LoadingManager {
  constructor() {
    this.progress = 0;
    this.activeCount = 0;
    this.isShowing = false;
    this.timer = null;
    this.hideTimer = null;
    this.safetyTimer = null;
    this.message = '';
    this.failure = null;
  }

  _ensureDOM() {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('global-loading-indicator')) {
      const indicator = document.createElement('aside');
      indicator.id = 'global-loading-indicator';
      indicator.className = 'global-loading-indicator hidden';
      indicator.innerHTML = `<div class="loading-indicator-pill">
        <div class="loading-indicator-icon-wrap"><span id="global-loading-icon">☁️</span><span class="loading-spinner-ring"></span></div>
        <div class="loading-indicator-info">
          <div class="loading-indicator-header"><span id="global-loading-msg" class="loading-indicator-text" role="status"></span>
            <span class="loading-indicator-percent"><strong id="global-loading-percent-number">0</strong><small>%</small></span></div>
          <div class="loading-indicator-track" role="progressbar" aria-label="ความคืบหน้าโดยประมาณ" aria-valuemin="0" aria-valuemax="100" data-loading-bar>
            <div id="global-loading-pill-fill" class="loading-indicator-fill" data-loading-fill></div></div>
          <small class="loading-detail" data-loading-detail></small>
        </div></div>`;
      document.body.appendChild(indicator);
    }
    this.indicatorEl = document.getElementById('global-loading-indicator');
    this.msgEl = document.getElementById('global-loading-msg');
    this.percentEl = document.getElementById('global-loading-percent-number');
    this.iconEl = document.getElementById('global-loading-icon');
  }

  start(message = 'กำลังโหลดข้อมูล...') {
    this._ensureDOM();
    clearTimeout(this.hideTimer);
    if (this.activeCount === 0) {
      this.startedAt = Date.now();
      this.progress = 5;
      this.failure = null;
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        this.progress = Math.max(this.progress, Math.min(95, this.progress + Math.max(0.05, (95 - this.progress) * 0.035)));
        this._update();
      }, 500);
    }
    this.activeCount++;
    this.isShowing = true;
    this.message = message;
    this.indicatorEl?.classList.remove('hidden', 'success', 'failed');
    this.indicatorEl?.classList.add('show');
    if (this.iconEl) this.iconEl.textContent = '☁️';
    this._update();

    // 💡 Safety timeout: ถ้า Loading ค้างนานกว่า 30 วินาที ให้ force reset
    clearTimeout(this.safetyTimer);
    this.safetyTimer = setTimeout(() => {
      if (this.activeCount > 0) {
        console.warn(`[Loading] Safety timeout fired after 30s, activeCount was ${this.activeCount}`);
        this.forceReset();
      }
    }, 30000);
  }

  set(percent, message) {
    if (!this.activeCount) this.start(message);
    this.progress = Math.max(this.progress, Math.min(99, Number(percent) || 0));
    this.setMessage(message);
  }
  setMessage(message) {
    if (message) this.message = message;
    this._update();
  }
  inc(amount = 10) { this.set(this.progress + amount); }
  done(message = 'ดำเนินการสำเร็จ') { this._finish(null, message); }
  fail(message = 'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง') { this._finish(message); }

  _finish(error, message) {
    if (!this.activeCount) return;
    if (error) this.failure = error;
    this.activeCount--;
    if (this.activeCount > 0) { this._update(); return; }
    clearInterval(this.timer);
    clearTimeout(this.safetyTimer);
    this.timer = null;
    this.message = this.failure || message;
    if (!this.failure) this.progress = 100;
    if (this.iconEl) this.iconEl.textContent = this.failure ? '⚠️' : '✅';
    this.indicatorEl?.classList.add(this.failure ? 'failed' : 'success');
    this._update();
    this.hideTimer = setTimeout(() => {
      this.indicatorEl?.classList.remove('show');
      this.indicatorEl?.classList.add('hidden');
      this.isShowing = false;
    }, this.failure ? 7000 : 1100);
  }

  /** Force-reset all state — use when loading gets stuck */
  forceReset() {
    this.activeCount = 0;
    this.progress = 0;
    this.failure = null;
    clearInterval(this.timer);
    clearTimeout(this.hideTimer);
    clearTimeout(this.safetyTimer);
    this.timer = null;
    this.indicatorEl?.classList.remove('show', 'success', 'failed');
    this.indicatorEl?.classList.add('hidden');
    this.isShowing = false;
  }

  _update() {
    if (typeof document === 'undefined') return;
    const percent = Math.floor(this.progress);
    const seconds = Math.floor((Date.now() - (this.startedAt || Date.now())) / 1000);
    const detail = this.activeCount > 0
      ? `ประมาณการ · รอ ${seconds} วินาที${seconds >= 15 ? ' · ยังทำงานอยู่ กรุณารอสักครู่' : ''}`
      : (this.failure ? 'ยังไม่สำเร็จ · ลองทำรายการอีกครั้ง' : 'เสร็จสมบูรณ์');
    if (this.percentEl) this.percentEl.textContent = String(percent);
    if (this.msgEl) this.msgEl.textContent = this.message;
    document.querySelectorAll('[data-loading-percent]').forEach(el => { el.textContent = `${percent}%`; });
    document.querySelectorAll('[data-loading-message]').forEach(el => { el.textContent = this.message; });
    document.querySelectorAll('[data-loading-detail]').forEach(el => { el.textContent = detail; });
    document.querySelectorAll('[data-loading-fill]').forEach(el => { el.style.width = `${percent}%`; });
    document.querySelectorAll('[data-loading-bar]').forEach(el => { el.setAttribute('aria-valuenow', String(percent)); });
  }
}

export const Loading = new LoadingManager();

