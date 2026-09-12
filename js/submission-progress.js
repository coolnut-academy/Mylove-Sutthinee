/**
 * Unified Submission Progress Controller
 * Suttinee Teacher Workspace
 * Features: Smooth Tweening, Stepper Checklist, Real-Time %, Auto-Timeout Protection
 */

export const SubmissionProgress = {
  elements: {},
  currentPercent: 0,
  tweenInterval: null,

  init() {
    this.elements = {
      overlay: document.getElementById('submissionProgressOverlay'),
      title: document.getElementById('subProgressTitle'),
      subtitle: document.getElementById('subProgressSubtitle'),
      percentNumber: document.getElementById('subProgressNumber'),
      barFill: document.getElementById('subProgressBarFill'),
      errorBox: document.getElementById('subProgressError'),
      errorMsg: document.getElementById('subProgressErrorMsg'),
      retryBtn: document.getElementById('subProgressRetryBtn')
    };
  },

  start() {
    if (!this.elements.overlay) this.init();
    if (!this.elements.overlay) return;

    this.stopTween();
    this.currentPercent = 0;
    this.updateBar(5);
    this.elements.overlay.classList.remove('hidden');
    if (this.elements.errorBox) this.elements.errorBox.classList.add('hidden');

    // รีเซ็ตสเต็ปทั้ง 5 รายการเป็นสถานะรอคิว ⏳
    for (let i = 1; i <= 5; i++) {
      const step = document.getElementById('subStep' + i);
      if (step) {
        step.className = 'sub-step-item';
        const badge = step.querySelector('.sub-step-badge');
        if (badge) badge.textContent = '⏳';
      }
    }

    this.setStep(1, 15, 'กำลังตรวจสอบความถูกต้องของข้อมูล...');
  },

  setStep(stepIndex, targetPercent, text) {
    if (!this.elements.overlay) this.init();
    if (this.elements.subtitle && text) {
      this.elements.subtitle.textContent = text;
    }

    // ขยับเปอร์เซ็นต์ไปยังเป้าหมาย
    this.animateTo(targetPercent);

    // อัปเดตสถานะสเต็ปใน Checklist
    for (let i = 1; i <= 5; i++) {
      const step = document.getElementById('subStep' + i);
      if (!step) continue;
      const badge = step.querySelector('.sub-step-badge');

      if (i < stepIndex) {
        step.className = 'sub-step-item is-completed';
        if (badge) badge.textContent = '✅';
      } else if (i === stepIndex) {
        step.className = 'sub-step-item is-active';
        if (badge) badge.textContent = '🔄';
      } else {
        step.className = 'sub-step-item';
        if (badge) badge.textContent = '⏳';
      }
    }
  },

  /**
   * จำลองเปอร์เซ็นต์ให้ไหลไปเรื่อยๆ ระหว่างรอเซิร์ฟเวอร์
   */
  simulateProgress(targetPercent = 88, intervalMs = 250) {
    this.stopTween();
    this.tweenInterval = setInterval(() => {
      if (this.currentPercent < targetPercent) {
        this.currentPercent += 1;
        this.updateBar(this.currentPercent);
      } else {
        this.stopTween();
      }
    }, intervalMs);
  },

  animateTo(target) {
    this.stopTween();
    target = Math.min(100, Math.max(0, target));

    this.tweenInterval = setInterval(() => {
      if (this.currentPercent < target) {
        this.currentPercent = Math.min(target, this.currentPercent + 2);
        this.updateBar(this.currentPercent);
      } else {
        this.stopTween();
      }
    }, 20);
  },

  updateBar(val) {
    this.currentPercent = val;
    if (this.elements.percentNumber) this.elements.percentNumber.textContent = val;
    if (this.elements.barFill) this.elements.barFill.style.width = `${val}%`;
  },

  complete(message, callback) {
    this.stopTween();
    this.setStep(5, 100, message || 'ดำเนินการสำเร็จเรียบร้อยแล้ว!');

    setTimeout(() => {
      if (this.elements.overlay) this.elements.overlay.classList.add('hidden');
      if (typeof callback === 'function') callback();
    }, 700);
  },

  error(errMsg, onRetry) {
    this.stopTween();
    if (this.elements.subtitle) this.elements.subtitle.textContent = 'เกิดข้อผิดพลาดในการทำรายการ';
    if (this.elements.errorBox) {
      this.elements.errorBox.classList.remove('hidden');
      if (this.elements.errorMsg) this.elements.errorMsg.textContent = errMsg;
      if (this.elements.retryBtn) {
        this.elements.retryBtn.onclick = () => {
          this.elements.errorBox.classList.add('hidden');
          if (typeof onRetry === 'function') onRetry();
        };
      }
    }
  },

  stopTween() {
    if (this.tweenInterval) {
      clearInterval(this.tweenInterval);
      this.tweenInterval = null;
    }
  },

  reset() {
    this.stopTween();
    this.currentPercent = 0;
    if (this.elements.overlay) this.elements.overlay.classList.add('hidden');
  }
};
