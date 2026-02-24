import { it, expect } from 'vitest';

it('main module can be imported when #root exists', async () => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  // dynamic import so we can prepare DOM before module executes
  const mod = await import('./main');
  expect(mod).toBeDefined();
});
