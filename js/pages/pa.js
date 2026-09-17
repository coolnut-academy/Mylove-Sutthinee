/**
 * PA Page Controller — Google Sites+ Digital Binder & Sequential Reader
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';
import { RouterUtils } from '../router-utils.js';
import { AppState } from '../app-state.js';
import { SettingsApi, YearsApi, PaApi, AuthApi, provider } from '../api.js';
import { Utils } from '../utils.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';
import { InlineEditor } from '../admin/inline-editor.js';
import { UniversalItemModal } from '../components/universal-item-modal.js';
import { renderUniversalCard } from '../components/universal-card-renderer.js';
import { DataProvider } from '../data-provider.js';
import { INITIAL_PA_SECTIONS } from '../mock/pa.js';

const SECTION_SEQUENCE = [
  'profile',
  'agreement',
  'workload',
  '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8',
  '2.1', '2.2', '2.3', '2.4',
  '3.1', '3.2', '3.3',
  'CHALLENGE',
  'challenge_method',
  'challenge_innovation',
  'challenge_evidence',
  'challenge_results'
];

class PaPageController {
  constructor() {
    this.currentYear = RouterUtils.resolveYear();
    this.currentSec = null; // null = TOC view
    this.paSections = [];
    this.paItems = [];
    this.init();
  }

  async init() {
    Loading.start('กำลังโหลดข้อมูลรายงาน ว.PA...');
    this._bindMobileNav();
    this._bindYearChange();
    this._bindAdminButton();
    this._bindReaderNavButtons();
    this._parseUrlSec();
    this._renderCurrentView();
    InlineEditor.init();

    AppState.on('authChanged', () => {
      this._updateAdminButton();
      this._renderCurrentView();
      InlineEditor.init();
    });

    try {
      // 💡 Single bootstrap call แทน 3 calls แยก (settings + years + paData)
      const bootstrap = await this._loadBootstrap();
      if (bootstrap) {
        this._applySettings(bootstrap.settings);
        this._applyYears(bootstrap.years);
        if (bootstrap.paData) {
          this.paSections = bootstrap.paData.sections || [];
          this.paItems = bootstrap.paData.items || [];
          this._renderCurrentView();
        }
      }
      this._updateAdminButton();
      Loading.done('โหลดข้อมูล ว.PA เรียบร้อย');
      InlineEditor.init();
    } catch (err) {
      console.error("Failed to load PA module:", err);
      try {
        const { Cache } = await import('../cache.js');
        const stale = Cache.get(Cache.buildKey('pa_bootstrap_' + this.currentYear), true);
        if (stale) {
          this._applySettings(stale.settings);
          this._applyYears(stale.years);
          if (stale.paData) {
            this.paSections = stale.paData.sections || [];
            this.paItems = stale.paData.items || [];
            this._renderCurrentView();
          }
          this._updateAdminButton();
          InlineEditor.init();
          Loading.done('พร้อมใช้งาน (แคช)');
          Toast.info('แสดงข้อมูลที่บันทึกไว้ล่าสุด');
          return;
        }
      } catch (cacheErr) {}
      Loading.fail('โหลดข้อมูลไม่สำเร็จ');
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
    const loadBtn = document.getElementById('btn-load-year');

    const triggerLoad = async (yearToLoad) => {
      const targetYear = yearToLoad || select?.value || this.currentYear;
      if (!targetYear) return;

      loadBtn?.classList.remove('highlight');
      loadBtn?.classList.add('loading');

      AppState.setYear(targetYear);
      this.currentYear = targetYear;
      this._updateYearDisplay(targetYear);

      // Update URL without full reload
      const url = new URL(window.location.href);
      url.searchParams.set('year', targetYear);
      window.history.pushState({}, '', url.toString());

      Loading.start(`กำลังโหลดข้อมูล ว.PA ปี ${targetYear}...`);
      try {
        await this._loadPaData(targetYear);
        Loading.done(`โหลดข้อมูล ว.PA ปี ${targetYear} สำเร็จ`);
        Toast.success(`โหลดข้อมูล ว.PA ปีการศึกษา ${targetYear} เรียบร้อย`);
      } catch (err) {
        console.error("Failed to load PA year data:", err);
        Loading.fail('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        loadBtn?.classList.remove('loading');
      }
    };

    loadBtn?.addEventListener('click', () => triggerLoad());

    select?.addEventListener('change', (e) => {
      const newYear = e.target.value;
      if (newYear && String(newYear) !== String(this.currentYear)) {
        loadBtn?.classList.add('highlight');
      } else {
        loadBtn?.classList.remove('highlight');
      }
    });

    select?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerLoad();
      }
    });

    AppState.on('yearChanged', (year) => {
      if (select && select.value !== year) select.value = year;
      this.currentYear = year;
      this._updateYearDisplay(year);
    });
  }

  _updateYearDisplay(year) {
    const pill = document.getElementById('pa-year-pill');
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
        <label class="form-label" for="pa-admin-password">รหัสผ่าน</label>
        <input type="password" id="pa-admin-password" class="form-control" placeholder="กรอกรหัสผ่าน" autofocus required>
      </div>
    `;

    Modal.open({
      title: 'เข้าสู่ระบบจัดการเว็บไซต์',
      body,
      confirmText: 'เข้าสู่ระบบ',
      cancelText: 'ยกเลิก',
      onConfirm: async () => {
        const pwdInput = body.querySelector('#pa-admin-password');
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
      const input = document.getElementById('pa-admin-password');
      input?.focus();
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const confirmBtn = document.querySelector('.modal-confirm-btn');
          confirmBtn?.click();
        }
      });
    }, 100);
  }

  _bindReaderNavButtons() {
    const bindNav = (prevId, nextId, tocId) => {
      document.getElementById(prevId)?.addEventListener('click', () => this._navigateStep(-1));
      document.getElementById(nextId)?.addEventListener('click', () => this._navigateStep(1));
      document.getElementById(tocId)?.addEventListener('click', (e) => {
        e.preventDefault();
        this._navigateToSec(null);
      });
    };

    bindNav('btn-reader-prev', 'btn-reader-next', 'btn-reader-toc');
    bindNav('btn-reader-prev-bottom', 'btn-reader-next-bottom', 'btn-reader-toc-bottom');

    // Breadcrumb return to TOC
    document.getElementById('bc-pa-root')?.addEventListener('click', (e) => {
      if (this.currentSec) {
        e.preventDefault();
        this._navigateToSec(null);
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      this.currentSec = p.get('sec');
      this._renderCurrentView();
    });

    // Intercept TOC clicks
    document.querySelectorAll('[data-sec]').forEach(el => {
      el.addEventListener('click', (e) => {
        const sec = el.getAttribute('data-sec');
        if (sec) {
          e.preventDefault();
          this._navigateToSec(sec);
        }
      });
    });
  }

  _parseUrlSec() {
    const params = new URLSearchParams(window.location.search);
    const secParam = params.get('sec');
    const hash = (window.location.hash || '').replace('#', '');

    if (secParam) {
      this.currentSec = secParam;
    } else if (hash) {
      if (hash.includes('1.') || hash.includes('2.') || hash.includes('3.') || hash.toUpperCase().includes('CHALLENGE')) {
        this.currentSec = hash.replace('indicator-', '');
      } else {
        this.currentSec = null;
      }
    } else {
      this.currentSec = null;
    }
  }

  _navigateToSec(sec) {
    this.currentSec = sec;
    const url = new URL(window.location.href);
    if (sec) {
      url.searchParams.set('sec', sec);
      url.hash = '';
    } else {
      url.searchParams.delete('sec');
      url.hash = '';
    }
    window.history.pushState({}, '', url.toString());
    this._renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  _navigateStep(delta) {
    if (!this.currentSec) return;
    const idx = SECTION_SEQUENCE.indexOf(this.currentSec);
    if (idx === -1) {
      this._navigateToSec(null);
      return;
    }
    const nextIdx = idx + delta;
    if (nextIdx >= 0 && nextIdx < SECTION_SEQUENCE.length) {
      this._navigateToSec(SECTION_SEQUENCE[nextIdx]);
    } else {
      this._navigateToSec(null);
    }
  }

  async _loadBootstrap() {
    const { Cache } = await import('../cache.js');
    const key = Cache.buildKey('pa_bootstrap_' + this.currentYear);
    return Cache.swr(key, () => provider.getBootstrap({ module: 'pa', year: this.currentYear }), (data) => {
      if (data) {
        this._applySettings(data.settings);
        this._applyYears(data.years);
        if (data.paData) {
          this.paSections = data.paData.sections || [];
          this.paItems = data.paData.items || [];
          this._renderCurrentView();
        }
      }
    });
  }

  _applySettings(settings) {
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
      const el = document.getElementById('pa-school-logo');
      if (el) el.src = settings.school_logo;
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
        this._loadPaData(latestYear);
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

    this._updateYearDisplay(this.currentYear);
  }

  _showSavedItem(item) {
    this._dataRevision = (this._dataRevision || 0) + 1;
    if (String(item.year) !== String(this.currentYear)) return;
    this.paItems = [...(this.paItems || []).filter(d => d.id !== item.id), item];
    this._renderCurrentView();
  }

  async _loadPaData(year) {
    const revision = this._dataRevision || 0;
    try {
      const data = await PaApi.getPaData(year);
      if (revision !== (this._dataRevision || 0) || String(year) !== String(this.currentYear)) return;
      this.paSections = data.sections || [];
      this.paItems = data.items || [];
      this._renderCurrentView();
    } catch (err) {
      console.error("Error fetching PA data:", err);
      Toast.error("ไม่สามารถโหลดข้อมูล ว.PA ได้");
    }
  }

  _renderCurrentView() {
    const binderSection = document.getElementById('pa-binder-view');
    const detailSection = document.getElementById('pa-detail-view');
    const bcSep = document.getElementById('bc-sec-sep');
    const bcCurrent = document.getElementById('bc-sec-current');

    if (!this.currentSec) {
      // Show TOC Binder view
      binderSection?.classList.remove('d-none');
      detailSection?.classList.add('d-none');
      bcSep?.classList.add('d-none');
      bcCurrent?.classList.add('d-none');
      document.title = `รายงานผลการพัฒนางานตามข้อตกลง (PA) ปี ${this.currentYear} — Suttinee Teacher Workspace`;
      return;
    }

    // Show Detail Reader view
    binderSection?.classList.add('d-none');
    detailSection?.classList.remove('d-none');
    bcSep?.classList.remove('d-none');
    bcCurrent?.classList.remove('d-none');

    const meta = this._getSectionMeta(this.currentSec);
    if (bcCurrent) bcCurrent.textContent = meta.title;

    const aspectBadge = document.getElementById('detail-aspect-badge');
    const titleEl = document.getElementById('detail-title');
    const descEl = document.getElementById('detail-desc');
    const evidenceCountEl = document.getElementById('detail-evidence-count');
    const evidenceGrid = document.getElementById('detail-evidence-grid');

    if (aspectBadge) aspectBadge.textContent = meta.aspect;
    if (titleEl) titleEl.textContent = meta.title;
    if (descEl) descEl.innerHTML = meta.descriptionHtml;

    document.title = `${meta.title} (ปี ${this.currentYear}) — รายงาน PA`;

    // Filter evidence items for this section and active year
    const items = this.paItems.filter(item => {
      return item.section_code === this.currentSec || 
             (this.currentSec.startsWith('challenge') && item.section_code === 'CHALLENGE');
    });

    if (evidenceCountEl) evidenceCountEl.textContent = `🚀 ${items.length} ผลงาน`;

    // Render Grid with Search & Sort
    this._renderPaItemsGrid(items, meta);

    // Setup Search & Sort Event Listeners
    const searchInput = document.getElementById('pa-showcase-search');
    const sortSelect = document.getElementById('pa-showcase-sort');

    if (searchInput && !searchInput._bound) {
      searchInput._bound = true;
      searchInput.addEventListener('input', (e) => {
        this._paSearchQuery = e.target.value.trim().toLowerCase();
        const currentItems = this.paItems.filter(item => {
          return item.section_code === this.currentSec || 
                 (this.currentSec.startsWith('challenge') && item.section_code === 'CHALLENGE');
        });
        this._renderPaItemsGrid(currentItems, meta);
      });
    }

    if (sortSelect && !sortSelect._bound) {
      sortSelect._bound = true;
      sortSelect.addEventListener('change', (e) => {
        this._paSortKey = e.target.value;
        const currentItems = this.paItems.filter(item => {
          return item.section_code === this.currentSec || 
                 (this.currentSec.startsWith('challenge') && item.section_code === 'CHALLENGE');
        });
        this._renderPaItemsGrid(currentItems, meta);
      });
    }

    // Always display Add Entry button in the indicator header
    const adminActions = document.getElementById('detail-admin-actions');
    if (adminActions) {
      adminActions.innerHTML = `
        <button type="button" class="btn-add-showcase" id="btn-sec-add-universal">
          <span>➕</span> เพิ่มผลงาน / ร่องรอยหลักฐาน
        </button>
      `;
      document.getElementById('btn-sec-add-universal')?.addEventListener('click', () => {
        if (!AppState.isAdmin()) {
          this._openAdminLoginModal(() => {
            UniversalItemModal.open({
              module: 'pa',
              year: this.currentYear,
              sectionCode: this.currentSec,
              sectionTitle: meta.title,
              onSaveSuccess: item => this._showSavedItem(item)
            });
          });
          return;
        }
        UniversalItemModal.open({
          module: 'pa',
          year: this.currentYear,
          sectionCode: this.currentSec,
          sectionTitle: meta.title,
          onSaveSuccess: item => this._showSavedItem(item)
        });
      });
    }


    // Update navigation buttons status (disable if at start or end)
    const idx = SECTION_SEQUENCE.indexOf(this.currentSec);
    const prevBtns = [document.getElementById('btn-reader-prev'), document.getElementById('btn-reader-prev-bottom')];
    const nextBtns = [document.getElementById('btn-reader-next'), document.getElementById('btn-reader-next-bottom')];

    prevBtns.forEach(btn => {
      if (btn) {
        btn.disabled = (idx <= 0);
        btn.style.opacity = (idx <= 0) ? '0.5' : '1';
      }
    });

    nextBtns.forEach(btn => {
      if (btn) {
        btn.disabled = (idx >= SECTION_SEQUENCE.length - 1);
        btn.style.opacity = (idx >= SECTION_SEQUENCE.length - 1) ? '0.5' : '1';
      }
    });
  }

  _renderPaItemsGrid(items, meta) {
    const evidenceGrid = document.getElementById('detail-evidence-grid');
    if (!evidenceGrid) return;

    // 1. Filter by search query
    let filtered = [...items];
    const q = this._paSearchQuery || '';
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

    // 2. Sort items
    const sortKey = this._paSortKey || 'order-asc';
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

    evidenceGrid.innerHTML = '';

    if (filtered.length === 0) {
      evidenceGrid.className = '';
      evidenceGrid.innerHTML = `
        <div class="u-empty-state" style="grid-column: 1 / -1;">
          <div class="u-empty-icon">📁</div>
          <h3 class="u-empty-title">${q ? 'ไม่พบผลงานที่ตรงกับการค้นหา' : 'ยังไม่มีเอกสารหรือหลักฐานในหัวข้อนี้'}</h3>
          <p class="u-empty-desc">
            ${q ? 'กรุณาลองเปลี่ยนคำค้นหาใหม่อีกครั้ง' : 'สามารถบันทึกข้อมูลจัดแสดงได้ 3 รูปแบบ: รูปภาพ+ข้อความ+Link/เว็บแอป, เอกสาร eBook ออนไลน์ (PDF), หรือสเปรดชีต Excel (Google Sheets)'}
          </p>
          ${!q ? `
          <button type="button" class="btn btn-primary btn-empty-add-pa">
            ➕ เพิ่มข้อมูลชิ้นแรก
          </button>` : ''}
        </div>
      `;
      evidenceGrid.querySelector('.btn-empty-add-pa')?.addEventListener('click', () => {
        if (!AppState.isAdmin()) {
          this._openAdminLoginModal(() => {
            UniversalItemModal.open({
              module: 'pa',
              year: this.currentYear,
              sectionCode: this.currentSec,
              sectionTitle: meta.title,
              onSaveSuccess: item => this._showSavedItem(item)
            });
          });
          return;
        }
        UniversalItemModal.open({
          module: 'pa',
          year: this.currentYear,
          sectionCode: this.currentSec,
          sectionTitle: meta.title,
          onSaveSuccess: item => this._showSavedItem(item)
        });
      });
    } else {
      evidenceGrid.className = 'universal-showcase-grid';
      filtered.forEach((item, idx) => {
        evidenceGrid.appendChild(renderUniversalCard(item, {
          index: idx,
          onDelete: async (id) => {
            await DataProvider.pa.deleteItem(id);
            Toast.success('ลบรายการเรียบร้อย');
            this._loadPaData(this.currentYear);
          }
        }));
      });
    }
  }

  _getSectionMeta(code) {
    // Check if section exists in loaded paSections or fallback to INITIAL_PA_SECTIONS
    const existing = (this.paSections && this.paSections.find(s => s.section_code === code)) ||
                     INITIAL_PA_SECTIONS.find(s => s.section_code === code);
    if (existing) {
      return {
        aspect: existing.parent_code || 'ส่วนที่ 1 ข้อตกลงตามมาตรฐานตำแหน่ง',
        title: existing.title,
        descriptionHtml: `<p>${Utils.escapeHtml(existing.description || 'ไม่มีรายละเอียดเพิ่มเติม')}</p>`
      };
    }

    // Predefined descriptions for introductory and challenge sub-pages
    const customPages = {
      'profile': {
        aspect: 'ข้อมูลทั่วไป',
        title: 'ข้อมูลผู้รับการประเมิน',
        descriptionHtml: `
          <div style="line-height: 1.8;">
            <p><strong>ชื่อ-นามสกุล:</strong> นางสาวศุทธินี ถาวร (ครูนิว)</p>
            <p><strong>ตำแหน่ง:</strong> ครู วิทยฐานะ ชำนาญการพิเศษ</p>
            <p><strong>กลุ่มสาระการเรียนรู้:</strong> กลุ่มสาระการเรียนรู้ภาษาไทย</p>
            <p><strong>สถานศึกษา:</strong> โรงเรียนชุมชนแม่ลาศึกษา อำเภอแม่ลาน้อย จังหวัดแม่ฮ่องสอน</p>
            <p><strong>สังกัด:</strong> สำนักงานเขตพื้นที่การศึกษาประถมศึกษาแม่ฮ่องสอน เขต ๒</p>
            <p><strong>การศึกษา:</strong> ปริญญาตรี ครุศาสตรบัณฑิต (ค.บ.) สาขาวิชาการสอนภาษาไทย มหาวิทยาลัยราชภัฏเชียงราย</p>
            <p><strong>ประวัติการรับราชการ:</strong> ปฏิบัติหน้าที่ครูประจำชั้นประถมศึกษาปีที่ ๑ มุ่งมั่นพัฒนาการอ่านออกเขียนได้ของผู้เรียนอย่างต่อเนื่อง</p>
          </div>
        `
      },
      'agreement': {
        aspect: 'ข้อมูลทั่วไป',
        title: 'ข้อตกลงในการพัฒนางานตามข้อตกลง (PA)',
        descriptionHtml: `
          <div style="line-height: 1.8;">
            <p>ข้อตกลงในการพัฒนางาน (PA) ระหว่าง <strong>นางสาวศุทธินี ถาวร</strong> ตำแหน่งครู วิทยฐานะชำนาญการพิเศษ และ <strong>ผู้อำนวยการโรงเรียนชุมชนแม่ลาศึกษา</strong></p>
            <p>รอบการประเมิน: ระหว่างวันที่ ๑ ตุลาคม ถึง ๓๐ กันยายน ประจำปีการศึกษา ${this.currentYear}</p>
            <p>มุ่งเน้นการยกระดับผลสัมฤทธิ์ทางการเรียนวิชาภาษาไทยของนักเรียนชั้นประถมศึกษาปีที่ ๑ โดยจัดการเรียนรู้เชิงรุก (Active Learning) และสื่อนวัตกรรมเกมการศึกษา</p>
          </div>
        `
      },
      'workload': {
        aspect: 'ส่วนที่ 1 ข้อตกลงตามมาตรฐานตำแหน่ง',
        title: 'ภาระงานที่เป็นไปตามที่ ก.ค.ศ. กำหนด',
        descriptionHtml: `
          <div style="line-height: 1.8;">
            <p><strong>ภาระงานสอนตามตารางสอน:</strong> จำนวน ๒๐ ชั่วโมง/สัปดาห์</p>
            <ul>
              <li>กลุ่มสาระการเรียนรู้ภาษาไทย ชั้น ป.๑ (๕ ชั่วโมง/สัปดาห์)</li>
              <li>กลุ่มสาระการเรียนรู้คณิตศาสตร์ ชั้น ป.๑ (๔ ชั่วโมง/สัปดาห์)</li>
              <li>กิจกรรมพัฒนาผู้เรียน แนะแนว ชุมนุม ลูกเสือ (๓ ชั่วโมง/สัปดาห์)</li>
              <li>วิชาอื่นๆ ตามโครงสร้างหลักสูตร (๘ ชั่วโมง/สัปดาห์)</li>
            </ul>
            <p><strong>งานสนับสนุนการจัดการเรียนรู้:</strong> การจัดทำแผนการจัดการเรียนรู้ การสร้างสื่อ และการวัดผลประเมินผล (๔ ชั่วโมง/สัปดาห์)</p>
            <p><strong>งานตอบสนองนโยบายและจุดเน้น:</strong> การพัฒนาทักษะภาษาไทยและการอ่านออกเขียนได้ ๑๐๐% (๓ ชั่วโมง/สัปดาห์)</p>
          </div>
        `
      },
      'CHALLENGE': {
        aspect: 'ส่วนที่ 2 ข้อตกลงในการพัฒนางานที่เสนอเป็นประเด็นท้าทาย',
        title: 'ประเด็นท้าทาย: การพัฒนาผลสัมฤทธิ์ทางการเรียนภาษาไทย (STAD)',
        descriptionHtml: `
          <div style="line-height: 1.8;">
            <p><strong>สภาพปัญหาของผู้เรียนและการจัดการเรียนรู้:</strong></p>
            <p>นักเรียนชั้นประถมศึกษาปีที่ ๑ โรงเรียนชุมชนแม่ลาศึกษา ส่วนใหญ่ใช้ภาษาชาติพันธุ์ (ภาษากะเหรี่ยง) ในชีวิตประจำวัน ทำให้มีข้อจำกัดในการออกเสียงพยัญชนะ สระ และการสะกดคำแจกลูกภาษาไทย ส่งผลให้ผลสัมฤทธิ์ด้านการอ่านและการเขียนสะกดคำยังต้องได้รับการพัฒนาอย่างเร่งด่วน</p>
            <p><strong>วิธีดำเนินการเพื่อแก้ไขปัญหา:</strong></p>
            <p>จัดกิจกรรมการเรียนรู้แบบร่วมมือด้วยรูปแบบ STAD (Student Teams-Achievement Divisions) ผสานสื่อนวัตกรรมเกมการศึกษา ๔ ชุด เพื่อกระตุ้นความสนใจและสร้างการมีส่วนร่วมในชั้นเรียน</p>
          </div>
        `
      },
      'challenge_method': {
        aspect: 'ส่วนที่ 2 ประเด็นท้าทาย STAD',
        title: 'วิธีดำเนินการประเด็นท้าทาย',
        descriptionHtml: `
          <div style="line-height: 1.8;">
            <p>๑. ศึกษาหลักสูตรกลุ่มสาระการเรียนรู้ภาษาไทย ชั้น ป.๑ และมาตรฐานตัวชี้วัด</p>
            <p>๒. ออกแบบแผนการจัดการเรียนรู้เชิงรุก (Active Learning) ด้วยรูปแบบ STAD จำนวน ๑๒ แผน</p>
            <p>๓. พัฒนาสื่อนวัตกรรมเกมภาษาไทย ๔ ชุด เพื่อใช้ฝึกทักษะการอ่านสะกดคำในกลุ่มร่วมมือ</p>
            <p>๔. จัดกิจกรรมการเรียนรู้ ประเมินผลก่อนเรียน-หลังเรียน และให้ผลสะท้อนกลับแก่นักเรียน</p>
            <p>๕. สรุปและรายงานผลสัมฤทธิ์ทางการเรียนต่อผู้บริหารและคณะครูในชุมชน PLC</p>
          </div>
        `
      },
      'challenge_innovation': {
        aspect: 'ส่วนที่ 2 ประเด็นท้าทาย STAD',
        title: 'สื่อนวัตกรรมและแหล่งเรียนรู้',
        descriptionHtml: `
          <div style="line-height: 1.8;">
            <p>สื่อนวัตกรรมการจัดการเรียนรู้ เทคโนโลยีดิจิทัล และเกมการศึกษาที่พัฒนาและนำมาใช้ยกระดับผลสัมฤทธิ์ทางการเรียนรู้ของผู้เรียน สามารถเพิ่มและจัดแสดงผลงาน (รูปภาพ+ลิงก์ภายนอก, eBook, หรือ Google Sheets) ได้ผ่านปุ่ม <strong>"เพิ่มข้อมูล"</strong></p>
          </div>
        `
      },
      'challenge_evidence': {
        aspect: 'ส่วนที่ 2 ประเด็นท้าทาย STAD',
        title: 'เอกสารและร่องรอยหลักฐานประเด็นท้าทาย',
        descriptionHtml: `
          <div style="line-height: 1.8;">
            <p>ร่องรอยหลักฐานประกอบด้วย แผนการจัดการเรียนรู้ STAD, ภาพถ่ายบรรยากาศการจัดกิจกรรม Active Learning, ใบงานและชิ้นงานของนักเรียน, แบบบันทึกคะแนนพัฒนาการ และรายงานผลการประเมิน</p>
          </div>
        `
      },
      'challenge_results': {
        aspect: 'ส่วนที่ 2 ประเด็นท้าทาย STAD',
        title: 'ผลลัพธ์การพัฒนาการเรียนรู้ของผู้เรียน',
        descriptionHtml: `
          <div style="line-height: 1.8;">
            <p><strong>๑. ผลลัพธ์เชิงปริมาณ:</strong></p>
            <p>- นักเรียนชั้นประถมศึกษาปีที่ ๑ ร้อยละ ๑๐๐ มีผลสัมฤทธิ์ทางการเรียนภาษาไทย เรื่อง การอ่านและการเขียนสะกดคำ หลังเรียนสูงกว่าก่อนเรียน</p>
            <p>- นักเรียนร้อยละ ๘๕ ขึ้นไป มีผลการทดสอบการอ่านออกเขียนได้ (RT) อยู่ในระดับดีขึ้นไป</p>
            <p><strong>๒. ผลลัพธ์เชิงคุณภาพ:</strong></p>
            <p>- นักเรียนมีเจตคติที่ดีต่อการเรียนภาษาไทย กล้าแสดงออก และมีทักษะการทำงานร่วมกับผู้อื่นในกระบวนการกลุ่มอย่างมีความสุข</p>
          </div>
        `
      }
    };

    return customPages[code] || {
      aspect: 'รายงาน PA',
      title: `ตัวชี้วัด ${code}`,
      descriptionHtml: `<p>รายละเอียดการประเมินตัวชี้วัด ${code}</p>`
    };
  }

  _openEditSectionModal(secCode, meta) {
    const year = this.currentYear;
    const currentDescription = this.paSections.find(s => String(s.section_code) === String(secCode))?.description || '';
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="mb-3">
        <span class="badge badge-purple">ปีการศึกษา ${this.currentYear}</span>
        <span class="badge badge-gold">${Utils.escapeHtml(meta.title)}</span>
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-sec-title">หัวข้อตัวชี้วัด</label>
        <input type="text" id="edit-sec-title" class="form-control" value="${Utils.escapeHtml(meta.title)}" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-sec-desc">คำอธิบายรายละเอียดการปฏิบัติงาน</label>
        <textarea id="edit-sec-desc" class="form-control" rows="5" placeholder="ระบุการปฏิบัติงานและผลลัพธ์...">${Utils.escapeHtml(currentDescription)}</textarea>
      </div>
    `;

    Modal.open({
      title: `แก้ไขเนื้อหา: ${meta.title}`,
      body,
      confirmText: 'บันทึกการแก้ไข',
      onConfirm: async () => {
        const titleInput = body.querySelector('#edit-sec-title');
        const descInput = body.querySelector('#edit-sec-desc');
        const newTitle = titleInput?.value.trim();
        const newDesc = descInput?.value.trim();

        if (!newTitle) {
          Toast.error('กรุณากรอกหัวข้อ');
          return false;
        }

        try {
          await PaApi.updateSection(secCode, {
            year,
            title: newTitle,
            description: newDesc
          });
          Toast.success(`บันทึกตัวชี้วัด "${newTitle}" เรียบร้อยแล้ว`);
          await this._loadPaData(this.currentYear);
          return true;
        } catch (e) {
          Toast.error(e.message || 'บันทึกไม่สำเร็จ');
          return false;
        }
      }
    });
  }

  _openUploadEvidenceModal(secCode, meta) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="mb-3">
        <span class="badge badge-purple">ปีการศึกษา ${this.currentYear}</span>
        <span class="badge badge-gold">ผูกกับ: ${meta.title}</span>
      </div>
      <div class="form-group">
        <label class="form-label" for="upload-ev-title">ชื่อไฟล์ / ชื่อหลักฐาน</label>
        <input type="text" id="upload-ev-title" class="form-control" placeholder="เช่น แผนการสอน, ภาพถ่ายกิจกรรม, แบบประเมิน" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="upload-ev-desc">คำอธิบายสั้น ๆ</label>
        <input type="text" id="upload-ev-desc" class="form-control" placeholder="รายละเอียดหลักฐาน...">
      </div>
      <div class="form-group">
        <label class="form-label">เลือกไฟล์หลักฐาน (PDF หรือ รูปภาพ)</label>
        <input type="file" id="upload-ev-file" class="form-control" accept=".pdf,image/*" required>
        <div class="form-hint">ระบบจะผูกไฟล์นี้เข้ากับ ${meta.title} ปี ${this.currentYear} โดยอัตโนมัติ</div>
      </div>
    `;

    Modal.open({
      title: `อัปโหลดหลักฐาน: ${meta.title}`,
      body,
      confirmText: 'อัปโหลดหลักฐาน',
      onConfirm: async () => {
        const titleInput = body.querySelector('#upload-ev-title');
        const descInput = body.querySelector('#upload-ev-desc');
        const fileInput = body.querySelector('#upload-ev-file');

        const title = titleInput?.value.trim();
        const desc = descInput?.value.trim() || '';
        const file = fileInput?.files?.[0];

        if (!title) {
          Toast.error('กรุณาระบุชื่อหลักฐาน');
          return false;
        }

        Toast.success(`อัปโหลดหลักฐาน "${title}" เข้าสู่ ${secCode} สำเร็จ`);
        return true;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PaPageController();
});
