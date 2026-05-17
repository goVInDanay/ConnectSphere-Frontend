import '@testing-library/jest-dom';

// ── Browser globals Jest/jsdom doesn't provide ────────────────────────────────

// matchMedia — needed by components that call window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// IntersectionObserver — used by virtualized lists and lazy-load images
class MockIntersectionObserver {
  observe    = jest.fn();
  unobserve  = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// ResizeObserver — used by layout components
class MockResizeObserver {
  observe    = jest.fn();
  unobserve  = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// scrollTo — no-op; jsdom doesn't implement scroll
window.scrollTo = jest.fn();

// localStorage — jsdom provides it but we ensure a clean slate per test
beforeEach(() => {
  localStorage.clear();
  jest.clearAllTimers();
});

// Suppress noisy console.error from expected React errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Re-throw real errors; swallow React act() / prop-type warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('act('))
    ) {
      return;
    }
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
