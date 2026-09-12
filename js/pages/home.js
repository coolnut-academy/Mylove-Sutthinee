/**
 * Homepage Logic — Semi-Portfolio Presentation & Evaluator Focused
 * Suttinee Teacher Workspace
 */

import { Loading } from '../loading.js';
import { RouterUtils } from '../router-utils.js';
import { AppState } from '../app-state.js';
import { SettingsApi, YearsApi, ClassroomApi, PaApi, AuthApi } from '../api.js';
import { Utils } from '../utils.js';
import { Modal } from '../modal.js';
import { Toast } from '../toast.js';

class HomePageController {
  constructor() {
    this.currentYear = RouterUtils.resolveYear();
    this.init();
  }

  async init() {
    Loading.start();
    this._bindMobileNav();
    this._bindYearChange();
    this._bindAdminTopRight();
    this._bindPortfolioTabs();
    this._bindGameLaunchers();

    try {
      Loading.set(25);
      await this._loadSettings();
      Loading.set(45);
      await this._loadYears();
      Loading.set(65);
      await this._loadYearData(this.currentYear);
      Loading.set(85);
      this._updateDynamicLinks(this.currentYear);
      this._updateAdminButton();
      Loading.done();
    } catch (err) {
      console.error("Failed to initialize home page:", err);
      Loading.fail();
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
        this._loadYearData(newYear);
      }
    });

    AppState.on('yearChanged', (year) => {
      if (select && select.value !== year) {
        select.value = year;
      }
      this.currentYear = year;
      this._updateDynamicLinks(year);
      this._loadYearData(year);
    });
  }

  _bindAdminTopRight() {
    const adminBtn = document.getElementById('btn-header-admin');
    adminBtn?.addEventListener('click', (e) => {
      if (AppState.isAdmin()) {
        // Already logged in, navigate straight to admin.html
        return;
      }

      // Not logged in: open swift, accessible login modal right on homepage
      e.preventDefault();
      this._openAdminLoginModal();
    });

    AppState.on('authChanged', () => {
      this._updateAdminButton();
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
      if (text) text.textContent = 'จัดการระบบ';
    } else {
      if (btn) {
        btn.className = 'btn btn-subtle btn-sm';
        btn.href = './admin.html';
      }
      if (icon) icon.textContent = '🔒';
      if (text) text.textContent = 'Admin';
    }
  }

  _openAdminLoginModal() {
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
        <label class="form-label" for="home-admin-password">รหัสผ่านผู้ดูแลระบบ</label>
        <input type="password" id="home-admin-password" class="form-control" placeholder="กรอกรหัสผ่าน" autofocus required>
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
            Toast.success('เข้าสู่ระบบสำเร็จ กำลังเปิดหน้าจัดการ...');
            setTimeout(() => {
              window.location.href = './admin.html';
            }, 500);
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

  _bindPortfolioTabs() {
    const tabButtons = document.querySelectorAll('.portfolio-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        if (!targetTab) return;

        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const panes = document.querySelectorAll('.portfolio-tab-pane');
        panes.forEach(pane => {
          pane.classList.remove('active');
        });

        const targetPane = document.getElementById(targetTab.replace('tab-', 'pane-'));
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }

  _bindGameLaunchers() {
    const playButtons = document.querySelectorAll('.game-play-btn');
    playButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const gameType = btn.getAttribute('data-game');
        this._launchGameSimulation(gameType);
      });
    });
  }

  _launchGameSimulation(gameType) {
    const body = document.createElement('div');
    body.className = 'game-playground-container';

    if (gameType === 'wheel') {
      const words = [
        { word: 'กา', p: 'ก', v: 'สระอา', detail: 'ก + อา = กา 🐦' },
        { word: 'ตา', p: 'ต', v: 'สระอา', detail: 'ต + อา = ตา 👀' },
        { word: 'มา', p: 'ม', v: 'สระอา', detail: 'ม + อา = มา 🚶' },
        { word: 'ดี', p: 'ด', v: 'สระอี', detail: 'ด + อี = ดี 👍' },
        { word: 'มี', p: 'ม', v: 'สระอี', detail: 'ม + อี = มี 🎁' },
        { word: 'ปู', p: 'ป', v: 'สระอู', detail: 'ป + อู = ปู 🦀' },
        { word: 'ดู', p: 'ด', v: 'สระอู', detail: 'ด + อู = ดู 🔍' },
        { word: 'ใจ', p: 'จ', v: 'สระไอไม้ม้วน', detail: 'จ + ไอ = ใจ ❤️' }
      ];

      body.innerHTML = `
        <div class="text-center">
          <div class="game-score-badge">🎡 สื่อการสอนจำลองสำหรับคณะกรรมการประเมิน</div>
          <p class="text-secondary mb-3" style="font-size: var(--font-size-sm);">
            กดปุ่ม <strong>"หมุนวงล้อสะกดคำ"</strong> เพื่อสุ่มคำศัพท์ภาษาไทยและฝึกแจกลูกสะกดคำ
          </p>
          
          <div style="position: relative; width: 220px; height: 220px; margin: 0 auto;">
            <div id="sim-wheel" style="width: 100%; height: 100%; border-radius: 50%; border: 6px solid #FFD54F; box-shadow: 0 4px 16px rgba(0,0,0,0.2); overflow: hidden; transition: transform 2.5s cubic-bezier(0.15, 0.9, 0.25, 1); background: url('./assets/games/game-wheel.svg') center/cover;">
            </div>
            <div style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-size: 1.8rem;">🔻</div>
          </div>

          <div id="wheel-result-box" class="mt-4 p-3" style="background: var(--purple-50); border-radius: var(--radius-md); border: 1px dashed var(--purple-300); min-height: 85px;">
            <div class="text-muted" style="font-size: var(--font-size-xs);">ผลลัพธ์การหมุนวงล้อ</div>
            <div id="wheel-result-text" style="font-size: 1.6rem; font-weight: 800; color: var(--purple-900); margin: 4px 0;">
              พร้อมหมุนคำศัพท์
            </div>
            <div id="wheel-result-detail" class="text-secondary" style="font-size: var(--font-size-xs);">
              กดปุ่มด้านล่างเพื่อเริ่มการสุ่มคำ
            </div>
          </div>

          <div class="mt-4">
            <button type="button" id="btn-spin-wheel" class="btn btn-primary" style="padding: 10px 24px; font-weight: 700;">
              <span>🎡</span> หมุนวงล้อสะกดคำ!
            </button>
          </div>
        </div>
      `;

      Modal.open({
        title: '🎡 จำลองเกม: วงล้อคำหรรษา (Thai Word Wheel)',
        body,
        confirmText: 'ปิดหน้าต่าง',
        cancelText: null
      });

      setTimeout(() => {
        const spinBtn = body.querySelector('#btn-spin-wheel');
        const wheelEl = body.querySelector('#sim-wheel');
        const resultText = body.querySelector('#wheel-result-text');
        const resultDetail = body.querySelector('#wheel-result-detail');
        let currentDeg = 0;

        spinBtn?.addEventListener('click', () => {
          spinBtn.disabled = true;
          const randomItem = words[Math.floor(Math.random() * words.length)];
          const addedRot = 1440 + Math.floor(Math.random() * 360);
          currentDeg += addedRot;
          if (wheelEl) wheelEl.style.transform = `rotate(${currentDeg}deg)`;

          if (resultText) resultText.textContent = "กำลังหมุน...";
          if (resultDetail) resultDetail.textContent = "หมุนค้นหาคำศัพท์...";

          setTimeout(() => {
            if (resultText) resultText.innerHTML = `คำว่า <span style="color:#C2185B;">"${randomItem.word}"</span>`;
            if (resultDetail) resultDetail.innerHTML = `การแจกลูกสะกดคำ: <strong>${randomItem.detail}</strong> (${randomItem.v})`;
            spinBtn.disabled = false;
            Toast.success(`ได้คำว่า "${randomItem.word}" - ${randomItem.detail}`);
          }, 2500);
        });
      }, 100);

    } else if (gameType === 'mole') {
      body.innerHTML = `
        <div class="text-center">
          <div class="game-score-badge">🔨 ตีตัวตุ่นสระไทย</div>
          <p class="text-secondary mb-3" style="font-size: var(--font-size-sm);">
            โจทย์: <strong>ตีเฉพาะตัวตุ่นที่มี "สระอา (-า)"</strong> เพื่อเก็บคะแนน!
          </p>
          <div class="d-flex justify-between align-center mb-3" style="max-width: 320px; margin: 0 auto;">
            <div>คะแนน: <strong id="mole-score" style="color: #43A047; font-size: 1.4rem;">0</strong> แต้ม</div>
            <button type="button" id="btn-start-mole" class="btn btn-secondary btn-sm">เริ่มรอบใหม่</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 340px; margin: 0 auto;">
            <button type="button" class="mole-hole btn" style="height: 90px; background: #5D4037; border-radius: var(--radius-lg); font-size: 1.8rem; color: #FFE082; display: flex; flex-direction: column; align-items: center; justify-content: center;" data-index="0">🕳️</button>
            <button type="button" class="mole-hole btn" style="height: 90px; background: #5D4037; border-radius: var(--radius-lg); font-size: 1.8rem; color: #FFE082; display: flex; flex-direction: column; align-items: center; justify-content: center;" data-index="1">🕳️</button>
            <button type="button" class="mole-hole btn" style="height: 90px; background: #5D4037; border-radius: var(--radius-lg); font-size: 1.8rem; color: #FFE082; display: flex; flex-direction: column; align-items: center; justify-content: center;" data-index="2">🕳️</button>
          </div>
        </div>
      `;

      Modal.open({
        title: '🔨 จำลองเกม: ตีตัวตุ่นสระไทย (Whack-a-Mole)',
        body,
        confirmText: 'ปิดหน้าต่าง',
        cancelText: null
      });

      setTimeout(() => {
        const holes = body.querySelectorAll('.mole-hole');
        const scoreEl = body.querySelector('#mole-score');
        const startBtn = body.querySelector('#btn-start-mole');
        let score = 0;
        let moleTimer = null;

        const pop = () => {
          holes.forEach(h => {
            h.innerHTML = '🕳️';
            h.setAttribute('data-val', '');
          });
          const randHole = holes[Math.floor(Math.random() * holes.length)];
          const isTarget = Math.random() > 0.4;
          const vowel = isTarget ? '-า' : (Math.random() > 0.5 ? '-ะ' : 'เ-');
          randHole.innerHTML = `🐭<br><span style="font-size: 1rem; font-weight:800; background:#FFF; color:#2E1F40; padding:1px 6px; border-radius:4px;">${vowel}</span>`;
          randHole.setAttribute('data-val', vowel);
        };

        holes.forEach(h => {
          h.addEventListener('click', () => {
            const val = h.getAttribute('data-val');
            if (val === '-า') {
              score += 10;
              if (scoreEl) scoreEl.textContent = score;
              h.innerHTML = '⭐ +10!';
              Toast.success('ถูกต้อง! ได้ 10 คะแนน');
            } else if (val) {
              Toast.error('ยังไม่ใช่สระอา ลองใหม่นะจ๊ะ');
            }
          });
        });

        startBtn?.addEventListener('click', () => {
          score = 0;
          if (scoreEl) scoreEl.textContent = score;
          clearInterval(moleTimer);
          moleTimer = setInterval(pop, 1400);
          pop();
        });

        startBtn?.click();
      }, 100);

    } else if (gameType === 'airplane') {
      body.innerHTML = `
        <div class="text-center">
          <div class="game-score-badge">✈️ เครื่องบินเหินเวหาล่าคำศัพท์</div>
          <p class="text-secondary mb-3" style="font-size: var(--font-size-sm);">
            นำเครื่องบินไปชนบอลลูนที่มีคำศัพท์ถูกต้องตามภาพ
          </p>
          <div style="background: url('./assets/games/game-airplane.svg') center/cover; height: 180px; border-radius: var(--radius-lg); border: 2px solid #64B5F6; margin-bottom: 16px;"></div>
          <div class="d-flex justify-center gap-3">
            <button type="button" class="btn btn-secondary" onclick="alert('ยอดเยี่ยม! คำว่า แม่น้ำ ถูกต้อง')">🎈 บอลลูน: แม่น้ำ</button>
            <button type="button" class="btn btn-secondary" onclick="alert('ลองเลือกใหม่นะจ๊ะ')">🎈 บอลลูน: ภูเขา</button>
            <button type="button" class="btn btn-secondary" onclick="alert('ลองเลือกใหม่นะจ๊ะ')">🎈 บอลลูน: ท้องฟ้า</button>
          </div>
        </div>
      `;

      Modal.open({
        title: '✈️ จำลองเกม: เครื่องบินเหินเวหาล่าคำศัพท์',
        body,
        confirmText: 'ปิดหน้าต่าง',
        cancelText: null
      });

    } else {
      // Puzzle Match
      body.innerHTML = `
        <div class="text-center">
          <div class="game-score-badge">🧩 เกมจับคู่ต่อภาพผสมคำ</div>
          <p class="text-secondary mb-3" style="font-size: var(--font-size-sm);">
            ต่อพยัญชนะกับสระให้กลายเป็นคำศัพท์ที่มีความหมาย
          </p>
          <div style="background: url('./assets/games/game-puzzle.svg') center/cover; height: 180px; border-radius: var(--radius-lg); border: 2px solid #AB47BC; margin-bottom: 16px;"></div>
          <div style="background: var(--purple-50); padding: 12px; border-radius: 8px;">
            <div style="font-size: 1.4rem; font-weight: 700; color: #4A148C;">ป + ล + า = ปลา 🐟</div>
            <div class="text-muted mt-1" style="font-size: 0.8rem;">พยัญชนะต้นควบกล้ำ + สระอา = คำนามความหมายสัตว์น้ำ</div>
          </div>
        </div>
      `;

      Modal.open({
        title: '🧩 จำลองเกม: จับคู่ต่อภาพผสมคำ',
        body,
        confirmText: 'ปิดหน้าต่าง',
        cancelText: null
      });
    }
  }

  async _loadSettings() {
    const settings = await SettingsApi.getSettings();
    if (!settings) return;

    AppState.setSettings(settings);

    // Apply titles & bio
    if (settings.site_title) {
      const headerTitle = document.getElementById('header-title');
      if (headerTitle) headerTitle.textContent = settings.site_title;
    }
    if (settings.teacher_name) {
      const heroName = document.getElementById('hero-teacher-name');
      if (heroName) heroName.textContent = settings.teacher_name;
    }
    if (settings.teacher_role) {
      const heroRole = document.getElementById('hero-role');
      if (heroRole) heroRole.textContent = `${settings.teacher_role} · ครูประจำชั้นประถมศึกษาปีที่ ๑`;
    }
    if (settings.school_name) {
      const heroSchool = document.getElementById('hero-school');
      if (heroSchool) heroSchool.innerHTML = `<span>🏫</span> ${settings.school_name} (สพป.มส. เขต ๒)`;
    }
    if (settings.welcome_quote) {
      const heroQuote = document.getElementById('hero-quote');
      if (heroQuote) heroQuote.textContent = `“${settings.welcome_quote}”`;
    }

    // Apply images & avatars
    if (settings.profile_image) {
      const headerAvatar = document.getElementById('header-avatar');
      const heroAvatar = document.getElementById('hero-avatar');
      if (headerAvatar) headerAvatar.src = settings.profile_image;
      if (heroAvatar) heroAvatar.src = settings.profile_image;
    }
    if (settings.school_logo) {
      const schoolLogoEl = document.getElementById('hero-school-logo');
      if (schoolLogoEl) schoolLogoEl.src = settings.school_logo;
    }
    if (settings.pa_cover_image) {
      const coverPa = document.getElementById('cover-pa');
      if (coverPa) coverPa.src = settings.pa_cover_image;
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
      if (y.year === this.currentYear) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    const badge = document.getElementById('hero-year-badge');
    if (badge) badge.textContent = `ปีการศึกษา ${this.currentYear}`;
  }

  async _loadYearData(year) {
    const badge = document.getElementById('hero-year-badge');
    if (badge) badge.textContent = `ปีการศึกษา ${year}`;

    try {
      const [clsData, paItems] = await Promise.all([
        ClassroomApi.getClassroomData(year),
        PaApi.getItems(year)
      ]);

      const statStudents = document.getElementById('stat-students');
      const countActionStudents = document.getElementById('count-action-students');
      const studentCount = clsData?.students?.length || 0;
      if (statStudents) statStudents.textContent = studentCount;
      if (countActionStudents) countActionStudents.textContent = `${studentCount} คน`;

      const statDocs = document.getElementById('stat-docs');
      if (statDocs) statDocs.textContent = clsData?.documents?.length || '0';

      this._renderRecentItems(clsData?.documents || [], paItems || [], year);
    } catch (err) {
      console.warn("Error loading year data:", err);
    }
  }

  _renderRecentItems(docs, paItems, year) {
    const container = document.getElementById('home-recent-list');
    if (!container) return;

    const combined = [
      ...paItems.map(p => ({ ...p, source: `ว.PA ตัวชี้วัด ${p.section_code}`, module: 'pa' })),
      ...docs.map(d => ({ ...d, source: 'ธุรการ/วิชาการ', module: 'classroom' }))
    ].slice(0, 6);

    if (combined.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📂</div>
          <div class="empty-state-title">ยังไม่มีรายการเอกสารในปีการศึกษานี้</div>
          <p class="empty-state-text">คณะกรรมการสามารถเลือกปีการศึกษาอื่นเพื่อดูหลักฐานย้อนหลังได้</p>
        </div>
      `;
      return;
    }

    container.innerHTML = combined.map(item => {
      const typeInfo = Utils.getFileTypeInfo(item.title, item.mime_type);
      const viewerUrl = RouterUtils.buildUrl('./viewer.html', { id: item.id, year });
      return `
        <a href="${viewerUrl}" class="evidence-card card-interactive" title="${Utils.escapeHtml(item.title)}">
          <div class="evidence-thumb">
            ${item.type === 'image' && item.external_url ? `
              <img src="${item.external_url}" alt="${Utils.escapeHtml(item.title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm);">
            ` : `<span>${typeInfo.icon}</span>`}
          </div>
          <div class="badge ${typeInfo.badgeClass}" style="margin-top: 4px;">${typeInfo.label}</div>
          <div class="evidence-name">${Utils.escapeHtml(item.title)}</div>
          <div class="evidence-meta">
            <span>${Utils.escapeHtml(item.source)}</span>
            <span>เปิดดูหลักฐาน &rarr;</span>
          </div>
        </a>
      `;
    }).join('');
  }

  _updateDynamicLinks(year) {
    const setLink = (id, page, extraParams = {}) => {
      const el = document.getElementById(id);
      if (el) el.href = RouterUtils.buildUrl(page, { year, ...extraParams });
    };

    setLink('nav-classroom', './classroom.html');
    setLink('nav-pa', './pa.html');
    setLink('mob-nav-classroom', './classroom.html');
    setLink('mob-nav-pa', './pa.html');
    setLink('card-pa-link', './pa.html');
    setLink('card-challenge-link', './pa.html', { filter: 'ส่วนที่ 2' });
    setLink('footer-link-classroom', './classroom.html');
    setLink('footer-link-pa', './pa.html');

    // Evaluator quick jump buttons
    setLink('btn-eval-pa', './pa.html');
    setLink('btn-eval-challenge', './pa.html', { filter: 'ส่วนที่ 2' });
    setLink('btn-eval-classroom', './classroom.html');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new HomePageController());
} else {
  new HomePageController();
}
