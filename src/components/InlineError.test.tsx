import * as Mod from './InlineError';
const InlineError = (Mod as any).default || (Mod as any).InlineError || Mod;


describe('InlineError export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
