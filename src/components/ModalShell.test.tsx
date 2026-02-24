import * as Mod from './ModalShell';
const ModalShell = (Mod as any).default || (Mod as any).ModalShell || Mod;


describe('ModalShell export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
