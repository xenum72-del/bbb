import fs from 'fs';
import path from 'path';

const MAP_FILE = 'autoshots.map.json';
const DOCS_DIR = path.resolve('docs/docs');
const IMG_BASE = '/img/autoshots';

type Shot = { url: string; title: string; file: string; notes?: string };

function groupByRoute(shots: Shot[]) {
  const groups: Record<string, Shot[]> = {};
  for (const s of shots) {
    const u = new URL(s.url);
    const key = u.pathname || '/';
    groups[key] = groups[key] || [];
    groups[key].push(s);
  }
  return groups;
}

(async () => {
  const shots: Shot[] = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  const grouped = groupByRoute(shots);

  const md: string[] = [];
  md.push(`# Product Tour`);
  md.push('');
  md.push(`_Auto-generated from the app at build time. Each section shows key UI states the crawler discovered._`);
  md.push('');

  for (const [route, items] of Object.entries(grouped).sort()) {
    md.push(`## ${route}`);
    md.push('');
    const hero = items[0];
    if (hero) {
      md.push(`**Route:** \`${route}\`  \n**Title:** ${hero.title}`);
      md.push('');
    }
    for (const s of items) {
      md.push(`<details><summary>${s.title}${s.notes ? ` — ${s.notes}` : ''}</summary>`);
      md.push('');
      md.push(`**URL:** ${s.url}`);
      md.push('');
      md.push(`![${s.title}](${IMG_BASE}/${s.file})`);
      md.push('');
      md.push(`</details>`);
      md.push('');
    }
  }

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  const outFile = path.join(DOCS_DIR, 'product-tour.md');
  fs.writeFileSync(outFile, md.join('\n'));
  console.log(`Wrote ${outFile}`);
})();