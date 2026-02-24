import * as Mod from './Dashboard';
const Dashboard = (Mod as any).default || (Mod as any).Dashboard || Mod;


describe('Dashboard export', () => {
  it('is defined', () => {
    expect(Mod).toBeDefined();
  });
});
