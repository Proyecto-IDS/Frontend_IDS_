import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement } from 'react';
import { AppProvider, useAppState, useAppActions, isAdmin } from '../state.js';

// Mock de api.js
vi.mock('../api.js', () => ({
  setAuthToken: vi.fn(),
  getIncidents: vi.fn().mockResolvedValue([
    { id: 'INC-001', severity: 'critical', status: 'no-conocido' },
  ]),
  getIncidentById: vi.fn().mockResolvedValue({
    id: 'INC-001',
    severity: 'critical',
    status: 'no-conocido',
  }),
  postIncidentAction: vi.fn().mockResolvedValue({
    id: 'INC-001',
    status: 'conocido',
  }),
  postIncidentWarRoom: vi.fn().mockResolvedValue({
    id: 1,
    warRoomId: 1,
    code: 'MEET-123',
  }),
  getMeetingDetails: vi.fn().mockResolvedValue({
    id: 1,
    code: 'MEET-123',
    status: 'ACTIVE',
  }),
  joinMeeting: vi.fn().mockResolvedValue({
    id: 1,
    code: 'MEET-123',
  }),
  leaveMeeting: vi.fn().mockResolvedValue({}),
  getWarRoomMessages: vi.fn().mockResolvedValue([]),
  postWarRoomMessage: vi.fn().mockResolvedValue({
    userMessage: { id: 1, role: 'user', content: 'test' },
    assistantMessage: null,
  }),
  authStartGoogle: vi.fn().mockResolvedValue({ token: 'test-token' }),
  authFetchMe: vi.fn().mockResolvedValue({ email: 'test@test.com', role: 'ROLE_USER' }),
  authLogout: vi.fn().mockResolvedValue({}),
  markIncidentAsResolved: vi.fn().mockResolvedValue({ success: true }),
  getResolvedIncidents: vi.fn().mockResolvedValue([]),
  connectAlertsWebSocket: vi.fn().mockReturnValue({ close: vi.fn() }),
}));

describe('state.js - isAdmin utility', () => {
  it('debe retornar true para usuario con rol ROLE_ADMIN', () => {
    expect(isAdmin({ role: 'ROLE_ADMIN' })).toBe(true);
  });

  it('debe retornar true para usuario con rol ADMIN', () => {
    expect(isAdmin({ role: 'ADMIN' })).toBe(true);
  });

  it('debe retornar true para usuario con authorities que contiene ROLE_ADMIN', () => {
    expect(isAdmin({ authorities: [{ authority: 'ROLE_ADMIN' }] })).toBe(true);
  });

  it('debe retornar false para usuario con rol ROLE_USER', () => {
    expect(isAdmin({ role: 'ROLE_USER' })).toBe(false);
  });

  it('debe retornar false para usuario sin rol', () => {
    expect(isAdmin({})).toBe(false);
  });

  it('debe retornar false para null', () => {
    expect(isAdmin(null)).toBe(false);
  });
});

describe('state.js - Hooks', () => {
  it('useAppState debe lanzar error fuera de AppProvider', () => {
    expect(() => {
      renderHook(() => useAppState());
    }).toThrow('useAppState debe usarse dentro de AppProvider');
  });

  it('useAppActions debe lanzar error fuera de AppProvider', () => {
    expect(() => {
      renderHook(() => useAppActions());
    }).toThrow('useAppActions debe usarse dentro de AppProvider');
  });

  it('useAppState debe retornar el estado dentro de AppProvider', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: ({ children }) => createElement(AppProvider, {}, children),
    });

    expect(result.current).toHaveProperty('incidents');
    expect(result.current).toHaveProperty('auth');
    expect(result.current).toHaveProperty('settings');
    expect(result.current).toHaveProperty('traffic');
  });

  it('useAppActions debe retornar las acciones dentro de AppProvider', () => {
    const { result } = renderHook(() => useAppActions(), {
      wrapper: ({ children }) => createElement(AppProvider, {}, children),
    });

    expect(result.current).toHaveProperty('loadIncidents');
    expect(result.current).toHaveProperty('loadIncidentById');
    expect(result.current).toHaveProperty('openWarRoom');
    expect(result.current).toHaveProperty('authLogout');
  });
});

describe('state.js - Toast Actions', () => {
  it('addToast debe agregar un toast al estado', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.addToast({
        title: 'Test Toast',
        description: 'Test Description',
        tone: 'success',
      });
    });

    expect(result.current.state.toasts).toHaveLength(1);
    expect(result.current.state.toasts[0].title).toBe('Test Toast');
    expect(result.current.state.toasts[0].tone).toBe('success');
  });
});

