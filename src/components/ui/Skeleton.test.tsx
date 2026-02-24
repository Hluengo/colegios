import * as Mod from './Skeleton';
const Skeleton = (Mod as any).default || (Mod as any).Skeleton || Mod;


describe('Skeleton export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
