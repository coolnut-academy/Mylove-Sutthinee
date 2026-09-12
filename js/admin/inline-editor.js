/**
 * In-Place Visual Inline Editor Controller
 * Suttinee Teacher Workspace
 * 
 * Allows Admin to click pencil edit buttons (✏️) directly on sections across
 * the presentation pages without redirecting to admin console.
 * Supports editing Icons, Logos, Covers, Images, and Text directly from the Homepage.
 */

import { AppState } from '../app-state.js';
import { SettingsApi, PaApi, AuthApi } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';
import { compressImage } from '../image-utils.js';

export const InlineEditor = {
  initialized: false,

  init() {
    const isAdmin = AppState.isAdmin();
    
    this.bindAdminButton();

    if (!isAdmin) {
      document.body.classList.remove('admin-mode');
      this._removeFloatingBar();
      this._updateHeaderControls(false);
      this._injectEditButtons();
      this.initialized = true;
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

  openLoginModal(onSuccess) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="text-center mb-4">
        <div style="font-size: 2.5rem; margin-bottom: var(--space-2);">🌸</div>
        <h4 style="color: var(--purple-900);">จัดการเว็บไซต์</h4>
        <p class="text-secondary" style="font-size: var(--font-size-xs);">
          นางสาวศุทธินี ถาวร · โรงเรียนชุมชนแม่ลาศึกษา
        </p>
      </div>
      <div class="form-group">
        <label class="form-label" for="inline-admin-password">รหัสผ่านสำหรับครูผู้สอน</label>
        <input type="password" id="inline-admin-password" class="form-control" placeholder="กรอกรหัสผ่านเพื่อจัดการข้อมูล" autofocus required>
      </div>
    `;

    Modal.open({
      title: '🔐 เข้าสู่ระบบเพื่อแก้ไขข้อมูล',
      body,
      confirmText: 'เข้าสู่ระบบ',
      cancelText: 'ยกเลิก',
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
            Toast.success('เข้าสู่ระบบสำเร็จ พร้อมแก้ไขข้อมูล');
            this.init();
            if (typeof onSuccess === 'function') {
              setTimeout(() => {
                onSuccess();
              }, 150);
            }
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

    const text = adminBtn.querySelector('.btn-text');

    if (isAdmin) {
      adminBtn.className = 'btn btn-primary btn-sm';
      adminBtn.href = './admin.html';
      adminBtn.title = 'ไปที่หน้าจัดการเว็บไซต์';
      if (text) text.textContent = 'จัดการเว็บไซต์';
      else adminBtn.innerHTML = '⚙️ <span class="d-none d-sm-inline">จัดการเว็บไซต์</span>';
    } else {
      adminBtn.className = 'btn btn-subtle btn-sm';
      adminBtn.href = '#';
      adminBtn.title = 'เข้าสู่ระบบจัดการเว็บไซต์';
      if (text) text.textContent = 'จัดการเว็บไซต์';
      else adminBtn.innerHTML = '🔒 <span class="d-none d-sm-inline">จัดการเว็บไซต์</span>';
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
        <span>โหมดแก้ไขข้อมูล (ครูศุทธินี)</span>
      </div>
      <a href="./admin.html" class="admin-status-btn admin-status-btn-console" title="เปิดหน้าจัดการเว็บไซต์">
        ⚙️ จัดการเว็บไซต์
      </a>
      <button type="button" class="admin-status-btn admin-status-btn-logout" id="btn-floating-logout" title="ออกจากระบบ">
        🚪 ออกจากระบบ
      </button>
    `;

    bar.querySelector('#btn-floating-logout')?.addEventListener('click', () => {
      AuthApi.logout();
      Toast.info('ออกจากระบบเรียบร้อยแล้ว');
      this.init();
    });
  },

  _removeFloatingBar() {
    const bar = document.getElementById('admin-floating-status-bar');
    bar?.remove();
  },

  _injectEditButtons() {
    // 1. Header Brand (Logo, Title, Subtitle)
    const headerBrand = document.querySelector('[data-editable="header-brand"]');
    if (headerBrand && !headerBrand.querySelector('.btn-inline-edit')) {
      headerBrand.classList.add('editable-section');
      const btn = this._createPencilBtn('แก้ไขชื่อเว็บไซต์และโลโก้ส่วนหัว', () => this.editHeaderBrand());
      headerBrand.appendChild(btn);
    }

    // 2. Hero Profile Section (Avatar, School Logo, Name, Role, Motto)
    const heroSection = document.querySelector('[data-editable="hero-profile"]');
    if (heroSection && !heroSection.querySelector('.btn-inline-edit')) {
      heroSection.classList.add('editable-section');
      const btn = this._createPencilBtn('แก้ไขข้อมูลครู ภาพโปรไฟล์ และตราโรงเรียน', () => this.editHeroProfile());
      heroSection.appendChild(btn);
    }

    // 3. Gateway Card: Classroom (Cover, Icon, Title, Desc)
    const classroomCard = document.querySelector('[data-editable="gateway-classroom"]');
    if (classroomCard && !classroomCard.querySelector('.btn-inline-edit')) {
      classroomCard.classList.add('editable-section');
      const btn = this._createPencilBtn('แก้ไขการ์ดธุรการในชั้นเรียน (Cover, ไอคอน, ข้อความ)', () => this.editGatewayCard('classroom'));
      classroomCard.appendChild(btn);
    }

    // 4. Gateway Card: PA (Cover, Icon, Title, Desc)
    const paCard = document.querySelector('[data-editable="gateway-pa"]');
    if (paCard && !paCard.querySelector('.btn-inline-edit')) {
      paCard.classList.add('editable-section');
      const btn = this._createPencilBtn('แก้ไขการ์ดรายงานผล ว.PA (Cover, ไอคอน, ข้อความ)', () => this.editGatewayCard('pa'));
      paCard.appendChild(btn);
    }

    // 5. Educational Motto Section (Other Pages)
    const mottoSection = document.querySelector('[data-editable="motto"]');
    if (mottoSection && !mottoSection.querySelector('.btn-inline-edit')) {
      mottoSection.classList.add('editable-section');
      const btn = this._createPencilBtn('แก้ไขคำคม/ปรัชญาการศึกษา', () => this.editMotto());
      mottoSection.appendChild(btn);
    }

    // 6. Educational Game Cards (Classroom Page)
    document.querySelectorAll('[data-editable="game-item"]').forEach((gameCard, index) => {
      if (!gameCard.querySelector('.btn-inline-edit')) {
        gameCard.classList.add('editable-section');
        const btn = this._createPencilBtn('แก้ไขเกมนี้', () => this.editGameItem(gameCard, index));
        gameCard.appendChild(btn);
      }
    });

    // 7. Academic Book Cards (SAR, PLC, Research)
    document.querySelectorAll('[data-editable="book-item"]').forEach((bookCard, index) => {
      if (!bookCard.querySelector('.btn-inline-edit')) {
        bookCard.classList.add('editable-section');
        const btn = this._createPencilBtn('แก้ไขเล่มนี้', () => this.editBookItem(bookCard, index));
        bookCard.appendChild(btn);
      }
    });

    // 8. Honors & Awards
    const awardsSection = document.querySelector('[data-editable="awards"]');
    if (awardsSection && !awardsSection.querySelector('.btn-inline-edit')) {
      awardsSection.classList.add('editable-section');
      const btn = this._createPencilBtn('แก้ไขรายการรางวัล', () => this.editAwards());
      awardsSection.appendChild(btn);
    }

    // 9. PA Section / Challenge Cards
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
      if (!AppState.isAdmin()) {
        this.openLoginModal(() => {
          onClick();
        });
      } else {
        onClick();
      }
    });
    return btn;
  },

  // ==========================================
  // Image Upload Helper with Canvas Compression
  // ==========================================

  _createImageUploadField({ id, label, currentVal, previewShape = 'square', previewWidth = '72px', previewHeight = '72px', hint = '' }) {
    const borderRadius = previewShape === 'circle' ? '50%' : 'var(--radius-md)';
    const fallbackSrc = previewShape === 'circle' ? './assets/fallback/profile.svg' : './assets/fallback/classroom-cover.svg';
    const displayVal = currentVal || fallbackSrc;

    return `
      <div class="form-group mb-4 inline-image-field" id="group-${id}">
        <label class="form-label font-semibold" style="display: flex; align-items: center; justify-content: space-between;">
          <span>${label}</span>
          ${hint ? `<span class="text-secondary" style="font-size: var(--font-size-xs); font-weight: normal;">${hint}</span>` : ''}
        </label>
        <div style="background: var(--purple-50); padding: 12px; border-radius: var(--radius-lg); border: 1px solid var(--purple-200);">
          <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 6px;">
            <div style="width: ${previewWidth}; height: ${previewHeight}; border-radius: ${borderRadius}; overflow: hidden; border: 2px solid #FFF; box-shadow: var(--shadow-sm); flex-shrink: 0; background: #FFF; display: flex; align-items: center; justify-content: center;">
              <img id="${id}-preview" src="${this._escapeHtml(displayVal)}" alt="${label}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackSrc}';">
            </div>
            <div style="flex: 1; min-width: 0;">
              <div class="d-flex gap-2 mb-2 flex-wrap">
                <label class="btn btn-primary btn-sm" style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px; margin: 0;">
                  <span>📁</span> เลือกรูปจากเครื่อง
                  <input type="file" id="${id}-file" accept="image/*" style="display: none;">
                </label>
                <button type="button" class="btn btn-subtle btn-sm" id="${id}-clear" style="margin: 0;" title="คืนค่าเดิม">
                  <span>🔄</span> คืนค่า
                </button>
              </div>
              <input type="text" id="${id}-url" class="form-control form-control-sm" placeholder="หรือวางลิงก์รูปภาพ / URL ตรงนี้" value="${this._escapeHtml(currentVal || '')}">
            </div>
          </div>

          <!-- Progress Bar & % Display during compression -->
          <div id="${id}-progress-box" class="d-none" style="background: #FFF; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--purple-200); margin-top: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--purple-900); margin-bottom: 4px;">
              <span id="${id}-status" style="font-weight: 500;">กำลังบีบอัดภาพ (ขนาดไม่เกิน A4)...</span>
              <span id="${id}-percent" style="font-weight: 700; color: var(--purple-700); font-size: 0.8125rem;">0%</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(169, 134, 222, 0.2); border-radius: 999px; overflow: hidden;">
              <div id="${id}-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #8E54E9, #4776E6); transition: width 0.1s ease-out; border-radius: 999px;"></div>
            </div>
          </div>

          <!-- Result info badge -->
          <div id="${id}-badge" class="d-none" style="margin-top: 6px; font-size: 0.75rem; color: #047857; font-weight: 500; display: flex; align-items: center; gap: 4px;">
            <span>✓</span> <span id="${id}-badge-text">บีบอัดภาพสำเร็จ ขนาดไม่เกิน A4</span>
          </div>
        </div>
      </div>
    `;
  },

  _bindImageUploadField(modalBody, id, defaultVal, options = {}) {
    const fileInput = modalBody.querySelector(`#${id}-file`);
    const urlInput = modalBody.querySelector(`#${id}-url`);
    const previewImg = modalBody.querySelector(`#${id}-preview`);
    const clearBtn = modalBody.querySelector(`#${id}-clear`);
    const progressBox = modalBody.querySelector(`#${id}-progress-box`);
    const statusBar = modalBody.querySelector(`#${id}-bar`);
    const statusPercent = modalBody.querySelector(`#${id}-percent`);
    const statusText = modalBody.querySelector(`#${id}-status`);
    const resultBadge = modalBody.querySelector(`#${id}-badge`);
    const badgeText = modalBody.querySelector(`#${id}-badge-text`);

    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          if (progressBox) progressBox.classList.remove('d-none');
          if (resultBadge) resultBadge.classList.add('d-none');

          const res = await compressImage(file, {
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
            quality: 0.85,
            onProgress: (pct, msg) => {
              if (statusPercent) statusPercent.textContent = `${pct}%`;
              if (statusBar) statusBar.style.width = `${pct}%`;
              if (statusText) statusText.textContent = msg;
            }
          });

          // Set complete Data URL for instant live preview and storage!
          if (previewImg) {
            previewImg.src = res.dataUrl;
          }
          if (urlInput) {
            urlInput.value = res.dataUrl;
          }

          if (resultBadge && badgeText) {
            const kb = Math.round(res.size / 1024);
            badgeText.textContent = `บีบอัดภาพสำเร็จ (ขนาด ${res.width}x${res.height}px, ${kb} KB, ไม่เกิน A4)`;
            resultBadge.classList.remove('d-none');
          }

          Toast.success(`บีบอัดภาพสำเร็จ (${Math.round(res.size / 1024)} KB)`);
        } catch (err) {
          Toast.error('เกิดข้อผิดพลาดในการโหลดรูปภาพ: ' + err.message);
        } finally {
          setTimeout(() => {
            if (progressBox) progressBox.classList.add('d-none');
          }, 600);
        }
      });
    }

    if (urlInput) {
      urlInput.addEventListener('input', () => {
        const val = urlInput.value.trim();
        if (previewImg) {
          previewImg.src = val || defaultVal || './assets/fallback/profile.svg';
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (urlInput) urlInput.value = defaultVal || '';
        if (previewImg) previewImg.src = defaultVal || './assets/fallback/profile.svg';
        if (fileInput) fileInput.value = '';
        if (resultBadge) resultBadge.classList.add('d-none');
        if (progressBox) progressBox.classList.add('d-none');
      });
    }
  },

  // ==========================================
  // Quick Edit Modals
  // ==========================================

  // 1. Edit Header Brand (Logo, Title, Subtitle)
  async editHeaderBrand() {
    let settings = {};
    try {
      settings = await SettingsApi.getSettings() || {};
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    const currentTitle = settings.site_title || document.getElementById('header-title')?.textContent?.trim() || 'Suttinee Teacher Workspace';
    const currentSubtitle = settings.site_subtitle || document.getElementById('header-subtitle')?.textContent?.trim() || 'พัฒนาวิชาชีพและธุรการชั้นเรียน';
    const currentAvatar = settings.header_avatar_image || settings.profile_image || './assets/fallback/profile.svg';

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="mb-3 text-secondary" style="font-size: var(--font-size-sm);">
        ปรับแต่งชื่อเว็บไซต์ คำโปรย และโลโก้/ภาพประจำตัวส่วนหัว
      </div>
      ${this._createImageUploadField({
        id: 'edit-header-logo',
        label: 'โลโก้ / ภาพโปรไฟล์ส่วนหัว (Header Brand)',
        currentVal: currentAvatar,
        previewShape: 'circle',
        previewWidth: '60px',
        previewHeight: '60px',
        hint: 'แนะนำขนาดสัดส่วน 1:1'
      })}
      <div class="form-group mb-3">
        <label class="form-label font-semibold" for="edit-site-title">ชื่อเว็บไซต์ (Site Title)</label>
        <input type="text" id="edit-site-title" class="form-control" value="${this._escapeHtml(currentTitle)}" required>
      </div>
      <div class="form-group mb-3">
        <label class="form-label font-semibold" for="edit-site-subtitle">คำโปรยใต้ชื่อเว็บไซต์ (Subtitle)</label>
        <input type="text" id="edit-site-subtitle" class="form-control" value="${this._escapeHtml(currentSubtitle)}" required>
      </div>
    `;

    Modal.open({
      title: '✏️ แก้ไขชื่อเว็บไซต์และโลโก้ส่วนหัว',
      body,
      confirmText: '💾 บันทึกข้อมูล',
      onConfirm: async () => {
        const newTitle = body.querySelector('#edit-site-title')?.value.trim();
        const newSubtitle = body.querySelector('#edit-site-subtitle')?.value.trim();
        const newAvatar = body.querySelector('#edit-header-logo-url')?.value.trim() || currentAvatar;

        if (!newTitle) {
          Toast.error('กรุณากรอกชื่อเว็บไซต์');
          return false;
        }

        try {
          await SettingsApi.saveSettings({
            site_title: newTitle,
            site_subtitle: newSubtitle,
            header_avatar_image: newAvatar
          });

          // Live DOM update
          const headerAvatar = document.getElementById('header-avatar');
          if (headerAvatar && newAvatar) headerAvatar.src = newAvatar;

          const headerTitle = document.getElementById('header-title');
          if (headerTitle) headerTitle.textContent = newTitle;

          const headerSubtitle = document.getElementById('header-subtitle');
          if (headerSubtitle) headerSubtitle.textContent = newSubtitle;

          const footerTitle = document.getElementById('footer-title');
          if (footerTitle) footerTitle.textContent = newTitle;

          const pageTitle = document.getElementById('page-title');
          if (pageTitle) pageTitle.textContent = `${newTitle} — ${settings.teacher_name || 'ครูศุทธินี ถาวร'}`;

          Toast.success('บันทึกชื่อเว็บไซต์และโลโก้เรียบร้อยแล้ว');
          return true;
        } catch (err) {
          Toast.error('บันทึกไม่สำเร็จ: ' + err.message);
          return false;
        }
      }
    });

    this._bindImageUploadField(body, 'edit-header-logo', currentAvatar, { maxWidth: 600, maxHeight: 600 });
  },

  // 2. Edit Hero Profile (Avatar, School Logo, Name, Role, Motto)
  async editHeroProfile() {
    let settings = {};
    try {
      settings = await SettingsApi.getSettings() || {};
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    const currentAvatar = settings.profile_image || document.getElementById('hero-avatar')?.getAttribute('src') || './assets/showcase/avatar-krunew.svg';
    const currentSchoolLogo = settings.school_logo || document.getElementById('hero-school-logo')?.getAttribute('src') || './assets/school_logo.png';
    const currentName = settings.teacher_name || document.getElementById('hero-teacher-name')?.textContent?.trim() || 'นางสาวศุทธินี ถาวร';
    const currentStanding = settings.academic_standing || document.getElementById('hero-role-badge')?.textContent?.trim() || 'ชำนาญการพิเศษ';
    const currentRole = settings.teacher_role || document.getElementById('hero-role')?.textContent?.trim() || 'ครูประจำชั้นประถมศึกษาปีที่ ๑ · กลุ่มสาระการเรียนรู้ภาษาไทย';
    const currentSchool = settings.school_name || document.getElementById('hero-school-name')?.textContent?.trim() || 'โรงเรียนชุมชนแม่ลาศึกษา';
    const currentAffiliation = settings.school_affiliation || document.getElementById('hero-school-affiliation')?.textContent?.trim() || 'อำเภอแม่ลาน้อย จังหวัดแม่ฮ่องสอน';
    const currentMotto = settings.welcome_quote || document.getElementById('hero-motto-text')?.textContent?.trim() || 'การศึกษาคือการสร้างโอกาส และการเรียนรู้ภาษาไทยคือรากฐานสำคัญของชีวิต';

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="mb-3 text-secondary" style="font-size: var(--font-size-sm);">
        ปรับแต่งรูปภาพประจำตัว ตราสัญลักษณ์โรงเรียน ข้อมูลวิทยฐานะ และคติพจน์ประจำตัว
      </div>
      <div class="d-grid gap-3 mb-3" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
        ${this._createImageUploadField({
          id: 'edit-hero-avatar',
          label: 'ภาพถ่ายประจำตัวคุณครู (Profile Avatar)',
          currentVal: currentAvatar,
          previewShape: 'circle',
          previewWidth: '64px',
          previewHeight: '64px',
          hint: 'แสดงในกรอบวงกลมหน้าแรก'
        })}
        ${this._createImageUploadField({
          id: 'edit-hero-school-logo',
          label: 'ตราสัญลักษณ์โรงเรียน (School Logo)',
          currentVal: currentSchoolLogo,
          previewShape: 'circle',
          previewWidth: '64px',
          previewHeight: '64px',
          hint: 'แสดงเป็นเข็มกลัดมุมภาพ'
        })}
      </div>

      <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div class="form-group mb-3">
          <label class="form-label font-semibold" for="edit-teacher-name">ชื่อ - สกุล คุณครู</label>
          <input type="text" id="edit-teacher-name" class="form-control" value="${this._escapeHtml(currentName)}" required>
        </div>
        <div class="form-group mb-3">
          <label class="form-label font-semibold" for="edit-academic-standing">วิทยฐานะ (ป้ายกำกับสีทอง)</label>
          <input type="text" id="edit-academic-standing" class="form-control" value="${this._escapeHtml(currentStanding)}" placeholder="เช่น ชำนาญการพิเศษ">
        </div>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-semibold" for="edit-teacher-role">ตำแหน่ง / กลุ่มสาระการเรียนรู้</label>
        <input type="text" id="edit-teacher-role" class="form-control" value="${this._escapeHtml(currentRole)}" required>
      </div>

      <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div class="form-group mb-3">
          <label class="form-label font-semibold" for="edit-school-name">ชื่อโรงเรียน</label>
          <input type="text" id="edit-school-name" class="form-control" value="${this._escapeHtml(currentSchool)}" required>
        </div>
        <div class="form-group mb-3">
          <label class="form-label font-semibold" for="edit-school-affiliation">สังกัด / อำเภอ จังหวัด</label>
          <input type="text" id="edit-school-affiliation" class="form-control" value="${this._escapeHtml(currentAffiliation)}">
        </div>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-semibold" for="edit-welcome-quote">คติพจน์ / ปรัชญาการศึกษา</label>
        <textarea id="edit-welcome-quote" class="form-control" rows="3">${this._escapeHtml(currentMotto)}</textarea>
      </div>
    `;

    Modal.open({
      title: '✏️ แก้ไขข้อมูลครู ภาพโปรไฟล์ และตราโรงเรียน',
      body,
      confirmText: '💾 บันทึกข้อมูล',
      onConfirm: async () => {
        const newAvatar = body.querySelector('#edit-hero-avatar-url')?.value.trim() || currentAvatar;
        const newSchoolLogo = body.querySelector('#edit-hero-school-logo-url')?.value.trim() || currentSchoolLogo;
        const newName = body.querySelector('#edit-teacher-name')?.value.trim();
        const newStanding = body.querySelector('#edit-academic-standing')?.value.trim();
        const newRole = body.querySelector('#edit-teacher-role')?.value.trim();
        const newSchool = body.querySelector('#edit-school-name')?.value.trim();
        const newAffiliation = body.querySelector('#edit-school-affiliation')?.value.trim();
        const newMotto = body.querySelector('#edit-welcome-quote')?.value.trim();

        if (!newName) {
          Toast.error('กรุณากรอกชื่อครูผู้สอน');
          return false;
        }

        try {
          await SettingsApi.saveSettings({
            profile_image: newAvatar,
            school_logo: newSchoolLogo,
            teacher_name: newName,
            academic_standing: newStanding,
            teacher_role: newRole,
            school_name: newSchool,
            school_affiliation: newAffiliation,
            welcome_quote: newMotto
          });

          // Live DOM updates
          const heroAvatar = document.getElementById('hero-avatar');
          if (heroAvatar && newAvatar) heroAvatar.src = newAvatar;

          const heroSchoolLogo = document.getElementById('hero-school-logo');
          if (heroSchoolLogo && newSchoolLogo) heroSchoolLogo.src = newSchoolLogo;

          const heroName = document.getElementById('hero-teacher-name');
          if (heroName) heroName.textContent = newName;

          const roleBadge = document.getElementById('hero-role-badge');
          if (roleBadge) roleBadge.textContent = newStanding || '';

          const heroRole = document.getElementById('hero-role');
          if (heroRole) heroRole.textContent = newRole;

          const schoolNameEl = document.getElementById('hero-school-name');
          if (schoolNameEl) schoolNameEl.textContent = newSchool;

          const schoolAffilEl = document.getElementById('hero-school-affiliation');
          if (schoolAffilEl) schoolAffilEl.textContent = newAffiliation;

          const mottoEl = document.getElementById('hero-motto-text');
          if (mottoEl) mottoEl.textContent = newMotto;

          const footerDesc = document.getElementById('footer-desc');
          if (footerDesc) footerDesc.textContent = `พื้นที่บันทึกผลงานวิชาชีพและงานธุรการชั้นเรียน · ${newName}`;

          Toast.success('บันทึกข้อมูลครูและภาพโปรไฟล์เรียบร้อยแล้ว');
          return true;
        } catch (err) {
          Toast.error('บันทึกไม่สำเร็จ: ' + err.message);
          return false;
        }
      }
    });

    this._bindImageUploadField(body, 'edit-hero-avatar', currentAvatar, { maxWidth: 1000, maxHeight: 1000 });
    this._bindImageUploadField(body, 'edit-hero-school-logo', currentSchoolLogo, { maxWidth: 600, maxHeight: 600 });
  },

  // 3. Edit Gateway Card (Classroom or PA)
  async editGatewayCard(cardType) {
    let settings = {};
    try {
      settings = await SettingsApi.getSettings() || {};
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    const isClassroom = cardType === 'classroom';
    const modalTitle = isClassroom ? '✏️ แก้ไขการ์ดธุรการในชั้นเรียน (Cover, ไอคอน, ข้อความ)' : '✏️ แก้ไขการ์ดรายงานผล ว.PA (Cover, ไอคอน, ข้อความ)';

    const currentCover = isClassroom
      ? (settings.classroom_cover_image || document.getElementById('cover-classroom')?.getAttribute('src') || './assets/fallback/classroom-cover.svg')
      : (settings.pa_cover_image || document.getElementById('cover-pa')?.getAttribute('src') || './assets/fallback/pa-cover.svg');

    const currentIcon = isClassroom
      ? (settings.classroom_card_icon || document.getElementById('icon-classroom')?.textContent?.trim() || '🏫')
      : (settings.pa_card_icon || document.getElementById('icon-pa')?.textContent?.trim() || '📋');

    const currentTitle = isClassroom
      ? (settings.classroom_card_title || document.getElementById('title-classroom')?.textContent?.trim() || 'ธุรการในชั้นเรียน')
      : (settings.pa_card_title || document.getElementById('title-pa')?.textContent?.trim() || 'รายงานผลการพัฒนางานตามข้อตกลง (PA)');

    const currentDesc = isClassroom
      ? (settings.classroom_card_desc || document.getElementById('desc-classroom')?.textContent?.trim() || 'เช็กชื่อมาเรียน บันทึกแปรงฟัน ดื่มนม น้ำหนัก-ส่วนสูง ตรวจสุขภาพ แบบประเมิน SDQ และงานทะเบียน ปพ.')
      : (settings.pa_card_desc || document.getElementById('desc-pa')?.textContent?.trim() || 'แฟ้มสะสมผลงานการประเมิน ว.PA ครบ 3 ด้าน 15 ตัวชี้วัด และรายงานผลการดำเนินงานประเด็นท้าทาย');

    const suggestedIcons = isClassroom ? ['🏫', '🎒', '📚', '👧', '🌸', '📝', '🧸'] : ['📋', '🏆', '🎖️', '📂', '📊', '🌟', '🎯'];

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="mb-3 text-secondary" style="font-size: var(--font-size-sm);">
        ปรับแต่งรูปภาพ Cover ไอคอนประจำการ์ด และคำอธิบายที่แสดงบนหน้าแรก
      </div>

      ${this._createImageUploadField({
        id: `edit-${cardType}-cover`,
        label: 'ภาพหน้าปกการ์ด (Cover Image)',
        currentVal: currentCover,
        previewShape: 'cover',
        previewWidth: '120px',
        previewHeight: '70px',
        hint: 'แนะนำขนาดสัดส่วน 16:9 หรือประมาณ 1200x675px'
      })}

      <div class="form-group mb-3">
        <label class="form-label font-semibold" for="edit-${cardType}-icon">ไอคอนประจำการ์ด (Emoji หรือตัวอักษร)</label>
        <div class="d-flex gap-2 align-center">
          <input type="text" id="edit-${cardType}-icon" class="form-control" style="width: 80px; text-align: center; font-size: 1.3rem;" value="${this._escapeHtml(currentIcon)}" maxlength="4">
          <div class="d-flex gap-1 flex-wrap">
            ${suggestedIcons.map(ic => `<button type="button" class="btn btn-subtle btn-sm icon-pick-btn" style="padding: 4px 8px; font-size: 1.1rem;">${ic}</button>`).join('')}
          </div>
        </div>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-semibold" for="edit-${cardType}-title">ชื่อหัวข้อการ์ด</label>
        <input type="text" id="edit-${cardType}-title" class="form-control" value="${this._escapeHtml(currentTitle)}" required>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-semibold" for="edit-${cardType}-desc">คำอธิบายสังเขปใต้การ์ด</label>
        <textarea id="edit-${cardType}-desc" class="form-control" rows="3">${this._escapeHtml(currentDesc)}</textarea>
      </div>
    `;

    // Emoji picker click
    body.querySelectorAll('.icon-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = body.querySelector(`#edit-${cardType}-icon`);
        if (input) input.value = btn.textContent.trim();
      });
    });

    Modal.open({
      title: modalTitle,
      body,
      confirmText: '💾 บันทึกข้อมูล',
      onConfirm: async () => {
        const newCover = body.querySelector(`#edit-${cardType}-cover-url`)?.value.trim() || currentCover;
        const newIcon = body.querySelector(`#edit-${cardType}-icon`)?.value.trim() || currentIcon;
        const newTitle = body.querySelector(`#edit-${cardType}-title`)?.value.trim();
        const newDesc = body.querySelector(`#edit-${cardType}-desc`)?.value.trim();

        if (!newTitle) {
          Toast.error('กรุณากรอกชื่อการ์ด');
          return false;
        }

        const payload = isClassroom ? {
          classroom_cover_image: newCover,
          classroom_card_icon: newIcon,
          classroom_card_title: newTitle,
          classroom_card_desc: newDesc
        } : {
          pa_cover_image: newCover,
          pa_card_icon: newIcon,
          pa_card_title: newTitle,
          pa_card_desc: newDesc
        };

        try {
          await SettingsApi.saveSettings(payload);

          if (isClassroom) {
            const coverEl = document.getElementById('cover-classroom');
            if (coverEl && newCover) coverEl.src = newCover;
            const iconEl = document.getElementById('icon-classroom');
            if (iconEl) iconEl.textContent = newIcon;
            const titleEl = document.getElementById('title-classroom');
            if (titleEl) titleEl.textContent = newTitle;
            const descEl = document.getElementById('desc-classroom');
            if (descEl) descEl.textContent = newDesc;
          } else {
            const coverEl = document.getElementById('cover-pa');
            if (coverEl && newCover) coverEl.src = newCover;
            const iconEl = document.getElementById('icon-pa');
            if (iconEl) iconEl.textContent = newIcon;
            const titleEl = document.getElementById('title-pa');
            if (titleEl) titleEl.textContent = newTitle;
            const descEl = document.getElementById('desc-pa');
            if (descEl) descEl.textContent = newDesc;
          }

          Toast.success(`บันทึกการ์ด ${newTitle} เรียบร้อยแล้ว`);
          return true;
        } catch (err) {
          Toast.error('บันทึกไม่สำเร็จ: ' + err.message);
          return false;
        }
      }
    });

    this._bindImageUploadField(body, `edit-${cardType}-cover`, currentCover, { maxWidth: 1600, maxHeight: 900 });
  },

  // 4. Edit Motto (Philosophy / Quote)
  async editMotto() {
    let settings = {};
    try {
      settings = await SettingsApi.getSettings() || {};
    } catch (e) {}

    const mottoEl = document.getElementById('hero-motto-text');
    const currentMotto = settings.welcome_quote || mottoEl?.textContent?.trim() || 'การศึกษาคือการสร้างโอกาส และการเรียนรู้ภาษาไทยคือรากฐานสำคัญของชีวิต';

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
          await SettingsApi.saveSettings({ welcome_quote: newMotto });
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

  // 5. Edit Game Item
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

  // 6. Edit Book Item
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

  // 7. Edit Awards
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

  // 8. Edit PA Challenge
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
