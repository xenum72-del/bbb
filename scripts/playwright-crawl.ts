// scripts/playwright-crawl.ts
import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5274';
const OUT_DIR = path.resolve('docs/static/img/autoshots');
const MAP_FILE = path.resolve('autoshots.map.json');

// ---- Tunables ----
const MAX_VISITS = 25;            // max unique UI states to capture
const MAX_CLICKS_PER_VIEW = 8;    // per visible state
const WAIT_AFTER_NAV = 500;       // ms after nav/click before shot
const VIEWPORT = { width: 1440, height: 900 };

// ---- Types ----
type Shot = {
  url: string;
  title: string;
  file: string;
  notes?: string;
  stateKey: string;
};

// ---- Utils ----
function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function sha1(s: string) {
  return crypto.createHash('sha1').update(s).digest('hex');
}

// Captures a lightweight signature of the current UI so SPA state
// changes (without URL change) are still treated as new states.
async function getStateKey(page: Page) {
  const url = page.url();
  const sig = await page.evaluate(() => {
    const h1 = document.querySelector('h1')?.textContent?.trim() || '';
    const h2 = document.querySelector('h2')?.textContent?.trim() || '';
    const firstNav = Array.from(document.querySelectorAll('nav a, header a'))
      .slice(0, 5)
      .map(a => (a as HTMLAnchorElement).textContent?.trim() || '')
      .join('|');
    const counters = {
      buttons: document.querySelectorAll('button,[role="button"]').length,
      tables: document.querySelectorAll('table').length,
      modals: document.querySelectorAll('[role="dialog"], .modal, [class*="Dialog"]').length,
      tabs: document.querySelectorAll('[role="tab"]').length
    };
    const bodyLen = document.body?.innerText?.length || 0;
    return JSON.stringify({ h1, h2, firstNav, counters, bodyLen });
  });
  return `${url}#${sha1(sig)}`;
}

async function screenshot(page: Page, label: string, note?: string): Promise<Shot> {
  const stateKey = await getStateKey(page);
  const url = page.url();
  const safe = label.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
  const file = `${Date.now()}_${safe}.png`;
  await page.waitForTimeout(WAIT_AFTER_NAV);
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: true });
  const title = (await page.title()) || label;
  return { url, title, file, notes: note, stateKey };
}

function sameOrigin(url: string) {
  try {
    const a = new URL(url);
    const b = new URL(BASE_URL);
    return a.origin === b.origin;
  } catch { return false; }
}

function textLooksDangerous(t: string) {
  const s = t.toLowerCase();
  return /(delete|remove|drop|logout|sign out|reset|clear|wipe|archive|deprovision|disable|detach|terminate)/i.test(s);
}

// ---- Discovery helpers ----
async function discoverLinks(page: Page) {
  const anchors = await page.$$eval('a[href]', as => as.map(a => (a as HTMLAnchorElement).href));
  return anchors
    .filter(h => sameOrigin(h))
    .filter(h => !/\.(png|jpg|jpeg|gif|pdf|svg)$/i.test(h))
    .filter(h => !/logout|signout/i.test(h));
}

