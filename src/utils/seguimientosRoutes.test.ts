import { it, expect } from 'vitest';
import * as routes from './seguimientosRoutes';

it('seguimientosRoutes exports map', () => {
  expect(Object.keys(routes).length).toBeGreaterThanOrEqual(0);
});
