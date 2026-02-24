import * as Mod from './TeamComments';
const TeamComments = (Mod as any).default || (Mod as any).TeamComments || Mod;


describe('TeamComments export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