// Prefer accessible-name buttons; fallback to clickable flex items
async function discoverClickable(page: Page) {
  const candidates: { locator: string; text: string }[] = [];

  // 1) Semantic buttons by role/name (robust with nested SVG/span)
  const btns = page.getByRole('button');
  const count = await btns.count().catch(() => 0);
  for (let i = 0; i < Math.min(count, 60); i++) {
    const b = btns.nth(i);
    const vis = await b.isVisible().catch(() => false);
    if (!vis) continue;
    const name = (await b.textContent().catch(() => ''))?.trim().replace(/\s+/g, ' ') || '';
    if (!name || textLooksDangerous(name)) continue;
    candidates.push({ locator: `role=button[name="${name.replace(/["\\]/g, '\\$&')}"]`, text: name });
  }

  // 2) Fallbacks: clickable div/span (pointer cursor / role=button / onclick)
  const extra = await page.$$eval('div,span,[role="button"]', els => {
    const out: { locator: string; text: string }[] = [];
    for (const el of els.slice(0, 120) as HTMLElement[]) {
      const styles = getComputedStyle(el);
      const clickable = styles.cursor === 'pointer' || el.getAttribute('role') === 'button' || (el as any).onclick;
      const rect = el.getBoundingClientRect();
      const visible = rect.width > 34 && rect.height > 28 && !!el.offsetParent;
      const text = (el.innerText || '').trim().replace(/\s+/g, ' ');
      if (clickable && visible && text) {
        const safe = text.replace(/["\\]/g, '\\$&');
        out.push({ locator: `:has-text("${safe}")`, text });
      }
    }
    return out;
  });

  // Merge unique by locator
  const uniq = new Map<string, { locator: string; text: string }>();
  [...candidates, ...extra].forEach(c => {
    if (!textLooksDangerous(c.text) && !uniq.has(c.locator)) uniq.set(c.locator, c);
  });

  // Prioritize navigation & primary actions (include "timeline" per your sample)
  const score = (t: string) => {
    const s = t.toLowerCase();
    if (/(home|dashboard|timeline|settings|profile|projects|reports|help|about)/.test(s)) return 4;
    if (/(create|new|add|view|open|details|next|continue|browse)/.test(s)) return 3;
    return 1;
  };

  return Array.from(uniq.values())
    .sort((a, b) => score(b.text) - score(a.text))
    .slice(0, 24);
}

async function attemptCommonFlows(page: Page, shots: Shot[]) {
  // Try opening modals/settings-like UI
  const modalTrigger = page.locator('text=/new|create|add|settings|profile/i').first();
  if (await modalTrigger.isVisible().catch(() => false)) {
    await modalTrigger.click({ trial: false }).catch(() => {});
    const modal = page.locator('[role="dialog"], .modal, [class*="Dialog"]');
    if (await modal.first().isVisible().catch(() => false)) {
      shots.push(await screenshot(page, 'modal_open', 'Modal opened'));
      await page.keyboard.press('Escape').catch(() => {});
    }
  }

  // Table overview
  const table = page.locator('table');
  if (await table.first().isVisible().catch(() => false)) {
    shots.push(await screenshot(page, 'table_view', 'Table overview'));
  }

  // Simple form fill preview
  const form = page.locator('form');
  if (await form.first().isVisible().catch(() => false)) {
    const anyInput = page.locator('form input:not([type=hidden]), form textarea, form select').first();
    if (await anyInput.isVisible().catch(() => false)) {
      await anyInput.fill('Sample').catch(() => {});
      shots.push(await screenshot(page, 'form_filled', 'Form filled example'));
    }
  }
}

// ---- Main crawl ----
async function crawl() {
  ensureDir(OUT_DIR);
  const browser: Browser = await chromium.launch();
  const page: Page = await browser.newPage({ viewport: VIEWPORT });

  // Reduce noise / speed up
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (/\.(mp4|webm|zip|woff2?|ttf)$/i.test(url) || /analytics|segment|amplitude|hotjar|gtag/i.test(url)) {
      return route.abort();
    }
    return route.continue();
  });

  const queue: { url: string }[] = [{ url: BASE_URL }];
  const visitedStates = new Set<string>();
  const shots: Shot[] = [];

  while (queue.length && visitedStates.size < MAX_VISITS) {
    const { url } = queue.shift()!;
    await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(WAIT_AFTER_NAV);

    // Capture landing state (unique by stateKey)
    let stateKey = await getStateKey(page);
    if (!visitedStates.has(stateKey)) {
      visitedStates.add(stateKey);
      shots.push(await screenshot(page, 'page', 'Landing on route'));
    }

    // Enqueue same-origin hrefs (if any exist)
    const hrefs = await discoverLinks(page);
    hrefs.slice(0, 8).forEach(h => { if (sameOrigin(h)) queue.push({ url: h }); });

    // Try common UI flows on this view
    await attemptCommonFlows(page, shots);

    // Scroll a bit to reveal lazy content
    for (let i = 0; i < 2; i++) {
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(250);
    }

    // Click non-anchor UI controls
    const clickables = await discoverClickable(page);
    let clicks = 0;
    for (const c of clickables) {
      if (clicks >= MAX_CLICKS_PER_VIEW) break;

      const locator = page.locator(c.locator).first();
      const visible = await locator.isVisible().catch(() => false);
      if (!visible) continue;

      // Small hover helps with animated buttons (Tailwind transitions)
      await locator.hover().catch(() => {});
      await page.waitForTimeout(120);

      const beforeState = await getStateKey(page);
      await locator.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(400);

      const afterState = await getStateKey(page);
      if (afterState !== beforeState && !visitedStates.has(afterState)) {
        visitedStates.add(afterState);
        shots.push(await screenshot(page, `after_click_${clicks + 1}`, `Clicked: ${c.text}`));
        clicks++;
      } else {
        // best-effort unwind (modal close, etc.)
        await page.keyboard.press('Escape').catch(() => {});
      }
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(shots, null, 2));
  await browser.close();
  console.log(`Saved ${shots.length} screenshots to ${OUT_DIR}`);
}

// ---- Run ----
crawl().catch(err => {
  console.error(err);
  process.exit(1);
});