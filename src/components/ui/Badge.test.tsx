import * as Mod from './Badge';
const Badge = (Mod as any).default || (Mod as any).Badge || Mod;


describe('Badge export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
