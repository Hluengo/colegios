import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'src');
const targetDirs = ['components', 'pages'];

function listTsxFiles(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  const files = [];
  function walk(p) {
    for (const name of fs.readdirSync(p)) {
      const fp = path.join(p, name);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) walk(fp);
      else if (stat.isFile() && name.endsWith('.tsx') && !name.endsWith('.test.tsx')) files.push(fp);
    }
  }
  walk(full);
  return files;
}

function createTestFor(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, '.tsx');
  const testPath = path.join(dir, `${base}.test.tsx`);
  if (fs.existsSync(testPath)) return false;
  const relImport = `./${base}`;
  const content = `import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ${base} from '${relImport}';

describe('${base} smoke', () => {
  it('renders without crashing', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <${base} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
});
`;
  fs.writeFileSync(testPath, content, 'utf8');
  return true;
}

let created = 0;
for (const dir of targetDirs) {
  const files = listTsxFiles(dir);
  for (const f of files) {
    try {
      const ok = createTestFor(f);
      if (ok) {
        console.log('Created test for', path.relative(process.cwd(), f));
        created++;
      }
    } catch (err) {
      console.error('Error creating test for', f, err);
    }
  }
}
console.log('Total tests created:', created);
process.exit(0);
