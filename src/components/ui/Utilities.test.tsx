import * as Mod from './Utilities';
const Utilities = (Mod as any).default || (Mod as any).Utilities || Mod;


describe('Utilities export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
