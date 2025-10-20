import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve('docs/static/img/autoshots');
const MAP_FILE = path.resolve('autoshots.map.json');

type Shot = { url: string; title: string; file: string; notes?: string };

const WAIT = 500;
const MAX_PAGES = 30;

async function screenshot(page: any, url: string, label: string, note?: string): Promise<Shot> {
  const safe = label.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
  const file = `${Date.now()}_${safe}.png`;
  await page.waitForTimeout(WAIT);
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: true });
  const title = (await page.title()) || label;
  return { url, title, file, notes: note };
}

function uniq<T>(arr: T[]) { return Array.from(new Set(arr)); }

async function discoverLinks(page: any) {
  const anchors = await page.$$eval('a[href]', as => as.map(a => (a as HTMLAnchorElement).href));
  return { anchors: uniq(anchors) };
}

function sameOrigin(url: string) {
  try {
    const u = new URL(url);
    const b = new URL(BASE_URL);
    return u.origin === b.origin;
  } catch { return false; }
}

async function attemptCommonFlows(page: any, currentUrl: string, shots: Shot[]) {
  const loginSelectors = ['text=/sign in/i','text=/log in/i','text=/authenticate/i'];
  for (const sel of loginSelectors) {
    const btn = await page.$(sel);
    if (btn) {
      await btn.click({ timeout: 1000 }).catch(()=>{});
      shots.push(await screenshot(page, currentUrl, 'auth_flow_after_click', 'After login click'));
      break;
    }
  }

  const modalTriggers = ['text=/new/i','text=/create/i','text=/add/i','text=/settings/i','text=/profile/i'];
  for (const sel of modalTriggers) {
    const el = await page.$(sel);
    if (el) {
      await el.click({ timeout: 1000 }).catch(()=>{});
      const modal = await page.$('[role="dialog"], .modal, [class*=Dialog]');
      if (modal) {
        shots.push(await screenshot(page, currentUrl, 'modal_open', 'Modal opened'));
        await page.keyboard.press('Escape').catch(()=>{});
      }
    }
  }

  const table = await page.$('table');
  if (table) shots.push(await screenshot(page, currentUrl, 'table_view', 'Table overview'));

  const form = await page.$('form');
  if (form) {
    const inputs = await page.$$('input:not([type=hidden]), textarea, select');
    if (inputs.length) {
      try { await inputs[0].fill('Sample'); } catch {}
      shots.push(await screenshot(page, currentUrl, 'form_filled', 'Form filled example'));
    }
  }
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const toVisit = [BASE_URL];
  const visited = new Set<string>();
  const shots: Shot[] = [];

  while (toVisit.length && visited.size < MAX_PAGES) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      shots.push(await screenshot(page, url, 'page', 'Landing on route'));

      const { anchors } = await discoverLinks(page);
      const interesting = anchors
        .filter(a => sameOrigin(a))
        .filter(a => !/[.#](png|jpg|jpeg|gif|pdf)$/i.test(a))
        .filter(a => !a.includes('logout'))
        .slice(0, 10);
      for (const href of interesting) if (!visited.has(href)) toVisit.push(href);

      await attemptCommonFlows(page, url, shots);
    } catch (e) {
      console.warn('Nav error:', url, e);
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(shots, null, 2));
  await browser.close();
  console.log(`Saved ${shots.length} screenshots to ${OUT_DIR}`);
})();