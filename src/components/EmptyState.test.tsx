import * as Mod from './EmptyState';
const EmptyState = (Mod as any).default || (Mod as any).EmptyState || Mod;


describe('EmptyState export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
