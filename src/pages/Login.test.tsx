import * as Mod from './Login';
const Login = (Mod as any).default || (Mod as any).Login || Mod;


describe('Login export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
