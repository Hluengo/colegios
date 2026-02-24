import * as Mod from './Animations';
const Animations = (Mod as any).default || (Mod as any).Animations || Mod;


describe('Animations export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
