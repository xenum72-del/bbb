// scripts/generate-docs.ts
import fs from 'fs';
import path from 'path';

const MAP_FILE = 'autoshots.map.json';
const DOCS_DIR = path.resolve('docs/docs');
const OUT_FILE = path.join(DOCS_DIR, 'product-tour.md');
const IMG_BASE = '/img/autoshots';

type Shot = { url: string; title: string; file: string; notes?: string };

function groupByRoute(shots: Shot[]) {
  const groups: Record<string, Shot[]> = {};
  for (const s of shots) {
    const u = new URL(s.url);
    const key = u.pathname || '/';
    (groups[key] ||= []).push(s);
  }
  return groups;
}

function esc(s: string) {
  // Keep titles safe inside MDX/admonitions
  return s.replace(/[<>{}]/g, m => ({'<':'&lt;','>':'&gt;','{':'&#123;','}':'&#125;'}[m]!));
}

(async () => {
  const raw = fs.readFileSync(MAP_FILE, 'utf8');
  const shots: Shot[] = raw ? JSON.parse(raw) : [];
  const grouped = groupByRoute(shots);

  const md: string[] = [];
  md.push('# Product Tour');
  md.push('');
  md.push('_Auto-generated from the app at build time. Each section shows key UI states the crawler discovered._');
  md.push('');

  const routes = Object.keys(grouped).sort();
  for (const route of routes) {
    const items = grouped[route];
    md.push(`## ${route}`);
    md.push('');
    const hero = items[0];
    if (hero) {
      md.push(`**Route:** \`${route}\`  \n**Title:** ${esc(hero.title)}`);
      md.push('');
    }

    for (const s of items) {
      const title = esc(s.title + (s.notes ? ` — ${s.notes}` : ''));
      md.push(`:::details ${title}`);
      md.push('');
      md.push(`**URL:** ${s.url}`);
      md.push('');
      md.push(`![${esc(s.title)}](${IMG_BASE}/${s.file})`);
      md.push('');
      md.push(':::');
      md.push('');
    }
  }

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, md.join('\n'));
  console.log(`Wrote ${OUT_FILE}`);
})();