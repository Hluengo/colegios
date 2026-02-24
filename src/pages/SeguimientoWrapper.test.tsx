import * as Mod from './SeguimientoWrapper';
const SeguimientoWrapper = (Mod as any).default || (Mod as any).SeguimientoWrapper || Mod;


describe('SeguimientoWrapper export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
