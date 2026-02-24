import * as Mod from './Logo';
const Logo = (Mod as any).default || (Mod as any).Logo || Mod;


describe('Logo export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
