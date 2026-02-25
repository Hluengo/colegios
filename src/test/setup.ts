import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { logger } from '../utils/logger';

// Mock global de supabaseClient para evitar errores de configuración
// Import the full mock to ensure all exports are available
import { supabaseClientFullMock } from './supabaseMock';

vi.mock('../api/supabaseClient', () => supabaseClientFullMock);

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock de navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  configurable: true,
  get: () => true,
});

// Mock de IntersectionObserver
class MockIntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver as unknown as typeof IntersectionObserver,
});

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Silenciar errores de React Router en tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('act(...)'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  // Silenciar logger durante tests para evitar output ruidoso
  logger.debug = vi.fn();
  logger.info = vi.fn();
  logger.warn = vi.fn();
  logger.error = vi.fn();
  // Filtrar warnings/errores ruidosos conocidos (GoTrue, tenant missing, uploadEvidence)
  const originalWarn = console.warn;
  console.warn = (...args) => {
    try {
      const first = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0] || '');
      if (
        first.includes('Multiple GoTrueClient instances detected') ||
        first.includes('missing tenant_id') ||
        first.includes('uploadEvidenceFiles') ||
        first.includes('uploadEvidenceFiles - missing tenant_id')
      ) {
        return;
      }
    } catch (e) {
      // ignore
    }
    return originalWarn.call(console, ...args);
  };

  // Keep using the original top-level `originalError` to avoid recursive wrapping
  console.error = (...args) => {
    try {
      const first = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0] || '');
      if (first.includes('Multiple GoTrueClient instances detected')) return;
    } catch (e) {
      // ignore
    }
    return originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
