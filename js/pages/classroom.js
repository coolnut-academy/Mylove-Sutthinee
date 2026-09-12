/**
 * Classroom Module Controller
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';
import { RouterUtils } from '../router-utils.js';
import { AppState } from '../app-state.js';
import { SettingsApi, YearsApi, ClassroomApi } from '../api.js';
import { Utils } from '../utils.js';
import { InlineEditor } from '../admin/inline-editor.js';

class ClassroomPageController {
  constructor() {
    this.currentYear = RouterUtils.resolveYear();
    this.classroomData = null;
    this.allStudents = [];
    this.allDocuments = [];
    this.init();
  }

  async init() {
    Loading.start();
    this._bindMobileNav();
    this._bindYearChange();
    this._bindTabs();
    this._bindSearch();
    this._bindDocumentFilters();
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
      await this._loadClassroomData(this.currentYear);
      Loading.done();
      InlineEditor.init();
    } catch (err) {
      console.error("Failed to load classroom module:", err);
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
        this._loadClassroomData(newYear);
      }
    });

    AppState.on('yearChanged', (year) => {
      if (select && select.value !== year) select.value = year;
      this.currentYear = year;
      this._loadClassroomData(year);
    });
  }

  _bindTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this._switchTab(tab.dataset.tab);
      });
    });

    // Handle hash in URL (e.g. #tab-routines or #health)
    const handleHash = () => {
      let hash = (window.location.hash || '').replace('#', '');
      if (!hash) return;
      if (hash.startsWith('tab-')) hash = hash.replace('tab-', '');
      if (hash === 'sdq') hash = 'health';
      if (hash === 'overview') hash = 'members';
      this._switchTab(hash);
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
  }

  _switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    const targetTabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (!targetTabBtn) return;

    tabs.forEach(t => t.classList.remove('active'));
    targetTabBtn.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.add('d-none');
    });

    const activeSection = document.getElementById(`tab-${tabName}`);
    if (activeSection) {
      activeSection.classList.remove('d-none');
      activeSection.classList.add('animate-fade-in');
    }
  }

  _bindSearch() {
    const input = document.getElementById('search-students');
    input?.addEventListener('input', Utils.debounce((e) => {
      const query = e.target.value.trim().toLowerCase();
      this._filterStudents(query);
    }, 200));
  }

  _bindDocumentFilters() {
    const btns = document.querySelectorAll('[data-doc-filter]');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active', 'btn-primary'));
        btn.classList.add('active', 'btn-primary');
        const filter = btn.dataset.docFilter;
        this._renderDocuments(filter);
      });
    });
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

  async _loadClassroomData(year) {
    Loading.start();
    const yearPill = document.getElementById('classroom-year-pill');
    if (yearPill) yearPill.textContent = `ปีการศึกษา ${year}`;

    this._updateNavLinks(year);

    try {
      this.classroomData = await ClassroomApi.getClassroomData(year);
      this.allStudents = this.classroomData?.students || [];
      this.allDocuments = this.classroomData?.documents || [];

      // Update stats
      const totalStudents = this.allStudents.length;
      document.getElementById('cls-stat-total').textContent = totalStudents;
      document.getElementById('cls-stat-docs').textContent = this.allDocuments.length;

      // Calculate attendance
      const attendance = this.classroomData?.attendance || [];
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const rate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 100;
      document.getElementById('cls-stat-attendance').textContent = `${rate}%`;

      // Render tab tables
      this._renderStudents(this.allStudents);
      this._renderRoutines(this.allStudents, this.classroomData?.routines || [], attendance);
      this._renderHealth(this.allStudents, this.classroomData?.health || [], this.classroomData?.sdq || []);
      this._renderDocuments('all');

      Loading.done();
    } catch (err) {
      console.error("Error loading classroom data for year:", year, err);
      Loading.fail();
    }
  }

  _renderStudents(students) {
    const tbody = document.getElementById('students-table-body');
    const countLabel = document.getElementById('students-count-label');
    if (!tbody) return;

    if (countLabel) countLabel.textContent = `แสดง ${students.length} คน`;

    if (students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 3rem;">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-title">ไม่พบข้อมูลนักเรียนในปีการศึกษานี้</div>
            <p class="empty-state-text">ยังไม่มีการเพิ่มรายชื่อนักเรียนสำหรับปีการศึกษานี้</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = students.map(s => `
      <tr>
        <td style="text-align: center; font-weight: 600; color: var(--color-primary-strong);">${s.student_no}</td>
        <td><code>${Utils.escapeHtml(s.student_id)}</code></td>
        <td class="font-medium">${Utils.escapeHtml(s.prefix)}${Utils.escapeHtml(s.first_name)} ${Utils.escapeHtml(s.last_name)}</td>
        <td>${Utils.escapeHtml(s.class || '-')}</td>
        <td><span class="badge ${s.status === 'active' ? 'badge-sage' : 'badge-muted'}">${s.status === 'active' ? 'กำลังศึกษา' : s.status}</span></td>
        <td class="text-muted" style="font-size: var(--font-size-xs);">${Utils.escapeHtml(s.note || '-')}</td>
      </tr>
    `).join('');
  }

  _filterStudents(query) {
    if (!query) {
      this._renderStudents(this.allStudents);
      return;
    }
    const filtered = this.allStudents.filter(s => {
      const fullName = `${s.prefix || ''}${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const id = String(s.student_id || '');
      const no = String(s.student_no || '');
      return fullName.includes(query) || id.includes(query) || no === query;
    });
    this._renderStudents(filtered);
  }

  _renderRoutines(students, routines, attendance) {
    const tbody = document.getElementById('routines-table-body');
    if (!tbody) return;

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem;">ไม่มีข้อมูล</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => {
      const att = attendance.find(a => a.student_id === s.student_id);
      const isPresent = !att || att.status === 'present';
      const attLabel = isPresent ? 'มาเรียน' : (att.note || 'ขาด/ลา');
      const attBadge = isPresent ? 'badge-sage' : 'badge-rose';

      return `
        <tr>
          <td style="text-align: center; font-weight: 600;">${s.student_no}</td>
          <td>${Utils.escapeHtml(s.prefix)}${Utils.escapeHtml(s.first_name)} ${Utils.escapeHtml(s.last_name)}</td>
          <td style="text-align: center;"><span class="badge ${attBadge}">${attLabel}</span></td>
          <td style="text-align: center;"><span class="badge badge-sage">✓ เรียบร้อย</span></td>
          <td style="text-align: center;"><span class="badge badge-sage">✓ เรียบร้อย</span></td>
          <td class="text-muted" style="font-size: var(--font-size-xs);">${Utils.escapeHtml(att?.note || '-')}</td>
        </tr>
      `;
    }).join('');
  }

  _renderHealth(students, healthList, sdqList) {
    const tbody = document.getElementById('health-table-body');
    if (!tbody) return;

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;">ไม่มีข้อมูล</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => {
      const h = healthList.find(x => x.student_id === s.student_id) || {};
      const q = sdqList.find(x => x.student_id === s.student_id) || {};

      const weight = h.weight ? h.weight.toFixed(1) : '-';
      const height = h.height || '-';
      const bmi = h.bmi ? h.bmi.toFixed(1) : '-';
      const nutrition = h.health_result || 'สมส่วน';
      const sdqResult = q.result || 'ปกติ';
      const isSdqRisk = sdqResult.includes('เสี่ยง') || sdqResult.includes('มีปัญหา');

      return `
        <tr>
          <td style="text-align: center; font-weight: 600;">${s.student_no}</td>
          <td>${Utils.escapeHtml(s.prefix)}${Utils.escapeHtml(s.first_name)} ${Utils.escapeHtml(s.last_name)}</td>
          <td style="text-align: right;">${weight}</td>
          <td style="text-align: right;">${height}</td>
          <td style="text-align: right;">${bmi}</td>
          <td style="text-align: center;"><span class="badge badge-sage">${nutrition}</span></td>
          <td style="text-align: center;"><span class="badge ${isSdqRisk ? 'badge-rose' : 'badge-purple'}">${sdqResult}</span></td>
        </tr>
      `;
    }).join('');
  }

  _renderDocuments(filterCategory = 'all') {
    const grid = document.getElementById('classroom-docs-grid');
    if (!grid) return;

    let docs = this.allDocuments;
    if (filterCategory !== 'all') {
      docs = docs.filter(d => d.category === filterCategory);
    }

    if (docs.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">ไม่พบเอกสารในหมวดหมู่นี้</div>
          <p class="empty-state-text">เลือกหมวดหมู่อื่น หรือเข้าสู่ระบบ Admin เพื่ออัปโหลดเอกสาร</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = docs.map(doc => {
      const typeInfo = Utils.getFileTypeInfo(doc.title, doc.type);
      const viewerUrl = RouterUtils.buildUrl('./viewer.html', { id: doc.id, year: this.currentYear });
      return `
        <a href="${viewerUrl}" class="evidence-card card-interactive" title="${Utils.escapeHtml(doc.title)}">
          <div class="evidence-thumb">
            <span>${typeInfo.icon}</span>
          </div>
          <div class="badge ${typeInfo.badgeClass}" style="margin-top: 4px;">${typeInfo.label}</div>
          <div class="evidence-name">${Utils.escapeHtml(doc.title)}</div>
          <p class="text-muted text-truncate" style="font-size: var(--font-size-xs);">${Utils.escapeHtml(doc.description || '')}</p>
          <div class="evidence-meta">
            <span>หมวด: ${Utils.escapeHtml(doc.category)}</span>
            <span>เปิดดู &rarr;</span>
          </div>
        </a>
      `;
    }).join('');
  }

  _updateNavLinks(year) {
    const setLink = (id, page) => {
      const el = document.getElementById(id);
      if (el) el.href = RouterUtils.buildUrl(page, { year });
    };
    setLink('nav-home', './index.html');
    setLink('nav-pa', './pa.html');
    setLink('mob-nav-home', './index.html');
    setLink('mob-nav-pa', './pa.html');
    setLink('breadcrumb-home', './index.html');
    setLink('footer-link-pa', './pa.html');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ClassroomPageController());
} else {
  new ClassroomPageController();
}
