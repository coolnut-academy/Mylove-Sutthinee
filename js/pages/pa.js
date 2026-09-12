/**
 * PA Module Controller
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';
import { RouterUtils } from '../router-utils.js';
import { AppState } from '../app-state.js';
import { SettingsApi, YearsApi, PaApi } from '../api.js';
import { Utils } from '../utils.js';
import { InlineEditor } from '../admin/inline-editor.js';

class PaPageController {
  constructor() {
    this.currentYear = RouterUtils.resolveYear();
    this.sections = [];
    this.items = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.init();
  }

  async init() {
    Loading.start();
    this._bindMobileNav();
    this._bindYearChange();
    this._bindFilters();
    this._bindSearch();
    InlineEditor.init();

    AppState.on('authChanged', () => {
      InlineEditor.init();
    });

    try {
      Loading.set(30);
      await this._loadSettings();
      Loading.set(50);
      await this._loadYears();
      Loading.set(70);
      await this._loadPaData(this.currentYear);
      Loading.done();
      InlineEditor.init();
    } catch (err) {
      console.error("Failed to load PA module:", err);
      Loading.fail();
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
        this._loadPaData(newYear);
      }
    });

    AppState.on('yearChanged', (year) => {
      if (select && select.value !== year) select.value = year;
      this.currentYear = year;
      this._loadPaData(year);
    });
  }

  _bindFilters() {
    const btns = document.querySelectorAll('[data-pa-filter]');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        this._setFilter(btn.dataset.paFilter);
      });
    });

    const handleHash = () => {
      let hash = (window.location.hash || '').replace('#', '');
      if (!hash) return;
      let filter = 'all';
      if (hash === 'challenge' || hash === 'section2' || hash === 'stad') filter = 'ส่วนที่ 2';
      else if (hash === 'aspect1' || hash === 'learning') filter = 'ด้านที่ 1';
      else if (hash === 'aspect2' || hash === 'support') filter = 'ด้านที่ 2';
      else if (hash === 'aspect3' || hash === 'development') filter = 'ด้านที่ 3';
      
      if (filter !== 'all') {
        this._setFilter(filter);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
  }

  _setFilter(filter) {
    const btns = document.querySelectorAll('[data-pa-filter]');
    btns.forEach(b => {
      if (b.dataset.paFilter === filter) b.classList.add('active');
      else b.classList.remove('active');
    });
    this.currentFilter = filter;
    this._renderSections();
  }

  _bindSearch() {
    const input = document.getElementById('search-pa');
    input?.addEventListener('input', Utils.debounce((e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this._renderSections();
    }, 200));
  }

  async _loadSettings() {
    const settings = await SettingsApi.getSettings();
    if (!settings) return;
    if (settings.profile_image) {
      const avatar = document.getElementById('header-avatar');
      if (avatar) avatar.src = settings.profile_image;
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
      if (y.year === this.currentYear) opt.selected = true;
      select.appendChild(opt);
    });

    this._updateNavLinks(this.currentYear);
  }

  async _loadPaData(year) {
    Loading.start();
    const yearPill = document.getElementById('pa-year-pill');
    if (yearPill) yearPill.textContent = `ปีการศึกษา ${year}`;

    this._updateNavLinks(year);

    try {
      const [sections, items] = await Promise.all([
        PaApi.getSections(year),
        PaApi.getItems(year)
      ]);

      this.sections = sections || [];
      this.items = items || [];

      const statEvidence = document.getElementById('pa-stat-evidence');
      if (statEvidence) statEvidence.textContent = this.items.length;

      this._renderSections();
      Loading.done();
    } catch (err) {
      console.error("Error loading PA data for year:", year, err);
      Loading.fail();
    }
  }

  _renderSections() {
    const container = document.getElementById('pa-sections-container');
    if (!container) return;

    let filtered = this.sections;

    // Filter by aspect
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(s => s.parent_code === this.currentFilter);
    }

    // Filter by search query
    if (this.searchQuery) {
      filtered = filtered.filter(s => {
        const titleMatch = s.title.toLowerCase().includes(this.searchQuery);
        const descMatch = (s.description || '').toLowerCase().includes(this.searchQuery);
        const codeMatch = s.section_code.toLowerCase().includes(this.searchQuery);
        const hasMatchingItem = this.items.some(i =>
          i.section_code === s.section_code &&
          (i.title.toLowerCase().includes(this.searchQuery) || (i.description || '').toLowerCase().includes(this.searchQuery))
        );
        return titleMatch || descMatch || codeMatch || hasMatchingItem;
      });
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">ไม่พบตัวชี้วัดหรือหลักฐานที่ค้นหา</div>
          <p class="empty-state-text">กรุณาลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(section => {
      const sectionItems = this.items.filter(i => i.section_code === section.section_code);
      const isChallenge = section.section_code === 'CHALLENGE';

      return `
        <div class="indicator-item mb-4 animate-fade-in" id="indicator-${section.section_code}">
          <div class="indicator-summary" data-toggle-code="${section.section_code}">
            <div class="d-flex align-center gap-2" style="flex: 1;">
              <span class="indicator-code">${Utils.escapeHtml(section.section_code)}</span>
              <span class="indicator-title font-semibold">${Utils.escapeHtml(section.title)}</span>
            </div>
            <div class="d-flex align-center gap-3">
              <span class="badge ${sectionItems.length > 0 ? 'badge-purple' : 'badge-muted'}">
                ${sectionItems.length} หลักฐาน
              </span>
              <span class="accordion-arrow" style="font-size: 0.9rem; color: var(--text-muted);">▼</span>
            </div>
          </div>
          <div class="indicator-content" id="content-${section.section_code}">
            <p class="text-secondary" style="font-size: var(--font-size-sm); margin-bottom: var(--space-3);">
              ${Utils.escapeHtml(section.description || '')}
            </p>

            ${this._renderEvidenceGrid(sectionItems)}
          </div>
        </div>
      `;
    }).join('');

    // Bind accordion toggles
    document.querySelectorAll('[data-toggle-code]').forEach(header => {
      header.addEventListener('click', () => {
        const code = header.dataset.toggleCode;
        const content = document.getElementById(`content-${code}`);
        const arrow = header.querySelector('.accordion-arrow');
        if (content) {
          const isHidden = content.style.display === 'none';
          content.style.display = isHidden ? 'flex' : 'none';
          if (arrow) arrow.textContent = isHidden ? '▼' : '▶';
        }
      });
    });
  }

  _renderEvidenceGrid(items) {
    if (items.length === 0) {
      return `
        <div class="text-muted text-center" style="padding: 1.5rem; background: var(--surface-body); border-radius: var(--radius-md); font-size: var(--font-size-xs);">
          ยังไม่มีหลักฐานแนบในตัวชี้วัดนี้
        </div>
      `;
    }

    return `
      <div class="evidence-grid">
        ${items.map(item => {
          const typeInfo = Utils.getFileTypeInfo(item.title, item.mime_type);
          const viewerUrl = RouterUtils.buildUrl('./viewer.html', { id: item.id, year: this.currentYear });
          return `
            <a href="${viewerUrl}" class="evidence-card card-interactive" title="${Utils.escapeHtml(item.title)}">
              <div class="evidence-thumb">
                ${item.type === 'image' && item.external_url ? `
                  <img src="${item.external_url}" alt="${Utils.escapeHtml(item.title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm);">
                ` : `<span>${typeInfo.icon}</span>`}
              </div>
              <div class="badge ${typeInfo.badgeClass}" style="margin-top: 4px;">${typeInfo.label}</div>
              <div class="evidence-name">${Utils.escapeHtml(item.title)}</div>
              <p class="text-muted text-truncate" style="font-size: var(--font-size-xs);">${Utils.escapeHtml(item.description || '')}</p>
              <div class="evidence-meta">
                <span>${Utils.formatFileSize(item.file_size)}</span>
                <span>เปิดดู &rarr;</span>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    `;
  }

  _updateNavLinks(year) {
    const setLink = (id, page) => {
      const el = document.getElementById(id);
      if (el) el.href = RouterUtils.buildUrl(page, { year });
    };
    setLink('nav-home', './index.html');
    setLink('nav-classroom', './classroom.html');
    setLink('mob-nav-home', './index.html');
    setLink('mob-nav-classroom', './classroom.html');
    setLink('breadcrumb-home', './index.html');
    setLink('footer-link-classroom', './classroom.html');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PaPageController());
} else {
  new PaPageController();
}
