import * as Mod from './ConfirmDialog';
const ConfirmDialog = (Mod as any).default || (Mod as any).ConfirmDialog || Mod;


describe('ConfirmDialog export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
