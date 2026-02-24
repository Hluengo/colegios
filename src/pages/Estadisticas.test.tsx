import * as Mod from './Estadisticas';
const Estadisticas = (Mod as any).default || (Mod as any).Estadisticas || Mod;


describe('Estadisticas export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
