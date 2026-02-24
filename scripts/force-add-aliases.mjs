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
  const importRegex = /import \* as Mod from '\.\/([\w-]+)';/g;
  let m;
  let newContent = content;
  while ((m = importRegex.exec(content)) !== null) {
    const base = m[1];
    const aliasLine = `const ${base} = (Mod as any).default || (Mod as any).${base} || Mod;\n`;
    if (!content.includes(aliasLine)) {
      // insert alias line after the import statement
      newContent = newContent.replace(m[0], m[0] + '\n' + aliasLine);
      updated++;
    }
  }
  if (newContent !== content) fs.writeFileSync(t, newContent, 'utf8');
}
console.log('Force-added aliases to tests:', updated);
process.exit(0);