describe('state.js - Incident Actions', () => {
  it('clearSelectedIncident debe limpiar el incidente seleccionado', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    // Establecer un incidente seleccionado manualmente
    act(() => {
      result.current.actions.clearSelectedIncident();
    });

    expect(result.current.state.selectedIncident).toBeNull();
  });
});

describe('state.js - War Room Actions', () => {
  it('openWarRoom debe abrir/crear una reunión', async () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    let warRoom;
    await act(async () => {
      warRoom = await result.current.actions.openWarRoom('INC-001');
    });

    expect(warRoom).toBeDefined();
    expect(warRoom.id).toBe(1);
    expect(warRoom.code).toBe('MEET-123');
  });

  it('joinWarRoom debe unirse a una reunión con código', async () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    let warRoom;
    await act(async () => {
      warRoom = await result.current.actions.joinWarRoom('MEET-123');
    });

    expect(warRoom).toBeDefined();
    expect(warRoom.code).toBe('MEET-123');
  });

  it('loadWarRoomMessages debe cargar mensajes', async () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    await act(async () => {
      await result.current.actions.loadWarRoomMessages(1);
    });

    // Los mensajes se almacenan en warRooms[id].messages
    expect(result.current.state.warRooms[1]).toBeDefined();
  });

  it('sendWarRoomMessage debe enviar mensaje', async () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    let messages;
    await act(async () => {
      messages = await result.current.actions.sendWarRoomMessage(1, 'Hello');
    });

    expect(messages).toBeDefined();
    expect(Array.isArray(messages)).toBe(true);
  });

  // Test deshabilitado: la función updateWarRoomChecklist fue removida del código
  it.skip('updateWarRoomChecklist debe actualizar checklist', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    const checklist = [
      { id: 1, label: 'Item 1', done: false },
      { id: 2, label: 'Item 2', done: true },
    ];

    act(() => {
      result.current.actions.updateWarRoomChecklist(1, checklist);
    });

    expect(result.current.state.warRooms[1].checklist).toEqual(checklist);
  });
});

describe('state.js - Auth Actions', () => {
  it('authStartGoogle debe iniciar autenticación', async () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    await act(async () => {
      await result.current.actions.authStartGoogle();
    });

    // Verificar que se llamó a la función
    expect(result.current.state.auth.loading).toBe(false);
  });

  it('authLogout debe cerrar sesión', async () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    await act(async () => {
      await result.current.actions.authLogout();
    });

    expect(result.current.state.auth.user).toBeNull();
    expect(result.current.state.auth.token).toBeNull();
  });
});

describe('state.js - Settings Actions', () => {
  it('saveSettings debe guardar configuración', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.saveSettings({
        ...result.current.state.settings,
        theme: 'dark',
      });
    });

    expect(result.current.state.settings.theme).toBe('dark');
  });

  it('saveSettings debe normalizar apiBaseUrl vacío', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.saveSettings({
        ...result.current.state.settings,
        apiBaseUrl: '',
      });
    });

    expect(result.current.state.settings.apiBaseUrl).not.toBe('');
  });
});

describe('state.js - Traffic Actions', () => {
  it('appendTrafficBatch debe agregar paquetes', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    const packets = [
      { id: 'PKT-001', timestamp: '2025-11-26T10:00:00Z' },
      { id: 'PKT-002', timestamp: '2025-11-26T10:01:00Z' },
    ];

    act(() => {
      result.current.actions.appendTrafficBatch(packets);
    });

    expect(result.current.state.traffic.packets).toHaveLength(2);
    expect(result.current.state.traffic.packets[0].id).toBe('PKT-001');
  });

  it('selectTrafficPacket debe seleccionar un paquete', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.selectTrafficPacket('PKT-001', '192.168.1.1'); // NOSONAR: Test data only
    });

    expect(result.current.state.traffic.selectedPacketId).toBe('PKT-001');
    expect(result.current.state.traffic.selectedIp).toBe('192.168.1.1'); // NOSONAR: Test data only
  });

  it('setTrafficFilters debe actualizar filtros', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.setTrafficFilters({
        protocol: 'TCP',
        severity: 'high',
      });
    });

    expect(result.current.state.traffic.filters.protocol).toBe('TCP');
    expect(result.current.state.traffic.filters.severity).toBe('high');
  });

  it('setTrafficPaused debe pausar/reanudar tráfico', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.setTrafficPaused(true);
    });

    expect(result.current.state.traffic.paused).toBe(true);

    act(() => {
      result.current.actions.setTrafficPaused(false);
    });

    expect(result.current.state.traffic.paused).toBe(false);
  });

  it('linkPacketToIncident debe vincular paquete a incidente', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    // Primero agregar un paquete
    act(() => {
      result.current.actions.appendTrafficBatch([
        { id: 'PKT-001', timestamp: '2025-11-26T10:00:00Z' },
      ]);
    });

    // Luego vincularlo
    act(() => {
      result.current.actions.linkPacketToIncident('PKT-001', 'INC-001', 'critical');
    });

    const packet = result.current.state.traffic.packets.find(p => p.id === 'PKT-001');
    expect(packet.incidentId).toBe('INC-001');
  });

  it('flushTrafficQueue debe mover paquetes pendientes a activos', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    // Pausar tráfico
    act(() => {
      result.current.actions.setTrafficPaused(true);
    });

    // Agregar paquetes (irán a pendientes)
    act(() => {
      result.current.actions.appendTrafficBatch([
        { id: 'PKT-001', timestamp: '2025-11-26T10:00:00Z' },
      ]);
    });

    expect(result.current.state.traffic.pendingPackets).toHaveLength(1);
    expect(result.current.state.traffic.packets).toHaveLength(0);

    // Hacer flush
    act(() => {
      result.current.actions.flushTrafficQueue();
    });

    expect(result.current.state.traffic.packets).toHaveLength(1);
    expect(result.current.state.traffic.pendingPackets).toHaveLength(0);
  });
});

