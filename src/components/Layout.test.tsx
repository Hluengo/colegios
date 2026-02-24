import * as Mod from './Layout';
const Layout = (Mod as any).default || (Mod as any).Layout || Mod;


describe('Layout export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
