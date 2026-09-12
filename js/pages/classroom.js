/**
 * Classroom Page Controller — Google Sites+ Menu-First & One Page = One Job
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';
import { RouterUtils } from '../router-utils.js';
import { AppState } from '../app-state.js';
import { SettingsApi, YearsApi, ClassroomApi, AuthApi } from '../api.js';
import { Utils } from '../utils.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';
import { InlineEditor } from '../admin/inline-editor.js';
import { UniversalItemModal } from '../components/universal-item-modal.js';
import { renderUniversalCard } from '../components/universal-card-renderer.js';
import { DataProvider } from '../data-provider.js';

class ClassroomPageController {
  constructor() {
    this.currentYear = RouterUtils.resolveYear();
    this.currentView = null; // null = menu-first view
    this.classroomData = null;
    this.init();
  }

  async init() {
    Loading.start();
    this._bindMobileNav();
    this._bindYearChange();
    this._bindAdminButton();
    this._parseUrlView();
    this._renderCurrentView();
    InlineEditor.init();

    AppState.on('authChanged', () => {
      this._updateAdminButton();
      this._renderCurrentView();
      InlineEditor.init();
    });

    try {
      Loading.set(30, 'กำลังโหลดข้อมูลธุรการในชั้นเรียน...');
      await Promise.all([
        this._loadSettings(),
        this._loadYears(),
        this._loadClassroomData(this.currentYear)
      ]);
      this._updateAdminButton();
      Loading.done('โหลดข้อมูลห้องเรียนเรียบร้อย');
      InlineEditor.init();
    } catch (err) {
      console.error("Failed to load classroom module:", err);
      Loading.done('พร้อมใช้งาน');
    }
  }

  _bindMobileNav() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const closeBtn = document.getElementById('mobile-drawer-close');

    toggle?.addEventListener('click', () => {
      drawer?.classList.add('open');
      backdrop?.classList.add('open');
    });

    closeBtn?.addEventListener('click', () => {
      drawer?.classList.remove('open');
      backdrop?.classList.remove('open');
    });

    backdrop?.addEventListener('click', () => {
      drawer?.classList.remove('open');
      backdrop?.classList.remove('open');
    });
  }

  _bindYearChange() {
    const select = document.getElementById('header-year-select');
    select?.addEventListener('change', (e) => {
      const newYear = e.target.value;
      if (newYear) {
        AppState.setYear(newYear);
        this.currentYear = newYear;
        this._updateYearDisplay(newYear);
        this._loadClassroomData(newYear);
      }
    });

    AppState.on('yearChanged', (year) => {
      if (select && select.value !== year) select.value = year;
      this.currentYear = year;
      this._updateYearDisplay(year);
      this._loadClassroomData(year);
    });
  }

  _updateYearDisplay(year) {
    const pill = document.getElementById('classroom-year-pill');
    if (pill) pill.textContent = `ปีการศึกษา ${year}`;
  }

  _bindAdminButton() {
    const btn = document.getElementById('btn-header-admin');
    btn?.addEventListener('click', (e) => {
      if (AppState.isAdmin()) return;
      e.preventDefault();
      this._openAdminLoginModal();
    });
  }

  _updateAdminButton() {
    const btn = document.getElementById('btn-header-admin');
    const icon = document.getElementById('admin-btn-icon');
    const text = document.getElementById('admin-btn-text');

    if (AppState.isAdmin()) {
      if (btn) {
        btn.className = 'btn btn-primary btn-sm';
        btn.href = './admin.html';
      }
      if (icon) icon.textContent = '⚙️';
      if (text) text.textContent = 'จัดการเว็บไซต์';
    } else {
      if (btn) {
        btn.className = 'btn btn-subtle btn-sm';
        btn.href = './admin.html';
      }
      if (icon) icon.textContent = '🔒';
      if (text) text.textContent = 'จัดการเว็บไซต์';
    }
  }

  _openAdminLoginModal(onSuccess = null) {
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
        <label class="form-label" for="cls-admin-password">รหัสผ่าน</label>
        <input type="password" id="cls-admin-password" class="form-control" placeholder="กรอกรหัสผ่าน" autofocus required>
      </div>
    `;

    Modal.open({
      title: 'เข้าสู่ระบบจัดการเว็บไซต์',
      body,
      confirmText: 'เข้าสู่ระบบ',
      cancelText: 'ยกเลิก',
      onConfirm: async () => {
        const pwdInput = body.querySelector('#cls-admin-password');
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
            this._updateAdminButton();
            this._renderCurrentView();
            InlineEditor.init();
            if (typeof onSuccess === 'function') {
              onSuccess();
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
      const input = document.getElementById('cls-admin-password');
      input?.focus();
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const confirmBtn = document.querySelector('.modal-confirm-btn');
          confirmBtn?.click();
        }
      });
    }, 100);
  }

  _parseUrlView() {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const hash = (window.location.hash || '').replace('#', '');

    if (viewParam) {
      this.currentView = viewParam;
    } else if (hash) {
      // Compatibility with previous hashes
      const mapping = {
        'members': 'students',
        'routines': 'attendance',
        'health': 'health',
        'documents': 'pp'
      };
      this.currentView = mapping[hash] || hash;
    } else {
      this.currentView = null;
    }

    // Handle back button
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      this.currentView = p.get('view');
      this._renderCurrentView();
    });

    const backBtn = document.getElementById('btn-back-to-menu');
    backBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this._navigateToJob(null);
    });

    // Intercept menu card clicks for fast, smooth in-page transitions
    document.querySelectorAll('.cls-menu-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const job = card.getAttribute('data-job');
        if (job) {
          e.preventDefault();
          this._navigateToJob(job);
        }
      });
    });
  }

  _navigateToJob(job) {
    this.currentView = job;
    const url = new URL(window.location.href);
    if (job) {
      url.searchParams.set('view', job);
    } else {
      url.searchParams.delete('view');
    }
    window.history.pushState({}, '', url.toString());
    this._renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async _loadSettings() {
    const settings = await SettingsApi.getSettings();
    if (!settings) return;
    AppState.setSettings(settings);

    if (settings.site_title) {
      const el = document.getElementById('header-title');
      if (el) el.textContent = settings.site_title;
    }
    if (settings.profile_image) {
      const el = document.getElementById('header-avatar');
      if (el) el.src = settings.profile_image;
    }
    if (settings.school_logo) {
      const el = document.getElementById('cls-school-logo');
      if (el) el.src = settings.school_logo;
    }
  }

  async _loadYears() {
    const years = await YearsApi.getYears();
    const select = document.getElementById('header-year-select');
    if (!select || !years) return;

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

    this._updateYearDisplay(this.currentYear);
  }

  _showSavedItem(item) {
    this._dataRevision = (this._dataRevision || 0) + 1;
    if (String(item.year) !== String(this.currentYear)) return;
    this.classroomData ||= { documents: [] };
    this.classroomData.documents = [...(this.classroomData.documents || []).filter(d => d.id !== item.id), item];
    this._renderCurrentView();
  }

  async _loadClassroomData(year) {
    const revision = this._dataRevision || 0;
    this._loadError = null;
    try {
      const data = await ClassroomApi.getClassroomData(year);
      if (revision !== (this._dataRevision || 0) || String(year) !== String(this.currentYear)) return;
      this.classroomData = data;
      this._renderCurrentView();
    } catch (err) {
      console.error("Error fetching classroom data:", err);
      if (revision !== (this._dataRevision || 0) || String(year) !== String(this.currentYear)) return;
      this._loadError = err;
      this._renderCurrentView();
      Toast.error("ไม่สามารถโหลดข้อมูลธุรการในชั้นเรียนได้");
    }
  }

  _renderCurrentView() {
    const menuSection = document.getElementById('classroom-menu-view');
    const jobSection = document.getElementById('classroom-job-view');
    const bcSep = document.getElementById('bc-job-sep');
    const bcCurrent = document.getElementById('bc-job-current');

    if (!this.currentView) {
      // Show menu-first landing
      menuSection?.classList.remove('d-none');
      jobSection?.classList.add('d-none');
      bcSep?.classList.add('d-none');
      bcCurrent?.classList.add('d-none');
      document.title = `ธุรการในชั้นเรียน (ปี ${this.currentYear}) — Suttinee Teacher Workspace`;
      return;
    }

    // Show single job view
    menuSection?.classList.add('d-none');
    jobSection?.classList.remove('d-none');
    bcSep?.classList.remove('d-none');
    bcCurrent?.classList.remove('d-none');

    const jobMeta = this._getJobMeta(this.currentView);
    if (bcCurrent) bcCurrent.textContent = jobMeta.title;

    const titleEl = document.getElementById('job-view-title');
    const subtitleEl = document.getElementById('job-view-subtitle');
    const countEl = document.getElementById('job-view-count');

    if (titleEl) titleEl.innerHTML = `${jobMeta.icon} ${jobMeta.title}`;
    if (subtitleEl) subtitleEl.textContent = `พื้นที่จัดเก็บและนำเสนอข้อมูลสำหรับ ${jobMeta.title} ประจำปีการศึกษา ${this.currentYear} · ${jobMeta.desc}`;

    document.title = `${jobMeta.title} (ปี ${this.currentYear}) — ธุรการในชั้นเรียน`;

    // Render job content
    const container = document.getElementById('job-view-content');
    if (!container) return;

    // Always display Add Entry button in the job view header
    const adminActions = document.getElementById('job-admin-actions');
    if (adminActions) {
      adminActions.innerHTML = `
        <button type="button" class="btn-add-showcase" id="btn-job-admin-add">
          <span>➕</span> เพิ่มผลงาน / ข้อมูล (${jobMeta.title})
        </button>
      `;
      document.getElementById('btn-job-admin-add')?.addEventListener('click', () => {
        if (!AppState.isAdmin()) {
          this._openAdminLoginModal(() => {
            UniversalItemModal.open({
              module: 'classroom',
              year: this.currentYear,
              category: this.currentView,
              sectionTitle: jobMeta.title,
              onSaveSuccess: item => this._showSavedItem(item)
            });
          });
          return;
        }
        UniversalItemModal.open({
          module: 'classroom',
          year: this.currentYear,
          category: this.currentView,
          sectionTitle: jobMeta.title,
          onSaveSuccess: item => this._showSavedItem(item)
        });
      });
    }

    // Setup Search & Sort Event Listeners
    const searchInput = document.getElementById('cls-showcase-search');
    const sortSelect = document.getElementById('cls-showcase-sort');

    if (searchInput && !searchInput._bound) {
      searchInput._bound = true;
      searchInput.addEventListener('input', (e) => {
        this._clsSearchQuery = e.target.value.trim().toLowerCase();
        this._renderJobContent(this.currentView, container);
      });
    }

    if (sortSelect && !sortSelect._bound) {
      sortSelect._bound = true;
      sortSelect.addEventListener('change', (e) => {
        this._clsSortKey = e.target.value;
        this._renderJobContent(this.currentView, container);
      });
    }

    this._renderJobContent(this.currentView, container);
  }

  _getJobMeta(job) {
    const catalog = {
      'students': { title: 'สมาชิกในห้องเรียน', icon: '👥', desc: 'ข้อมูลทะเบียนประวัตินักเรียนชั้น ป.1' },
      'attendance': { title: 'เช็กชื่อมาเรียน', icon: '📅', desc: 'สถิติและการเข้าแถวมาเรียนประจำวัน' },
      'teeth': { title: 'เช็กชื่อแปรงฟัน', icon: '🪥', desc: 'การบันทึกการแปรงฟันหลังอาหารกลางวัน' },
      'milk': { title: 'เช็กชื่อดื่มนม', icon: '🥛', desc: 'การบันทึกการดื่มนมโรงเรียนเพื่อสุขภาพ' },
      'growth': { title: 'น้ำหนัก / ส่วนสูง', icon: '⚖️', desc: 'การเจริญเติบโตทางกายภาพและดัชนีมวลกาย (BMI)' },
      'health': { title: 'บันทึกการตรวจสุขภาพ', icon: '🩺', desc: 'การตรวจสุขภาพร่างกาย เล็บ ผม และช่องปาก' },
      'sdq': { title: 'แบบประเมิน SDQ', icon: '📝', desc: 'การคัดกรองพฤติกรรมผู้เรียนและระบบดูแลช่วยเหลือนักเรียน' },
      'pp': { title: 'บันทึก ปพ.', icon: '📁', desc: 'สมุด ปพ.5 (ผลการเรียน) และ ปพ.6 (รายงานประจำตัว)' },
      'media': { title: 'ทะเบียนสื่อ / แหล่งเรียนรู้', icon: '🎮', desc: 'คลังสื่อการสอน สื่อนวัตกรรม และเกมการศึกษา (รองรับลิงก์ภายนอก)' },
      'plc': { title: 'บันทึก PLC', icon: '💬', desc: 'ชุมชนแห่งการเรียนรู้ทางวิชาชีพและแลกเปลี่ยนประสบการณ์' },
      'research': { title: 'วิจัยในชั้นเรียน', icon: '🔬', desc: 'วิจัยพัฒนาทักษะการอ่านสะกดคำภาษาไทย (STAD)' },
      'plan': { title: 'แผนการสอน', icon: '📖', desc: 'แผนการจัดการเรียนรู้บูรณาการ Active Learning' },
      'awards': { title: 'ผลงานครู / เกียรติบัตร', icon: '🏆', desc: 'เกียรติบัตรการอบรม รางวัลครูดีเด่น และผลงานวิชาชีพ' },
      'sar': { title: 'รายงาน SAR', icon: '📘', desc: 'รายงานประเมินตนเองของสถานศึกษาและครูผู้สอนรายบุคคล' },
      'other': { title: 'เอกสารอื่น ๆ', icon: '📎', desc: 'เอกสารการเลื่อนขั้นเงินเดือน และแบบฟอร์มประจำชั้น' }
    };
    return catalog[job] || { title: 'งานธุรการชั้นเรียน', icon: '🏫', desc: 'รายละเอียดงาน' };
  }

  _renderJobContent(job, container) {
    if (this._loadError && !this.classroomData) {
      container.innerHTML = `<div class="u-empty-state"><p>ยังโหลดข้อมูลจาก Google ไม่สำเร็จ ข้อมูลที่บันทึกไว้ไม่ได้ถูกลบ</p><button class="btn btn-primary" type="button" id="retry-classroom-load">ลองโหลดอีกครั้ง</button></div>`;
      container.querySelector('#retry-classroom-load').addEventListener('click', () => {
        this._loadError = null;
        this._renderCurrentView();
        this._loadClassroomData(this.currentYear);
      });
      return;
    }
    if (!this.classroomData) {
      container.innerHTML = `<div class="text-center py-6 text-muted">กำลังโหลดข้อมูล...</div>`;
      return;
    }

    const { documents = [] } = this.classroomData;
    const jobMeta = this._getJobMeta(job);

    // Filter documents for this specific job
    const jobItems = documents.filter(d => d.category === job || d.job === job);

    const countEl = document.getElementById('job-view-count');
    if (countEl) countEl.textContent = `🚀 ${jobItems.length} ผลงาน`;

    // Apply search filter
    let filtered = [...jobItems];
    const q = this._clsSearchQuery || '';
    if (q) {
      filtered = filtered.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const btnMatch = (item.button_text || '').toLowerCase().includes(q);
        const urlMatch = (item.item_url || item.external_url || '').toLowerCase().includes(q);
        let fieldsMatch = false;
        if (item.fields) {
          const str = typeof item.fields === 'string' ? item.fields : JSON.stringify(item.fields);
          fieldsMatch = str.toLowerCase().includes(q);
        }
        return titleMatch || descMatch || btnMatch || urlMatch || fieldsMatch;
      });
    }

    // Apply sorting
    const sortKey = this._clsSortKey || 'order-asc';
    filtered.sort((a, b) => {
      if (sortKey === 'order-desc') {
        return (Number(b.sort_order) || 0) - (Number(a.sort_order) || 0);
      } else if (sortKey === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '', 'th');
      } else if (sortKey === 'latest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      } else {
        return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
      }
    });

    if (filtered.length === 0) {
      // Clean Empty state with Add Entry CTA
      container.innerHTML = `
        <div class="u-empty-state">
          <div class="u-empty-icon">${jobMeta.icon}</div>
          <h3 class="u-empty-title">${q ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' : `ยังไม่มีข้อมูลในหัวข้อ "${jobMeta.title}"`}</h3>
          <p class="u-empty-desc">
            ${q ? 'กรุณาลองเปลี่ยนคำค้นหาใหม่อีกครั้ง' : 'สามารถบันทึกข้อมูลจัดแสดงได้ 3 รูปแบบ: รูปภาพ+ข้อความ+Link/เว็บแอป, เอกสาร eBook ออนไลน์ (PDF), หรือสเปรดชีต Excel (Google Sheets)'}
          </p>
          ${!q ? `
          <button type="button" class="btn btn-primary btn-empty-add-first">
            ➕ เพิ่มข้อมูลชิ้นแรก
          </button>` : ''}
        </div>
      `;
      container.querySelector('.btn-empty-add-first')?.addEventListener('click', () => {
        if (!AppState.isAdmin()) {
          this._openAdminLoginModal(() => {
            UniversalItemModal.open({
              module: 'classroom',
              year: this.currentYear,
              category: job,
              sectionTitle: jobMeta.title,
              onSaveSuccess: item => this._showSavedItem(item)
            });
          });
          return;
        }
        UniversalItemModal.open({
          module: 'classroom',
          year: this.currentYear,
          category: job,
          sectionTitle: jobMeta.title,
          onSaveSuccess: item => this._showSavedItem(item)
        });
      });
      return;
    }

    // Render items in a responsive showcase grid
    container.innerHTML = `
      <div class="universal-showcase-grid" id="job-items-grid"></div>
    `;

    const grid = container.querySelector('#job-items-grid');
    filtered.forEach((item, idx) => {
      grid.appendChild(renderUniversalCard(item, {
        index: idx,
        onDelete: async (id) => {
          await DataProvider.classroom.deleteDocument(id, this.currentYear);
          Toast.success('ลบรายการเรียบร้อย');
          this._loadClassroomData(this.currentYear);
        }
      }));
    });
  }


}

document.addEventListener('DOMContentLoaded', () => {
  new ClassroomPageController();
});
