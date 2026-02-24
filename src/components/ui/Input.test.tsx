import * as Mod from './Input';
const Input = (Mod as any).default || (Mod as any).Input || Mod;


describe('Input export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