describe('state.js - Resolved Incidents', () => {
  it('loadResolvedIncidents debe cargar incidentes resueltos', async () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    await act(async () => {
      await result.current.actions.loadResolvedIncidents();
    });

    expect(result.current.state.loading.incidents).toBe(false);
  });
});

describe('state.js - Estado Inicial', () => {
  it('debe tener estado inicial correcto', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: ({ children }) => createElement(AppProvider, {}, children),
    });

    expect(result.current.incidents).toEqual([]);
    expect(result.current.selectedIncident).toBeNull();
    expect(result.current.toasts).toEqual([]);
    expect(result.current.auth.user).toBeNull();
    expect(result.current.traffic.packets).toEqual([]);
    expect(result.current.traffic.paused).toBe(false);
  });

  it('debe tener configuración por defecto', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: ({ children }) => createElement(AppProvider, {}, children),
    });

    expect(result.current.settings).toHaveProperty('theme');
    expect(result.current.settings).toHaveProperty('apiBaseUrl');
    expect(result.current.settings).toHaveProperty('severityThresholds');
  });
});

describe('state.js - Incident Actions', () => {
  it('loadIncidents debe cargar lista de incidentes', async () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    await act(async () => {
      await result.current.actions.loadIncidents();
    });

    expect(result.current.state.incidents).toBeDefined();
    expect(result.current.state.loading.incidents).toBe(false);
  });

  it('updateIncidentStatus debe actualizar estado de incidente', async () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    await act(async () => {
      await result.current.actions.updateIncidentStatus('INC-001', 'conocido');
    });

    expect(result.current.state.loading.incident).toBe(false);
  });

  it('debe manejar errores al cargar incidentes', async () => {
    const { getIncidents } = await import('../api.js');
    getIncidents.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    await act(async () => {
      await result.current.actions.loadIncidents();
    });

    expect(result.current.state.loading.incidents).toBe(false);
  });
});

describe('state.js - Traffic Filters', () => {
  it('debe aplicar filtros de severidad', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.setTrafficFilters({ severity: 'high' });
    });

    expect(result.current.state.traffic.filters.severity).toBe('high');
  });

  it('debe aplicar filtros de protocolo', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.setTrafficFilters({ protocol: 'TCP' });
    });

    expect(result.current.state.traffic.filters.protocol).toBe('TCP');
  });

  it('debe aplicar múltiples filtros', () => {
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.setTrafficFilters({ 
        severity: 'critical',
        protocol: 'HTTP',
        source: '192.168.1.1' // NOSONAR: Test data only
      });
    });

    expect(result.current.state.traffic.filters.severity).toBe('critical');
    expect(result.current.state.traffic.filters.protocol).toBe('HTTP');
    expect(result.current.state.traffic.filters.source).toBe('192.168.1.1'); // NOSONAR: Test data only
  });
});

describe('state.js - Toast Management', () => {
  it('debe remover toast después de timeout', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(
      () => ({ state: useAppState(), actions: useAppActions() }),
      { wrapper: ({ children }) => createElement(AppProvider, {}, children) }
    );

    act(() => {
      result.current.actions.addToast({
        title: 'Test',
        description: 'Test toast',
        tone: 'info',
      });
    });

    expect(result.current.state.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.state.toasts).toHaveLength(0);
    
    vi.useRealTimers();
  });
});
