import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      // NOSONAR: Using Math.random() for test UUID generation is acceptable in test environment
      randomUUID: () => `test-${Math.random().toString(36).substring(2, 15)}`, // NOSONAR
    },
    writable: true,
  });
}

globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
