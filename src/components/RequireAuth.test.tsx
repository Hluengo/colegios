import * as Mod from './RequireAuth';
const RequireAuth = (Mod as any).default || (Mod as any).RequireAuth || Mod;


describe('RequireAuth export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
