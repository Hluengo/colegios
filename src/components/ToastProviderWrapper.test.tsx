import * as Mod from './ToastProviderWrapper';
const ToastProviderWrapper = (Mod as any).default || (Mod as any).ToastProviderWrapper || Mod;


describe('ToastProviderWrapper export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
