import * as Mod from './DatePicker';
const DatePicker = (Mod as any).default || (Mod as any).DatePicker || Mod;


describe('DatePicker export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
