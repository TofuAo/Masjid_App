import '@testing-library/jest-dom';

// Mock localStorage (simple implementation for tests)
const localStorageMock = {
  store: {},
  getItem(key) { return this.store[key] ?? null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; },
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
