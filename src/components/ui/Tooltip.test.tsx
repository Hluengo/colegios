import * as Mod from './Tooltip';
const Tooltip = (Mod as any).default || (Mod as any).Tooltip || Mod;


describe('Tooltip export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
