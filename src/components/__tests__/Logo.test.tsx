import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Logo from '../Logo';

describe('Logo', () => {
  it('renders svg with provided size and className', () => {
    const { container } = render(<Logo size={48} className="my-logo" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('48');
    expect(svg?.getAttribute('height')).toBe('48');
    expect(svg?.classList.contains('my-logo')).toBe(true);
  });
});
