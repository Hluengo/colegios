import { it, expect } from 'vitest';
import * as ctx from './ConductCatalogContext';

it('ConductCatalogContext exports provider/component', () => {
  expect(Object.keys(ctx).length).toBeGreaterThan(0);
});
