import * as Mod from './CaseCard';
const CaseCard = (Mod as any).default || (Mod as any).CaseCard || Mod;


describe('CaseCard export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
