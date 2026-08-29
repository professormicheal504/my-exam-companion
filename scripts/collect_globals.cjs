const fs = require('fs');
const path = require('path');
const results = new Set();

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    if (!f.endsWith('.html')) continue;
    const content = fs.readFileSync(full, 'utf8');
    const matches = [...content.matchAll(/on[a-z]+=["']([^"']+)["']/g)];
    for (const m of matches) {
      const fns = [...m[1].matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g)];
      for (const fn of fns) results.add(fn[1]);
    }
  }
}

walk('public');
console.log(JSON.stringify([...results].sort(), null, 2));
