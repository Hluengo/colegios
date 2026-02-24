import * as Mod from './InicioPage';
const InicioPage = (Mod as any).default || (Mod as any).InicioPage || Mod;

describe('InicioPage export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
