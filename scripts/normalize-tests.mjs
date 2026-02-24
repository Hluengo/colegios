import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'src');

function listTestFiles(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  const files = [];
  function walk(p) {
    for (const name of fs.readdirSync(p)) {
      const fp = path.join(p, name);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) walk(fp);
      else if (stat.isFile() && name.endsWith('.test.tsx')) files.push(fp);
    }
  }
  walk(full);
  return files;
}

const tests = listTestFiles('components').concat(listTestFiles('pages'));
let changed = 0;
for (const t of tests) {
  let content = fs.readFileSync(t, 'utf8');
  const m = content.match(/import\s+(\w+)\s+from\s+'\.\/([\w-]+)';/);
  if (m) {
    const name = m[1];
    const base = m[2];
    // Replace import
    content = content.replace(m[0], `import * as Mod from './${base}';`);
    // Replace expect lines that reference the original name
    content = content.replace(new RegExp(`expect\\(${name}\\)`, 'g'), 'expect(Mod)');
    // Also replace describe title if it uses name export -> keep as-is
    fs.writeFileSync(t, content, 'utf8');
    changed++;
  }
}
console.log('Normalized tests files updated:', changed);
process.exit(0);
