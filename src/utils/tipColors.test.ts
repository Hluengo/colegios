import {
  tipBadgeClasses,
  tipChipClasses,
  tipHeaderClasses,
  TIP_COLORS,
} from './tipColors';

describe('tipColors utilities', () => {
  it('returns correct badge classes for known tips', () => {
    expect(tipBadgeClasses('Leve')).toContain('emerald');
    expect(tipBadgeClasses('Grave')).toContain('amber');
    expect(tipBadgeClasses('Muy Grave')).toContain('purple');
    expect(tipBadgeClasses('Gravísima')).toContain('red');
  });

  it('handles alternative spellings for Gravísima', () => {
    expect(tipBadgeClasses('Gravisima')).toContain('red');
    expect(tipBadgeClasses('Gravisimo')).toContain('red');
  });

  it('returns default badge for unknown tip', () => {
    expect(tipBadgeClasses('unknown')).toContain('slate');
    expect(tipBadgeClasses(null)).toContain('slate');
    expect(tipBadgeClasses(undefined)).toContain('slate');
  });

  it('chip classes follow expected families', () => {
    expect(tipChipClasses('Leve')).toContain('emerald');
    expect(tipChipClasses('Grave')).toContain('amber');
    expect(tipChipClasses('Muy Grave')).toContain('purple');
    expect(tipChipClasses('Gravísima')).toContain('red');
  });

  it('header classes return proper background and text for severity', () => {
    expect(tipHeaderClasses('Leve')).toContain('bg-emerald');
    expect(tipHeaderClasses('Grave')).toContain('bg-amber');
    expect(tipHeaderClasses('Muy Grave')).toContain('bg-violet');
    expect(tipHeaderClasses('Gravísima')).toContain('bg-red');
  });

  it('TIP_COLORS contains expected keys and shapes', () => {
    expect(TIP_COLORS).toHaveProperty('Leve');
    expect(TIP_COLORS.Leve).toHaveProperty('bg');
    expect(TIP_COLORS.Leve).toHaveProperty('text');
    expect(TIP_COLORS.Leve).toHaveProperty('border');
  });
});
