import * as Mod from './ProcesoVisualizer';
const ProcesoVisualizer = (Mod as any).default || (Mod as any).ProcesoVisualizer || Mod;


describe('ProcesoVisualizer export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
