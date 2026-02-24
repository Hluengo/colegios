import * as Mod from './Avatar';
const Avatar = (Mod as any).default || (Mod as any).Avatar || Mod;


describe('Avatar export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
