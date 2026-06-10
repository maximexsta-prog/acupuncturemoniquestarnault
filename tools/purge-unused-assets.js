// Deletes files under wp-content/ and wp-includes/ that no HTML page (or any
// CSS/JS file reachable from one) references. Run from the repo root:
//   node tools/purge-unused-assets.js          (dry run — lists what would be kept/deleted)
//   node tools/purge-unused-assets.js --delete
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCOPES = ['wp-content', 'wp-includes'];
const DELETE = process.argv.includes('--delete');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    e.isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

const norm = (p) => p.replace(/\\/g, '/').replace(/^\/+/, '').split(/[?#]/)[0];

// 1. Seed: every wp-content/wp-includes URL mentioned in any HTML file.
const htmlFiles = walk(ROOT).filter((f) => f.endsWith('.html') && !f.includes(path.sep + '.git' + path.sep));
const refRe = /(?:wp-content|wp-includes)\/[^"'\s)\\<>?#&;]+/g;
// inline scripts embed asset URLs as entity-escaped JSON ("&quot;...\/file.jpg&quot;")
const decode = (s) => s.replace(/&quot;/g, '"').replace(/\\\//g, '/');
const keep = new Set();
const queue = [];
for (const f of htmlFiles) {
  for (const m of decode(fs.readFileSync(f, 'utf8')).match(refRe) || []) {
    const p = norm(m);
    if (!keep.has(p)) { keep.add(p); queue.push(p); }
  }
}

// 2. Transitive closure: CSS url()/@import and string literals in JS that
//    point back into wp-content/wp-includes.
while (queue.length) {
  const rel = queue.pop();
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  if (!/\.(css|js)$/.test(rel)) continue;
  const src = decode(fs.readFileSync(abs, 'utf8'));
  const found = new Set();
  // absolute refs
  for (const m of src.match(refRe) || []) found.add(norm(m));
  // webpack lazy chunks (see elementor webpack.runtime.min.js) load siblings at runtime
  if (rel.endsWith('.js')) {
    for (const m of src.matchAll(/["']([A-Za-z0-9_.-]+\.bundle\.min\.js)["']/g)) {
      found.add(norm(path.posix.join(path.posix.dirname(rel), m[1])));
    }
  }
  // relative url(...) in CSS, resolved against the file's directory
  if (rel.endsWith('.css')) {
    for (const m of src.matchAll(/url\(\s*['"]?([^'")?#]+)/g)) {
      const t = m[1];
      if (/^(data:|https?:|\/\/)/.test(t)) continue;
      const resolved = norm(path.posix.normalize(path.posix.join(path.posix.dirname(rel), t)));
      if (SCOPES.some((s) => resolved.startsWith(s + '/'))) found.add(resolved);
    }
  }
  for (const p of found) if (!keep.has(p)) { keep.add(p); queue.push(p); }
}

// 3. Delete everything in scope that isn't kept.
let kept = 0, removed = 0, keptBytes = 0, removedBytes = 0;
for (const scope of SCOPES) {
  for (const abs of walk(path.join(ROOT, scope))) {
    const rel = norm(path.relative(ROOT, abs));
    const size = fs.statSync(abs).size;
    if (keep.has(rel)) { kept++; keptBytes += size; continue; }
    removed++; removedBytes += size;
    if (DELETE) fs.unlinkSync(abs);
    else console.log('DELETE', rel);
  }
  if (DELETE) {
    // prune empty directories bottom-up
    const dirs = [];
    (function collect(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) collect(path.join(d, e.name));
      dirs.push(d);
    })(path.join(ROOT, scope));
    for (const d of dirs) if (fs.readdirSync(d).length === 0) fs.rmdirSync(d);
  }
}
console.log(`kept ${kept} files (${(keptBytes / 1e6).toFixed(1)} MB), ${DELETE ? 'deleted' : 'would delete'} ${removed} files (${(removedBytes / 1e6).toFixed(1)} MB)`);
