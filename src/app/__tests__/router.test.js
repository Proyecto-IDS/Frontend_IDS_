import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRouteHash, navigate } from '../router.js';

// Mock de globalThis.window
beforeEach(() => {
  if (!globalThis.window) {
    globalThis.window = { location: { hash: '#/' } };
  }
  vi.clearAllMocks();
});

describe('router.js - getRouteHash', () => {
  it('debe generar hash para dashboard', () => {
    expect(getRouteHash('dashboard')).toBe('#/dashboard');
  });

  it('debe generar hash para incident con parámetros', () => {
    expect(getRouteHash('incident', { id: 'INC-001' })).toBe('#/incident/INC-001');
  });

  it('debe generar hash para war-room con parámetros', () => {
    expect(getRouteHash('war-room', { id: '123' })).toBe('#/war-room/123');
  });

  it('debe generar hash para settings', () => {
    expect(getRouteHash('settings')).toBe('#/settings');
  });

  it('debe generar hash por defecto para key desconocida', () => {
    expect(getRouteHash('unknown')).toBe('#/');
  });
});

describe('router.js - navigate', () => {
  it('debe cambiar el hash de la URL', () => {
    globalThis.window.location.hash = '#/';
    navigate('#/dashboard');
    expect(globalThis.window.location.hash).toBe('#/dashboard');
  });
});
