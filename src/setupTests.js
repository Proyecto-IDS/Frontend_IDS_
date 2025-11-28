import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080');
vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
globalThis.localStorage = localStorageMock;

// Mock fetch
globalThis.fetch = vi.fn();

// Mock WebSocket
class WebSocketMock {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    // NOSONAR: setTimeout is safe in test environment for simulating async WebSocket connection
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.();
    }, 0);
  }
  send() {
    // Mock implementation
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  addEventListener(event, handler) {
    this[`on${event}`] = handler;
  }
  removeEventListener(event, handler) {
    // Mock implementation for removing event listeners
  }
}
globalThis.WebSocket = WebSocketMock;
