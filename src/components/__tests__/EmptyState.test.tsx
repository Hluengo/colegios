import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmptyState, { EmptySearchState, EmptyCasesState } from '../EmptyState';

describe('EmptyState components', () => {
  it('renders title and description and button click works', () => {
    const onClick = vi.fn();
    const { getByText } = render(
      <EmptyState
        title="Nada"
        description="No hay nada"
        action={{ onClick }}
        actionLabel="Acción"
      />,
    );

    expect(getByText('Nada')).toBeTruthy();
    expect(getByText('No hay nada')).toBeTruthy();
    const btn = getByText('Acción');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it('EmptySearchState renders and calls onClear', () => {
    const onClear = vi.fn();
    const { getByText } = render(
      <MemoryRouter>
        <EmptySearchState onClear={onClear} />
      </MemoryRouter>,
    );
    const btn = getByText('Limpiar búsqueda');
    fireEvent.click(btn);
    expect(onClear).toHaveBeenCalled();
  });

  it('EmptyCasesState with filter shows clear action', () => {
    const onClearFilter = vi.fn();
    const { getByText } = render(
      <MemoryRouter>
        <EmptyCasesState filter="active" onClearFilter={onClearFilter} />
      </MemoryRouter>,
    );
    const btn = getByText('Limpiar filtro');
    fireEvent.click(btn);
    expect(onClearFilter).toHaveBeenCalled();
  });
});
