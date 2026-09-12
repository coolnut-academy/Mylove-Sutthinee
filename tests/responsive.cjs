// Run a local server on port 8765, then run with Playwright installed.
// Optional: PLAYWRIGHT_MODULE, BROWSER_CHANNEL, RESPONSIVE_BASE_URL.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sizes = [[320, 568], [390, 844], [568, 320], [844, 390], [768, 1024], [1024, 768], [1440, 900]];
const base = process.env.RESPONSIVE_BASE_URL || 'http://127.0.0.1:8765';
let checks = 0;

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    // Keep verification offline from the production API, including admin views.
    await page.route('**/js/config.js', async route => {
      const source = await (await route.fetch()).text();
      await route.fulfill({ body: source.replace('DATA_MODE: "live"', 'DATA_MODE: "mock"'), contentType: 'text/javascript' });
    });
    await page.route('https://script.google.com/**', route => route.abort());
    async function fit(label, root = 'body') {
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(100);
        const problems = await page.evaluate(root => {
          const result = [];
          if (document.documentElement.scrollWidth > innerWidth + 1) result.push('document overflow');
          for (const el of document.querySelectorAll(`${root} *`)) {
            const rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height || getComputedStyle(el).visibility === 'hidden') continue;
            // Wide tables and tab strips scroll inside their own containers.
            let parent = el.parentElement, scrollable = false;
            while (parent && parent !== document.body) {
              if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) scrollable = true;
              parent = parent.parentElement;
            }
            if (!scrollable && (rect.right > innerWidth + 1 || rect.left < -1)) result.push(el.id || el.className || el.tagName);
          }
          return result;
        }, root);
        assert.deepEqual(problems, [], `${label} at ${width}x${height}: ${problems}`);
        checks++;
      }
    }
    for (const file of ['index.html', 'classroom.html', 'classroom.html?view=students', 'pa.html', 'pa.html?sec=1.1', 'viewer.html', 'admin.html', '404.html']) {
      await page.goto(`${base}/${file}`);
      await page.waitForTimeout(700);
      await fit(file);
    }
    await page.goto(`${base}/admin.html`);
    await page.evaluate(async () => {
      const { AppState } = await import('/js/app-state.js');
      AppState.setSession({ token: 'responsive-test', expiresAt: new Date(Date.now() + 60000).toISOString() });
    });
    await page.reload();
    await page.locator('#admin-shell').waitFor({ state: 'visible' });
    for (const tab of ['home', 'classroom', 'pa', 'upload', 'years']) {
      await page.locator(`[data-task="${tab}"]`).click();
      await fit(`admin/${tab}`);
    }
    await page.goto(`${base}/index.html`);
    await page.setViewportSize({ width: 568, height: 320 });
    await page.locator('#mobile-nav-toggle').click();
    const lastLink = page.locator('.mobile-nav-link').last();
    await lastLink.scrollIntoViewIfNeeded();
    assert(await lastLink.isVisible(), 'landscape drawer navigation is reachable');
    await page.locator('#mobile-drawer-close').click();
    await page.evaluate(async () => {
      const { UniversalItemModal } = await import('/js/components/universal-item-modal.js');
      UniversalItemModal.open({ sectionTitle: 'รายละเอียดผลงานภาษาไทยและเอกสารประกอบการประเมิน '.repeat(3) });
    });
    await fit('item form', '.u-modal-overlay');
    await page.locator('#u-modal-close-btn').click();
    for (const [file, exported, selector] of [
      ['ebook-viewer-modal', 'EbookViewerModal', '.ebook-modal-overlay'],
      ['excel-viewer-modal', 'ExcelViewerModal', '.excel-modal-overlay']
    ]) {
      await page.evaluate(async ({ file, exported }) => {
        const modal = (await import(`/js/components/${file}.js`))[exported];
        modal._ensureModal();
        modal.modalEl.classList.remove('d-none');
        modal.modalEl.querySelector('h3, h2').textContent = 'ชื่อเอกสารภาษาไทยพร้อมชื่อไฟล์ยาว'.repeat(4);
      }, { file, exported });
      await fit(exported, selector);
      await page.evaluate(({ selector }) => document.querySelector(selector).classList.add('d-none'), { selector });
    }
    console.log(`PASS: ${checks} responsive viewport checks and landscape drawer interaction (mock data).`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
