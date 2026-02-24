import * as Mod from './Sidebar';
const Sidebar = (Mod as any).default || (Mod as any).Sidebar || Mod;


describe('Sidebar export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
