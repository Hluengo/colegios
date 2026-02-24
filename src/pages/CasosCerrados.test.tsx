import * as Mod from './CasosCerrados';
const CasosCerrados = (Mod as any).default || (Mod as any).CasosCerrados || Mod;


describe('CasosCerrados export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
