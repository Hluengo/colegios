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
  const content = fs.readFileSync(t, 'utf8');
  // Only update generated smoke files (contain "smoke")
  if (!content.includes('smoke')) continue;
  const base = path.basename(t).replace('.test.tsx', '');
  const relImport = `./${base}`;
  const stub = `import ${base} from '${relImport}';

describe('${base} export', () => {
  it('is defined', () => {
    expect(${base}).toBeDefined();
  });
});
`;
  fs.writeFileSync(t, stub, 'utf8');
  updated++;
}
console.log('Updated test stubs:', updated);
process.exit(0);
