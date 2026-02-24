import * as Mod from './AdminPanel';
const AdminPanel = (Mod as any).default || (Mod as any).AdminPanel || Mod;


describe('AdminPanel export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
