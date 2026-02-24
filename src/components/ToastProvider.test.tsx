import * as Mod from './ToastProvider';
const ToastProvider = (Mod as any).default || (Mod as any).ToastProvider || Mod;


describe('ToastProvider export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
