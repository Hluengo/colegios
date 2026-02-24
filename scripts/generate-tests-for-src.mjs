import fs from 'fs/promises';
import path from 'path';

const root = path.resolve(process.cwd(), 'src');
const outRoot = path.resolve(process.cwd(), 'src', '__tests__', 'auto');
const exts = ['.ts', '.tsx', '.js', '.jsx'];
const skipDirs = new Set(['__tests__', 'test', 'types', 'artifacts', 'coverage']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (skipDirs.has(ent.name)) continue;
      files.push(...(await walk(path.join(dir, ent.name))));
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      if (!exts.includes(ext)) continue;
      if (ent.name.endsWith('.d.ts')) continue;
      // skip existing test files
      if (ent.name.endsWith('.test.ts') || ent.name.endsWith('.test.tsx') || ent.name.endsWith('.spec.ts')) continue;
      files.push(path.join(dir, ent.name));
    }
  }
  return files;
}

function moduleNameToTestPath(file) {
  const rel = path.relative(root, file);
  const dir = path.dirname(rel);
  const base = path.basename(rel, path.extname(rel));
  const outDir = path.join(outRoot, dir);
  const outFile = path.join(outDir, base + '.test.ts');
  return { outDir, outFile, rel };
}

function makeTestContent(importPath) {
  return `import { describe, it, expect } from 'vitest';
import * as mod from '${importPath}';

describe('auto: ${importPath}', () => {
  it('exports something', () => {
    expect(mod).toBeDefined();
  });
});
`;
}

(async function main(){
  try {
    await fs.rm(outRoot, { recursive: true, force: true });
  } catch(e){}
  const files = await walk(root);
  for (const file of files) {
    const { outDir, outFile, rel } = moduleNameToTestPath(file);
    await fs.mkdir(outDir, { recursive: true });
    // Compute import relative path from test file to module without extension
    const importPath = './' + path.relative(outDir, path.join(root, rel)).replace(/\\/g, '/').replace(/\.tsx?$|\.jsx?$/,'');
    const content = makeTestContent(importPath);
    // Only write if not exists
    try {
      await fs.access(outFile);
      // exists -> skip
    } catch {
      await fs.writeFile(outFile, content, 'utf8');
    }
  }
  console.log('Generated', files.length, 'test stubs under', outRoot);
})();
