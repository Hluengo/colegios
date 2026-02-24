import { describe, expect, it } from 'vitest';
import { diffDays, haceXDiasLabel, parseLocalDate, toStartOfDay } from './dateUtils';
import { formatDate } from './formatDate';

describe('dateUtils', () => {
  it('toStartOfDay truncates time to local midnight', () => {
    const out = toStartOfDay(new Date(2024, 0, 15, 14, 45, 30));
    expect(out?.getHours()).toBe(0);
    expect(out?.getMinutes()).toBe(0);
    expect(out?.getSeconds()).toBe(0);
    expect(out?.getMilliseconds()).toBe(0);
  });

  it('parseLocalDate parses YYYY-MM-DD as local date', () => {
    const out = parseLocalDate('2024-01-15');
    expect(out).not.toBeNull();
    expect(out?.getFullYear()).toBe(2024);
    expect(out?.getMonth()).toBe(0);
    expect(out?.getDate()).toBe(15);
  });

  it('parseLocalDate returns null for invalid values', () => {
    expect(parseLocalDate('not-a-date')).toBeNull();
    expect(parseLocalDate(new Date('bad-date'))).toBeNull();
  });

  it('diffDays returns whole day difference', () => {
    const from = new Date(2024, 0, 1, 10, 0);
    const to = new Date(2024, 0, 10, 8, 0);
    expect(diffDays(from, to)).toBe(9);
  });

  it('diffDays returns null for invalid input', () => {
    expect(diffDays(null, new Date())).toBeNull();
    expect(diffDays('bad-date', new Date())).toBeNull();
  });

  it('haceXDiasLabel handles edge values', () => {
    expect(haceXDiasLabel(null)).toBeNull();
    expect(haceXDiasLabel(0)).toBe('hoy');
    expect(haceXDiasLabel(1)).toBe('hace 1 día');
    expect(haceXDiasLabel(7)).toBe('hace 7 días');
  });
});

describe('formatDate', () => {
  it('returns em dash when empty', () => {
    expect(formatDate('')).toBe('—');
  });

  it('returns original value when date cannot be parsed', () => {
    expect(formatDate('invalid-date-value')).toBe('invalid-date-value');
  });

  it('formats valid date and optionally includes time', () => {
    const dateOnly = formatDate('2024-01-15');
    expect(dateOnly).toMatch(/2024/);

    const withTime = formatDate(new Date(2024, 0, 15, 9, 30), true);
    expect(withTime).toMatch(/2024/);
    expect(withTime).toMatch(/\d{2}:\d{2}/);
  });
});
