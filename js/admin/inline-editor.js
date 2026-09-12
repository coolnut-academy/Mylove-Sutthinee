/**
 * In-Place Visual Inline Editor Controller
 * Suttinee Teacher Workspace
 * 
 * Allows Admin to click pencil edit buttons (✏️) directly on sections across
 * the presentation pages without redirecting to admin console.
 */

import { AppState } from '../app-state.js';
import { SettingsApi, PaApi, AuthApi } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';

export const InlineEditor = {
  initialized: false,

  init() {
    const isAdmin = AppState.isAdmin();
    
    this.bindAdminButton();

    if (!isAdmin) {
      document.body.classList.remove('admin-mode');
      this._removeEditButtons();
      this._removeFloatingBar();
      this._updateHeaderControls(false);
      return;
    }

    document.body.classList.add('admin-mode');
    this._updateHeaderControls(true);
    this._renderFloatingBar();
    this._injectEditButtons();
    this.initialized = true;
  },

  bindAdminButton(btnId = 'btn-header-admin') {
    const btn = document.getElementById(btnId);
    if (!btn || btn._boundAdmin) return;
    btn._boundAdmin = true;

    btn.addEventListener('click', (e) => {
      if (AppState.isAdmin()) {
        // Logged in: go to Admin Console (admin.html)
        return;
      }
      // Not logged in: open login modal right on current page
      e.preventDefault();
      this.openLoginModal();
    });
  },

  openLoginModal() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="text-center mb-4">
        <div style="font-size: 2.5rem; margin-bottom: var(--space-2);">🌸</div>
        <h4 style="color: var(--purple-900);">เข้าสู่ระบบจัดการ (สำหรับครูผู้สอน)</h4>
        <p class="text-secondary" style="font-size: var(--font-size-xs);">
          คณะกรรมการและบุคคลทั่วไปสามารถรับชมผลงานได้ทันทีโดยไม่ต้องเข้าสู่ระบบ
        </p>
      </div>
      <div class="form-group">
        <label class="form-label" for="inline-admin-password">รหัสผ่านผู้ดูแลระบบ</label>
        <input type="password" id="inline-admin-password" class="form-control" placeholder="กรอกรหัสผ่าน" autofocus required>
        <div class="form-hint" style="font-size: 0.75rem;">
          โหมดทดสอบ: สามารถใช้ <code>DEV ONLY</code> หรือ <code>admin123</code>
        </div>
      </div>
    `;

    Modal.open({
      title: 'ระบบจัดการครูผู้สอน',
      body,
      confirmText: 'เข้าสู่ระบบ',
      onConfirm: async () => {
        const pwdInput = body.querySelector('#inline-admin-password');
        const password = pwdInput ? pwdInput.value.trim() : '';

        if (!password) {
          Toast.error('กรุณากรอกรหัสผ่าน');
          return false;
        }

        try {
          const res = await AuthApi.login(password);
          if (res.success && res.session) {
            AppState.setSession(res.session);
            Toast.success('เข้าสู่ระบบสำเร็จ เข้าสู่โหมดแก้ไขผลงาน (ปุ่มดินสอ ✏️ พร้อมใช้งาน)');
            this.init();
            return true;
          }
        } catch (err) {
          Toast.error(err.message || 'รหัสผ่านไม่ถูกต้อง');
          return false;
        }
      }
    });

    setTimeout(() => {
      const input = document.getElementById('inline-admin-password');
      input?.focus();
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const confirmBtn = document.querySelector('.modal-confirm-btn');
          confirmBtn?.click();
        }
      });
    }, 100);
  },

  _updateHeaderControls(isAdmin) {
    const adminBtn = document.getElementById('btn-header-admin') || document.getElementById('header-admin-btn');
    if (!adminBtn) return;

    const icon = adminBtn.querySelector('.btn-icon') || adminBtn;
    const text = adminBtn.querySelector('.btn-text');

    if (isAdmin) {
      adminBtn.className = 'btn btn-primary btn-sm';
      adminBtn.href = './admin.html';
      adminBtn.title = 'ไปที่หน้าแดชบอร์ดระบบหลัก (Admin Console)';
      if (text) text.textContent = 'Admin Console';
      else adminBtn.innerHTML = '⚙️ <span class="d-none d-sm-inline">Admin Console</span>';
    } else {
      adminBtn.className = 'btn btn-subtle btn-sm';
      adminBtn.href = '#';
      adminBtn.title = 'เข้าสู่ระบบจัดการ';
      if (text) text.textContent = 'Admin';
      else adminBtn.innerHTML = '🔒 <span class="d-none d-sm-inline">Admin</span>';
    }
  },

  _renderFloatingBar() {
    let bar = document.getElementById('admin-floating-status-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'admin-floating-status-bar';
      bar.className = 'admin-status-bar';
      document.body.appendChild(bar);
    }

    bar.innerHTML = `
      <div class="admin-status-badge">
        <span class="admin-status-dot"></span>
        <span>โหมดแก้ไขผลงาน (Admin)</span>
      </div>
      <a href="./admin.html" class="admin-status-btn admin-status-btn-console" title="เปิดหน้าจัดการตารางใหญ่">
        ⚙️ Admin Console
      </a>
      <button type="button" class="admin-status-btn admin-status-btn-logout" id="btn-floating-logout" title="ออกจากระบบ">
        🚪 ออกจากระบบ
      </button>
    `;

    bar.querySelector('#btn-floating-logout')?.addEventListener('click', async () => {
      try {
        await AuthApi.logout();
      } catch (e) {
        // ignore error on logout
      }
      AppState.clearSession();
      Toast.info('ออกจากระบบเรียบร้อยแล้ว');
      this.init();
    });
  },

  _removeFloatingBar() {
    const bar = document.getElementById('admin-floating-status-bar');
    bar?.remove();
  },

  _injectEditButtons() {
    // 1. Hero Profile Section
    const heroSection = document.querySelector('[data-editable="hero-profile"]');
    if (heroSection && !heroSection.querySelector('.btn-inline-edit')) {
      heroSection.classList.add('editable-section');
      const btn = this._createPencilBtn('แก้ไขข้อมูลครู/สถานศึกษา', () => this.editHeroProfile());
      heroSection.appendChild(btn);
    }

    // 2. Educational Motto Section
    const mottoSection = document.querySelector('[data-editable="motto"]');
    if (mottoSection && !mottoSection.querySelector('.btn-inline-edit')) {
      mottoSection.classList.add('editable-section');
      const btn = this._createPencilBtn('แก้ไขคำคม/ปรัชญาการศึกษา', () => this.editMotto());
      mottoSection.appendChild(btn);
    }

    // 3. Educational Game Cards
    document.querySelectorAll('[data-editable="game-item"]').forEach((gameCard, index) => {
      if (!gameCard.querySelector('.btn-inline-edit')) {
        gameCard.classList.add('editable-section');
        const btn = this._createPencilBtn('แก้ไขเกมนี้', () => this.editGameItem(gameCard, index));
        gameCard.appendChild(btn);
      }
    });

    // 4. Academic Book Cards (SAR, PLC, Research)
    document.querySelectorAll('[data-editable="book-item"]').forEach((bookCard, index) => {
      if (!bookCard.querySelector('.btn-inline-edit')) {
        bookCard.classList.add('editable-section');
        const btn = this._createPencilBtn('แก้ไขเล่มนี้', () => this.editBookItem(bookCard, index));
        bookCard.appendChild(btn);
      }
    });

    // 5. Honors & Awards
    const awardsSection = document.querySelector('[data-editable="awards"]');
    if (awardsSection && !awardsSection.querySelector('.btn-inline-edit')) {
      awardsSection.classList.add('editable-section');
      const btn = this._createPencilBtn('แก้ไขรายการรางวัล', () => this.editAwards());
      awardsSection.appendChild(btn);
    }

    // 6. PA Section / Challenge Cards
    document.querySelectorAll('[data-editable="pa-challenge"]').forEach(challengeCard => {
      if (!challengeCard.querySelector('.btn-inline-edit')) {
        challengeCard.classList.add('editable-section');
        const btn = this._createPencilBtn('แก้ไขประเด็นท้าทาย', () => this.editPaChallenge());
        challengeCard.appendChild(btn);
      }
    });
  },

  _removeEditButtons() {
    document.querySelectorAll('.btn-inline-edit').forEach(btn => btn.remove());
    document.querySelectorAll('.editable-section').forEach(sec => sec.classList.remove('editable-section'));
  },

  _createPencilBtn(tooltipText, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-inline-edit';
    btn.title = tooltipText;
    btn.innerHTML = `<span class="pencil-icon">✏️</span> แก้ไข`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    });
    return btn;
  },

  // ==========================================
  // Quick Edit Modals
  // ==========================================

  async editHeroProfile() {
    let settings = {};
    try {
      settings = await SettingsApi.getSettings() || {};
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    const currentName = settings.teacher_name || document.getElementById('hero-teacher-name')?.textContent?.trim() || 'นางสาวศุทธินี ถาวร';
    const currentRole = settings.teacher_role || document.getElementById('hero-teacher-role')?.textContent?.trim() || 'ครู วิทยฐานะ ชำนาญการพิเศษ';
    const currentSchool = settings.school_name || 'โรงเรียนชุมชนแม่ลาศึกษา';
    const currentAffiliation = settings.school_affiliation || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาแม่ฮ่องสอน เขต 2';
    const currentPhone = settings.contact_phone || '064-618-0472 / 053-6850149';

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-group mb-3">
        <label class="form-label" for="edit-teacher-name">ชื่อ - สกุล คุณครู</label>
        <input type="text" id="edit-teacher-name" class="form-control" value="${this._escapeHtml(currentName)}" required>
      </div>
      <div class="form-group mb-3">
        <label class="form-label" for="edit-teacher-role">ตำแหน่งและวิทยฐานะ</label>
        <input type="text" id="edit-teacher-role" class="form-control" value="${this._escapeHtml(currentRole)}" required>
      </div>
      <div class="form-group mb-3">
        <label class="form-label" for="edit-school-name">ชื่อสถานศึกษา</label>
        <input type="text" id="edit-school-name" class="form-control" value="${this._escapeHtml(currentSchool)}" required>
      </div>
      <div class="form-group mb-3">
        <label class="form-label" for="edit-school-affiliation">หน่วยงานต้นสังกัด</label>
        <input type="text" id="edit-school-affiliation" class="form-control" value="${this._escapeHtml(currentAffiliation)}">
      </div>
      <div class="form-group mb-3">
        <label class="form-label" for="edit-contact-phone">เบอร์โทรศัพท์ติดต่อ</label>
        <input type="text" id="edit-contact-phone" class="form-control" value="${this._escapeHtml(currentPhone)}">
      </div>
    `;

    Modal.open({
      title: '✏️ แก้ไขข้อมูลครูผู้สอนและสถานศึกษา',
      body,
      confirmText: '💾 บันทึกข้อมูล',
      onConfirm: async () => {
        const newName = body.querySelector('#edit-teacher-name').value.trim();
        const newRole = body.querySelector('#edit-teacher-role').value.trim();
        const newSchool = body.querySelector('#edit-school-name').value.trim();
        const newAffiliation = body.querySelector('#edit-school-affiliation').value.trim();
        const newPhone = body.querySelector('#edit-contact-phone').value.trim();

        if (!newName) {
          Toast.error('กรุณากรอกชื่อครูผู้สอน');
          return false;
        }

        try {
          await SettingsApi.saveSettings({
            teacher_name: newName,
            teacher_role: newRole,
            school_name: newSchool,
            school_affiliation: newAffiliation,
            contact_phone: newPhone
          });

          // Update DOM directly
          const nameEl = document.getElementById('hero-teacher-name');
          if (nameEl) nameEl.textContent = newName;

          const roleEl = document.getElementById('hero-teacher-role');
          if (roleEl) roleEl.textContent = newRole;

          const schoolEl = document.getElementById('hero-school-name');
          if (schoolEl) schoolEl.textContent = newSchool;

          const phoneEl = document.getElementById('hero-contact-phone');
          if (phoneEl) phoneEl.textContent = newPhone;

          Toast.success('บันทึกข้อมูลครูและสถานศึกษาเรียบร้อยแล้ว');
          return true;
        } catch (err) {
          Toast.error('บันทึกไม่สำเร็จ: ' + err.message);
          return false;
        }
      }
    });
  },

  async editMotto() {
    let settings = {};
    try {
      settings = await SettingsApi.getSettings() || {};
    } catch (e) {}

    const mottoEl = document.getElementById('hero-motto-text');
    const currentMotto = settings.motto || mottoEl?.textContent?.trim() || 'มุ่งมั่นพัฒนาการอ่านออกเขียนได้ของนักเรียนชั้น ป.๑ สู่รากฐานการเรียนรู้ตลอดชีวิต ด้วยนวัตกรรมเกมการศึกษาและการจัดการเรียนรู้เชิงรุก (Active Learning)';

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-group mb-3">
        <label class="form-label" for="edit-motto-text">ปรัชญา / คำคม / ปณิธานการจัดการเรียนรู้</label>
        <textarea id="edit-motto-text" class="form-control" rows="4" required>${this._escapeHtml(currentMotto)}</textarea>
        <div class="form-hint">ข้อความนี้จะแสดงในส่วนหัวเว็บเพื่อสะท้อนวิสัยทัศน์ของครูต่อคณะกรรมการประเมิน</div>
      </div>
    `;

    Modal.open({
      title: '✏️ แก้ไขปรัชญาและวิสัยทัศน์การสอน',
      body,
      confirmText: '💾 บันทึกข้อมูล',
      onConfirm: async () => {
        const newMotto = body.querySelector('#edit-motto-text').value.trim();
        if (!newMotto) {
          Toast.error('กรุณากรอกข้อความ');
          return false;
        }

        try {
          await SettingsApi.saveSettings({ motto: newMotto });
          if (mottoEl) mottoEl.textContent = newMotto;
          Toast.success('บันทึกวิสัยทัศน์เรียบร้อยแล้ว');
          return true;
        } catch (err) {
          Toast.error('บันทึกไม่สำเร็จ: ' + err.message);
          return false;
        }
      }
    });
  },

  editGameItem(cardEl, index) {
    const titleEl = cardEl.querySelector('.game-card-title');
    const descEl = cardEl.querySelector('.game-card-desc');
    const badgeEl = cardEl.querySelector('.badge');

    const currentTitle = titleEl?.textContent?.trim() || '';
    const currentDesc = descEl?.textContent?.trim() || '';
    const currentBadge = badgeEl?.textContent?.trim() || '';

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-group mb-3">
        <label class="form-label" for="edit-game-title">ชื่อสื่อนวัตกรรมเกม</label>
        <input type="text" id="edit-game-title" class="form-control" value="${this._escapeHtml(currentTitle)}" required>
      </div>
      <div class="form-group mb-3">
        <label class="form-label" for="edit-game-badge">ป้ายกำกับ / หมวดหมู่</label>
        <input type="text" id="edit-game-badge" class="form-control" value="${this._escapeHtml(currentBadge)}">
      </div>
      <div class="form-group mb-3">
        <label class="form-label" for="edit-game-desc">คำอธิบายและจุดเด่นของเกม</label>
        <textarea id="edit-game-desc" class="form-control" rows="3" required>${this._escapeHtml(currentDesc)}</textarea>
      </div>
    `;

    Modal.open({
      title: '✏️ แก้ไขสื่อนวัตกรรมเกมภาษาไทย',
      body,
      confirmText: '💾 บันทึกข้อมูล',
      onConfirm: async () => {
        const newTitle = body.querySelector('#edit-game-title').value.trim();
        const newBadge = body.querySelector('#edit-game-badge').value.trim();
        const newDesc = body.querySelector('#edit-game-desc').value.trim();

        if (!newTitle) {
          Toast.error('กรุณากรอกชื่อเกม');
          return false;
        }

        if (titleEl) titleEl.textContent = newTitle;
        if (badgeEl && newBadge) badgeEl.textContent = newBadge;
        if (descEl) descEl.textContent = newDesc;

        // Persist game info to settings
        try {
          await SettingsApi.saveSettings({
            [`game_${index}_title`]: newTitle,
            [`game_${index}_desc`]: newDesc,
            [`game_${index}_badge`]: newBadge
          });
          Toast.success('อัปเดตข้อมูลเกมเรียบร้อยแล้ว');
          return true;
        } catch (e) {
          Toast.info('อัปเดตการแสดงผลบนหน้าเว็บเรียบร้อยแล้ว');
          return true;
        }
      }
    });
  },

  editBookItem(cardEl, index) {
    const titleEl = cardEl.querySelector('.book-title');
    const descEl = cardEl.querySelector('.book-desc');
    const yearEl = cardEl.querySelector('.book-year-badge');

    const currentTitle = titleEl?.textContent?.trim() || '';
    const currentDesc = descEl?.textContent?.trim() || '';
    const currentYear = yearEl?.textContent?.trim() || '';

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-group mb-3">
        <label class="form-label" for="edit-book-title">ชื่อเอกสาร / แฟ้มวิชาการ</label>
        <input type="text" id="edit-book-title" class="form-control" value="${this._escapeHtml(currentTitle)}" required>
      </div>
      <div class="form-group mb-3">
        <label class="form-label" for="edit-book-year">ปีการศึกษา / ปีงบประมาณ</label>
        <input type="text" id="edit-book-year" class="form-control" value="${this._escapeHtml(currentYear)}">
      </div>
      <div class="form-group mb-3">
        <label class="form-label" for="edit-book-desc">คำอธิบายสังเขป</label>
        <textarea id="edit-book-desc" class="form-control" rows="3">${this._escapeHtml(currentDesc)}</textarea>
      </div>
    `;

    Modal.open({
      title: '✏️ แก้ไขแฟ้มผลงานวิชาการ 3 มิติ',
      body,
      confirmText: '💾 บันทึกข้อมูล',
      onConfirm: async () => {
        const newTitle = body.querySelector('#edit-book-title').value.trim();
        const newYear = body.querySelector('#edit-book-year').value.trim();
        const newDesc = body.querySelector('#edit-book-desc').value.trim();

        if (!newTitle) {
          Toast.error('กรุณากรอกชื่อเอกสาร');
          return false;
        }

        if (titleEl) titleEl.textContent = newTitle;
        if (yearEl && newYear) yearEl.textContent = newYear;
        if (descEl) descEl.textContent = newDesc;

        try {
          await SettingsApi.saveSettings({
            [`book_${index}_title`]: newTitle,
            [`book_${index}_year`]: newYear,
            [`book_${index}_desc`]: newDesc
          });
        } catch (e) {}

        Toast.success('อัปเดตแฟ้มวิชาการเรียบร้อยแล้ว');
        return true;
      }
    });
  },

  editAwards() {
    const body = document.createElement('div');
    body.innerHTML = `
      <p class="text-secondary mb-3" style="font-size: var(--font-size-sm);">
        คุณสามารถจัดการรายการรางวัลและผลงานดีเด่นได้โดยตรง หรือไปยัง Admin Console เพื่อเพิ่มเกียรติบัตรและไฟล์แนบ
      </p>
      <div class="d-flex gap-3 mt-4">
        <a href="./admin.html#tab-pa" class="btn btn-primary w-100">
          ⚙️ ไปที่หน้าจัดการรางวัลและเกียรติบัตรตัวเต็ม
        </a>
      </div>
    `;

    Modal.open({
      title: '🏆 จัดการรางวัลและเกียรติบัตรแห่งความภาคภูมิใจ',
      body,
      confirmText: 'รับทราบ',
      onConfirm: () => true
    });
  },

  async editPaChallenge() {
    const titleEl = document.querySelector('#challenge-title-text');
    const descEl = document.querySelector('#challenge-desc-text');
    const currentTitle = titleEl?.textContent?.trim() || 'การพัฒนาผลสัมฤทธิ์ทางการเรียนภาษาไทย เรื่อง การอ่านและการเขียนสะกดคำ โดยใช้รูปแบบการจัดการเรียนรู้แบบร่วมมือ STAD ร่วมกับสื่อนวัตกรรมเกมการศึกษา';
    const currentDesc = descEl?.textContent?.trim() || 'กลุ่มสาระการเรียนรู้ภาษาไทย ชั้นประถมศึกษาปีที่ ๑ โรงเรียนชุมชนแม่ลาศึกษา เพื่อแก้ปัญหาภาวะถดถอยทางการเรียนรู้ (Learning Loss) และพัฒนาทักษะการแจกลูกสะกดคำอย่างยั่งยืน';

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-group mb-3">
        <label class="form-label" for="edit-challenge-title">ชื่อประเด็นท้าทาย (ว.PA ส่วนที่ 2)</label>
        <textarea id="edit-challenge-title" class="form-control" rows="3" required>${this._escapeHtml(currentTitle)}</textarea>
      </div>
      <div class="form-group mb-3">
        <label class="form-label" for="edit-challenge-desc">คำอธิบายและผลลัพธ์ที่คาดหวัง</label>
        <textarea id="edit-challenge-desc" class="form-control" rows="3" required>${this._escapeHtml(currentDesc)}</textarea>
      </div>
    `;

    Modal.open({
      title: '✏️ แก้ไขประเด็นท้าทายในการพัฒนางาน (STAD)',
      body,
      confirmText: '💾 บันทึกข้อมูล',
      onConfirm: async () => {
        const newTitle = body.querySelector('#edit-challenge-title').value.trim();
        const newDesc = body.querySelector('#edit-challenge-desc').value.trim();

        if (!newTitle) {
          Toast.error('กรุณากรอกชื่อประเด็นท้าทาย');
          return false;
        }

        if (titleEl) titleEl.textContent = newTitle;
        if (descEl) descEl.textContent = newDesc;

        try {
          await SettingsApi.saveSettings({
            challenge_title: newTitle,
            challenge_desc: newDesc
          });
        } catch (e) {}

        Toast.success('บันทึกประเด็นท้าทายเรียบร้อยแล้ว');
        return true;
      }
    });
  },

  _escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
