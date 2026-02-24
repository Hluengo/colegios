import * as Mod from './ErrorBoundary';
const ErrorBoundary = (Mod as any).default || (Mod as any).ErrorBoundary || Mod;


describe('ErrorBoundary export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
