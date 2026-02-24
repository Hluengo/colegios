import * as Mod from './Modal';
const Modal = (Mod as any).default || (Mod as any).Modal || Mod;


describe('Modal export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
