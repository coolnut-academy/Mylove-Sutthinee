/**
 * Homepage Logic — Google Sites+ 2-Card Gateway
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';
import { RouterUtils } from '../router-utils.js';
import { AppState } from '../app-state.js';
import { SettingsApi, YearsApi, AuthApi, provider } from '../api.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';
import { InlineEditor } from '../admin/inline-editor.js';

class HomePageController {
  constructor() {
    this.currentYear = RouterUtils.resolveYear();
    this.init();
  }

  async init() {
    Loading.start('กำลังโหลดหน้าแรก...');
    this._bindMobileNav();
    this._bindYearChange();
    this._bindAdminButtons();
    InlineEditor.init();

    try {
      // 💡 Single bootstrap call แทน 2 calls แยก (settings + years)
      const bootstrap = await this._loadBootstrap();
      if (bootstrap) {
        this._applySettings(bootstrap.settings);
        this._applyYears(bootstrap.years);
      }
      this._updateDynamicLinks(this.currentYear);
      this._updateAdminButton();
      Loading.done('พร้อมใช้งาน');
      InlineEditor.init();
    } catch (err) {
      console.error("Failed to initialize home page:", err);
      Loading.fail('โหลดข้อมูลไม่สำเร็จ');
    }
  }

  _bindMobileNav() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const closeBtn = document.getElementById('mobile-drawer-close');

    const openDrawer = () => {
      drawer?.classList.add('open');
      backdrop?.classList.add('open');
    };

    const closeDrawer = () => {
      drawer?.classList.remove('open');
      backdrop?.classList.remove('open');
    };

    toggle?.addEventListener('click', openDrawer);
    closeBtn?.addEventListener('click', closeDrawer);
    backdrop?.addEventListener('click', closeDrawer);
  }

  _bindYearChange() {
    const select = document.getElementById('header-year-select');
    select?.addEventListener('change', (e) => {
      const newYear = e.target.value;
      if (newYear) {
        AppState.setYear(newYear);
        this.currentYear = newYear;
        this._updateDynamicLinks(newYear);
        this._updateYearDisplay(newYear);
      }
    });

    AppState.on('yearChanged', (year) => {
      if (select && select.value !== year) {
        select.value = year;
      }
      this.currentYear = year;
      this._updateDynamicLinks(year);
      this._updateYearDisplay(year);
    });
  }

  _updateYearDisplay(year) {
    const badge = document.getElementById('hero-year-badge');
    if (badge) badge.textContent = `ปีการศึกษา ${year}`;
  }

  _bindAdminButtons() {
    const adminBtn = document.getElementById('btn-header-admin');
    const bottomAdminBtn = document.getElementById('btn-bottom-admin');

    const handleAdminClick = (e) => {
      if (AppState.isAdmin()) {
        // Already authenticated: navigate straight to admin.html
        return;
      }
      e.preventDefault();
      this._openAdminLoginModal();
    };

    adminBtn?.addEventListener('click', handleAdminClick);
    bottomAdminBtn?.addEventListener('click', handleAdminClick);

    AppState.on('authChanged', () => {
      this._updateAdminButton();
      InlineEditor.init();
    });
  }

  _updateAdminButton() {
    const btn = document.getElementById('btn-header-admin');
    const icon = document.getElementById('admin-btn-icon');
    const text = document.getElementById('admin-btn-text');
    const bottomBtn = document.getElementById('btn-bottom-admin');

    if (AppState.isAdmin()) {
      if (btn) {
        btn.className = 'btn btn-primary btn-sm';
        btn.href = './admin.html';
        btn.title = 'ไปที่หน้าจัดการเว็บไซต์';
      }
      if (icon) icon.textContent = '⚙️';
      if (text) text.textContent = 'จัดการเว็บไซต์';
      if (bottomBtn) {
        bottomBtn.textContent = '⚙️ จัดการเว็บไซต์ (เข้าสู่ระบบแล้ว)';
        bottomBtn.href = './admin.html';
      }
    } else {
      if (btn) {
        btn.className = 'btn btn-subtle btn-sm';
        btn.href = './admin.html';
        btn.title = 'เข้าสู่ระบบจัดการเว็บไซต์สำหรับครูผู้สอน';
      }
      if (icon) icon.textContent = '🔒';
      if (text) text.textContent = 'จัดการเว็บไซต์';
      if (bottomBtn) {
        bottomBtn.textContent = '🔒 จัดการเว็บไซต์ (สำหรับครูศุทธินี)';
        bottomBtn.href = './admin.html';
      }
    }
  }

  _openAdminLoginModal() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="text-center mb-4">
        <div style="font-size: 2.5rem; margin-bottom: var(--space-2);">🌸</div>
        <h3 style="color: var(--purple-900); margin-bottom: var(--space-1);">จัดการเว็บไซต์</h3>
        <p class="text-secondary" style="font-size: var(--font-size-sm); margin-bottom: 0;">
          นางสาวศุทธินี ถาวร
        </p>
      </div>
      <div class="form-group">
        <label class="form-label" for="home-admin-password">รหัสผ่าน</label>
        <input type="password" id="home-admin-password" class="form-control" placeholder="กรอกรหัสผ่านเพื่อเข้าสู่ระบบจัดการ" autofocus required>
      </div>
    `;

    Modal.open({
      title: 'เข้าสู่ระบบจัดการเว็บไซต์',
      body,
      confirmText: 'เข้าสู่ระบบ',
      cancelText: 'ยกเลิก',
      onConfirm: async () => {
        const pwdInput = body.querySelector('#home-admin-password');
        const password = pwdInput ? pwdInput.value.trim() : '';

        if (!password) {
          Toast.error('กรุณากรอกรหัสผ่าน');
          return false;
        }

        try {
          const res = await AuthApi.login(password);
          if (res.success && res.session) {
            AppState.setSession(res.session);
            Toast.success('เข้าสู่ระบบสำเร็จ พร้อมแก้ไขข้อมูลเว็บไซต์');
            this._updateAdminButton();
            InlineEditor.init();
            return true;
          }
        } catch (err) {
          Toast.error(err.message || 'รหัสผ่านไม่ถูกต้อง');
          return false;
        }
      }
    });

    setTimeout(() => {
      const input = document.getElementById('home-admin-password');
      input?.focus();
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const confirmBtn = document.querySelector('.modal-confirm-btn');
          confirmBtn?.click();
        }
      });
    }, 100);
  }

  async _loadBootstrap() {
    const { Cache } = await import('../cache.js');
    const key = Cache.buildKey('home_bootstrap');
    return Cache.swr(key, () => provider.getBootstrap({ module: '', year: this.currentYear }), (data) => {
      if (data) {
        this._applySettings(data.settings);
        this._applyYears(data.years);
      }
    });
  }

  _applySettings(settings) {
    if (!settings) return;

    AppState.setSettings(settings);

    // Document title
    if (settings.site_title) {
      const titleEl = document.getElementById('page-title');
      const headerTitle = document.getElementById('header-title');
      const footerTitle = document.getElementById('footer-title');
      if (titleEl) titleEl.textContent = `${settings.site_title} — ${settings.teacher_name || 'ครูศุทธินี ถาวร'}`;
      if (headerTitle) headerTitle.textContent = settings.site_title;
      if (footerTitle) footerTitle.textContent = settings.site_title;
    }
    if (settings.site_subtitle) {
      const headerSubtitle = document.getElementById('header-subtitle');
      if (headerSubtitle) headerSubtitle.textContent = settings.site_subtitle;
    }

    // Header Avatar
    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) {
      if (settings.header_avatar_image) {
        headerAvatar.src = settings.header_avatar_image;
      } else if (settings.profile_image) {
        headerAvatar.src = settings.profile_image;
      }
    }

    // Teacher Identity
    if (settings.teacher_name) {
      const heroName = document.getElementById('hero-teacher-name');
      const footerDesc = document.getElementById('footer-desc');
      if (heroName) heroName.textContent = settings.teacher_name;
      if (footerDesc) footerDesc.textContent = `พื้นที่บันทึกผลงานวิชาชีพและงานธุรการชั้นเรียน · ${settings.teacher_name}`;
    }
    if (settings.academic_standing) {
      const roleBadge = document.getElementById('hero-role-badge');
      if (roleBadge) roleBadge.textContent = settings.academic_standing;
    }
    if (settings.teacher_role) {
      const heroRole = document.getElementById('hero-role');
      if (heroRole) heroRole.textContent = settings.teacher_role;
    }
    if (settings.school_name) {
      const schoolNameEl = document.getElementById('hero-school-name');
      if (schoolNameEl) schoolNameEl.textContent = settings.school_name;
    }
    if (settings.school_affiliation) {
      const schoolAffiliationEl = document.getElementById('hero-school-affiliation');
      if (schoolAffiliationEl) schoolAffiliationEl.textContent = settings.school_affiliation;
    }
    if (settings.welcome_quote) {
      const mottoText = document.getElementById('hero-motto-text');
      if (mottoText) mottoText.textContent = settings.welcome_quote;
    }

    // Profile & School Avatars
    if (settings.profile_image) {
      const heroAvatar = document.getElementById('hero-avatar');
      if (heroAvatar) heroAvatar.src = settings.profile_image;
    }
    if (settings.school_logo) {
      const schoolLogoEl = document.getElementById('hero-school-logo');
      if (schoolLogoEl) schoolLogoEl.src = settings.school_logo;
    }

    // Gateway Card 1: Classroom
    if (settings.classroom_cover_image) {
      const coverClassroom = document.getElementById('cover-classroom');
      if (coverClassroom) coverClassroom.src = settings.classroom_cover_image;
    }
    if (settings.classroom_card_icon) {
      const iconClassroom = document.getElementById('icon-classroom');
      if (iconClassroom) iconClassroom.textContent = settings.classroom_card_icon;
    }
    if (settings.classroom_card_title) {
      const titleClassroom = document.getElementById('title-classroom');
      if (titleClassroom) titleClassroom.textContent = settings.classroom_card_title;
    }
    if (settings.classroom_card_desc) {
      const descClassroom = document.getElementById('desc-classroom');
      if (descClassroom) descClassroom.textContent = settings.classroom_card_desc;
    }

    // Gateway Card 2: PA
    if (settings.pa_cover_image) {
      const coverPa = document.getElementById('cover-pa');
      if (coverPa) coverPa.src = settings.pa_cover_image;
    }
    if (settings.pa_card_icon) {
      const iconPa = document.getElementById('icon-pa');
      if (iconPa) iconPa.textContent = settings.pa_card_icon;
    }
    if (settings.pa_card_title) {
      const titlePa = document.getElementById('title-pa');
      if (titlePa) titlePa.textContent = settings.pa_card_title;
    }
    if (settings.pa_card_desc) {
      const descPa = document.getElementById('desc-pa');
      if (descPa) descPa.textContent = settings.pa_card_desc;
    }

    if (settings.home_bg_image) {
      const bgEl = document.getElementById('hero-custom-bg');
      if (bgEl) {
        bgEl.style.backgroundImage = `url(${settings.home_bg_image})`;
        bgEl.style.display = 'block';
      }
    }
  }

  _applyYears(years) {
    const select = document.getElementById('header-year-select');
    if (!select || !years || !years.length) return;

    // หาก URL ไม่ได้ระบุปีมา ให้แสดงผลปี พ.ศ. ล่าสุดเสมอ
    const urlYear = RouterUtils.getParam('year');
    if (!urlYear) {
      const latestYear = RouterUtils.findLatestYear(years);
      if (this.currentYear !== latestYear) {
        this.currentYear = latestYear;
        AppState.setYear(latestYear);
      }
    }

    select.innerHTML = '';
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y.year;
      opt.textContent = `${y.year}${y.status === 'archived' ? ' (คลังประวัติ)' : ''}`;
      if (String(y.year) === String(this.currentYear)) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    this._updateDynamicLinks(this.currentYear);
    this._updateYearDisplay(this.currentYear);
  }

  _updateDynamicLinks(year) {
    const navCls = document.getElementById('nav-classroom');
    const navPa = document.getElementById('nav-pa');
    const mobCls = document.getElementById('mob-nav-classroom');
    const mobPa = document.getElementById('mob-nav-pa');
    const cardCls = document.getElementById('card-gateway-classroom');
    const cardPa = document.getElementById('card-gateway-pa');

    const clsUrl = `./classroom.html?year=${encodeURIComponent(year)}`;
    const paUrl = `./pa.html?year=${encodeURIComponent(year)}`;

    if (navCls) navCls.href = clsUrl;
    if (mobCls) mobCls.href = clsUrl;
    if (cardCls) cardCls.href = clsUrl;

    if (navPa) navPa.href = paUrl;
    if (mobPa) mobPa.href = paUrl;
    if (cardPa) cardPa.href = paUrl;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HomePageController();
});
