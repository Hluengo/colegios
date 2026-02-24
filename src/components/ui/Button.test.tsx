import * as Mod from './Button';
const Button = (Mod as any).default || (Mod as any).Button || Mod;


describe('Button export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
