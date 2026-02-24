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
let updated = 0;
for (const t of tests) {
  let content = fs.readFileSync(t, 'utf8');
  const m = content.match(/import \* as Mod from '\.\/([\w-]+)';/);
  if (!m) continue;
  const base = m[1];
  // If the file uses JSX tag <Base or references Base in code, add alias line
  const usageRegex = new RegExp(`\<${base}(\s|>)`);
  const identifierRegex = new RegExp(`\b${base}\b`);
  if (usageRegex.test(content) || identifierRegex.test(content)) {
    // Check if alias already present
    if (!content.includes(`const ${base} = (Mod as any)`)) {
      const insertAfter = m[0] + '\n';
      const alias = `const ${base} = (Mod as any).default || (Mod as any).${base} || Mod;\n\n`;
      content = content.replace(m[0], m[0] + '\n' + alias);
      fs.writeFileSync(t, content, 'utf8');
      updated++;
    }
  }
}
console.log('Alias lines added to test files:', updated);
process.exit(0);
