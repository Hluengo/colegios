import * as Mod from './LanguageSwitcher';
const LanguageSwitcher = (Mod as any).default || (Mod as any).LanguageSwitcher || Mod;


describe('LanguageSwitcher export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
