import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
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
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
class WebSocketMock {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.();
    }, 0);
  }
  send() {}
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  addEventListener(event, handler) {
    this[`on${event}`] = handler;
  }
  removeEventListener() {}
}
global.WebSocket = WebSocketMock;
