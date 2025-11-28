import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setAuthToken,
  getAuthToken,
  authFetchMe,
  getIncidents,
  postIncidentWarRoom,
  uploadTrafficFile,
  connectAlertsWebSocket,
} from '../api.js';

describe('api.js - Funciones Críticas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it('setAuthToken/getAuthToken deben gestionar el token', () => {
    setAuthToken('test-token-123');
    expect(getAuthToken()).toBe('test-token-123');
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });

  it('authFetchMe debe obtener información del usuario', async () => {
    const mockUser = { email: 'test@test.com', role: 'ROLE_USER' };
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockUser,
    });

    setAuthToken('test-token');
    const result = await authFetchMe('http://localhost:8080');
    expect(result).toEqual(mockUser);
  });

  it('getIncidents debe retornar lista de incidentes', async () => {
    const mockIncidents = [{ id: 'INC-001', severity: 'critical' }];
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockIncidents,
    });

    setAuthToken('test-token');
    const result = await getIncidents({}, 'http://localhost:8080');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('alert-INC-001');
  });

  it('postIncidentWarRoom debe crear una reunión', async () => {
    const mockWarRoom = { id: 1, code: 'MEET-123' };
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockWarRoom,
    });

    setAuthToken('test-token');
    const result = await postIncidentWarRoom('INC-001', 'http://localhost:8080');
    expect(result.code).toBe('MEET-123');
  });

  it('uploadTrafficFile debe subir archivo', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    });

    setAuthToken('test-token');
    const file = new File(['content'], 'traffic.pcap', { type: 'application/octet-stream' });
    const result = await uploadTrafficFile(file, 'http://localhost:8080');
    expect(result.success).toBe(true);
  });

  it('connectAlertsWebSocket debe crear conexión', () => {
    const ws = connectAlertsWebSocket('http://localhost:8080');
    expect(ws).toBeDefined();
    expect(typeof ws.close).toBe('function');
  });

  it('debe manejar errores HTTP', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    setAuthToken('test-token');
    await expect(getIncidents({}, 'http://localhost:8080')).rejects.toThrow();
  });
});
