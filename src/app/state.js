import { createContext, createElement, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  fetchIncidents,
  fetchIncidentById,
  postIncidentAction,
  openWarRoomSession,
  fetchWarRoomMessages,
  postWarRoomMessage,
  authStartGoogle as apiAuthStartGoogle,
  authFetchMe as apiAuthFetchMe,
  authVerifyTotp as apiAuthVerifyTotp,
  authLogout as apiAuthLogout,
  fetchRecentTraffic,
  fetchPacketDetail,
  createIncidentFromPacket,
} from './api.js';

const AppStateContext = createContext(null);
const AppActionsContext = createContext(null);

const STORAGE_KEY = 'ids-settings';

const defaultSettings = {
  apiBaseUrl: '',
  theme: 'auto',
  notifications: true,
  severityThresholds: {
    critica: 90,
    alta: 70,
    media: 45,
    baja: 20,
  },
};

function loadStoredSettings() {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch (error) {
    console.warn('Failed to parse settings from storage', error);
    return defaultSettings;
  }
}

const initialState = {
  settings: defaultSettings,
  incidents: [],
  selectedIncident: null,
  toasts: [],
  warRooms: {},
  loading: {
    incidents: false,
    incident: false,
    warRoom: false,
  },
  auth: {
    user: null,
    loading: false,
    error: null,
    mfaRequired: false,
    mfaTicket: null,
  },
  traffic: {
    packets: [],
    pendingPackets: [],
    selectedPacketId: null,
    mode: 'ws',
    paused: false,
    pollingInterval: 2000,
    bufferSize: 600,
    lastTimestamp: null,
    filters: {
      protocol: 'ALL',
      severity: 'ALL',
      search: '',
    },
    selectedIp: null,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'settings/loaded': {
      return { ...state, settings: action.payload };
    }
    case 'settings/saved': {
      return { ...state, settings: action.payload };
    }
    case 'incidents/loading': {
      return { ...state, loading: { ...state.loading, incidents: action.payload } };
    }
    case 'incidents/loaded': {
      return { ...state, incidents: action.payload };
    }
    case 'incident/loading': {
      return { ...state, loading: { ...state.loading, incident: action.payload } };
    }
    case 'incident/loaded': {
      return { ...state, selectedIncident: action.payload };
    }
    case 'incident/updated': {
      const { incident } = action.payload;
      const updatedIncidents = state.incidents.map((item) =>
        item.id === incident.id ? { ...item, ...incident } : item,
      );
      const selected =
        state.selectedIncident && state.selectedIncident.id === incident.id
          ? { ...state.selectedIncident, ...incident }
          : state.selectedIncident;
      return { ...state, incidents: updatedIncidents, selectedIncident: selected };
    }
    case 'warroom/loading': {
      return { ...state, loading: { ...state.loading, warRoom: action.payload } };
    }
    case 'warroom/loaded': {
      return {
        ...state,
        warRooms: {
          ...state.warRooms,
          [action.payload.id]: action.payload,
        },
      };
    }
    case 'warroom/messages': {
      const { id, messages } = action.payload;
      const existing = state.warRooms[id] || { id, messages: [] };
      return {
        ...state,
        warRooms: {
          ...state.warRooms,
          [id]: { ...existing, messages },
        },
      };
    }
    case 'warroom/checklist': {
      const { id, checklist } = action.payload;
      const existing = state.warRooms[id] || { id };
      return {
        ...state,
        warRooms: {
          ...state.warRooms,
          [id]: { ...existing, checklist },
        },
      };
    }
    case 'auth/loading': {
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: action.payload,
          error: action.payload ? null : state.auth.error,
        },
      };
    }
    case 'auth/error': {
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: action.payload,
        },
      };
    }
    case 'auth/success': {
      return {
        ...state,
        auth: {
          user: action.payload,
          loading: false,
          error: null,
          mfaRequired: false,
          mfaTicket: null,
        },
      };
    }
    case 'auth/mfa': {
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: null,
          mfaRequired: true,
          mfaTicket: action.payload.ticket,
        },
      };
    }
    case 'auth/logout': {
      return {
        ...state,
        auth: {
          user: null,
          loading: false,
          error: null,
          mfaRequired: false,
          mfaTicket: null,
        },
      };
    }
    case 'traffic/append': {
      const { packets, lastTimestamp } = action.payload;
      const combined = [...state.traffic.packets, ...packets];
      const trimmed = combined.slice(-state.traffic.bufferSize);
      return {
        ...state,
        traffic: {
          ...state.traffic,
          packets: trimmed,
          lastTimestamp,
        },
      };
    }
    case 'traffic/pending': {
      const pending = [...state.traffic.pendingPackets, ...action.payload.packets].slice(-state.traffic.bufferSize);
      return {
        ...state,
        traffic: {
          ...state.traffic,
          pendingPackets: pending,
        },
      };
    }
    case 'traffic/flush': {
      const combined = [...state.traffic.packets, ...state.traffic.pendingPackets];
      const trimmed = combined.slice(-state.traffic.bufferSize);
      return {
        ...state,
        traffic: {
          ...state.traffic,
          packets: trimmed,
          pendingPackets: [],
          lastTimestamp: action.payload?.lastTimestamp || state.traffic.lastTimestamp,
        },
      };
    }
    case 'traffic/select': {
      return {
        ...state,
        traffic: {
          ...state.traffic,
          selectedPacketId: action.payload.packetId,
          selectedIp: action.payload.ip || state.traffic.selectedIp,
        },
      };
    }
    case 'traffic/filters': {
      return {
        ...state,
        traffic: {
          ...state.traffic,
          filters: { ...state.traffic.filters, ...action.payload },
        },
      };
    }
    case 'traffic/mode': {
      return {
        ...state,
        traffic: {
          ...state.traffic,
          mode: action.payload,
        },
      };
    }
    case 'traffic/polling': {
      return {
        ...state,
        traffic: {
          ...state.traffic,
          pollingInterval: action.payload,
        },
      };
    }
    case 'traffic/paused': {
      return {
        ...state,
        traffic: {
          ...state.traffic,
          paused: action.payload,
        },
      };
    }
    case 'traffic/link': {
      const { packetId, incidentId, severity } = action.payload;
      const packets = state.traffic.packets.map((packet) =>
        packet.id === packetId ? { ...packet, incidentId, severity: severity || packet.severity } : packet,
      );
      const pendingPackets = state.traffic.pendingPackets.map((packet) =>
        packet.id === packetId ? { ...packet, incidentId, severity: severity || packet.severity } : packet,
      );
      const incidents = state.incidents.map((incident) =>
        incident.id === incidentId ? { ...incident, linkedPacketId: packetId } : incident,
      );
      return {
        ...state,
        incidents,
        traffic: {
          ...state.traffic,
          packets,
          pendingPackets,
        },
      };
    }
    case 'traffic/buffer-size': {
      return {
        ...state,
        traffic: {
          ...state.traffic,
          bufferSize: action.payload,
          packets: state.traffic.packets.slice(-action.payload),
          pendingPackets: state.traffic.pendingPackets.slice(-action.payload),
        },
      };
    }
    case 'traffic/ip-filter': {
      return {
        ...state,
        traffic: {
          ...state.traffic,
          selectedIp: action.payload,
        },
      };
    }
    case 'toast/added': {
      return { ...state, toasts: [...state.toasts, action.payload] };
    }
    case 'toast/dismissed': {
      return { ...state, toasts: state.toasts.filter((item) => item.id !== action.payload) };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (base) => ({
    ...base,
    settings: loadStoredSettings(),
  }));

  const cacheRef = useRef({
    incidentDetails: new Map(),
    warRooms: new Map(),
  });

  useEffect(() => {
    dispatch({ type: 'settings/loaded', payload: loadStoredSettings() });
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const { theme } = state.settings;
    const root = document.documentElement;
    root.dataset.theme = theme;
  }, [state.settings.theme]);

  const actions = useMemo(() => {
    const dismissToast = (id) => {
      dispatch({ type: 'toast/dismissed', payload: id });
    };

    const addToast = ({ title, description, tone = 'info' }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      dispatch({ type: 'toast/added', payload: { id, title, description, tone } });
      window.setTimeout(() => dismissToast(id), 4000);
    };

    const loadIncidents = async (filters = {}) => {
      dispatch({ type: 'incidents/loading', payload: true });
      try {
        const incidents = await fetchIncidents(filters, state.settings.apiBaseUrl);
        dispatch({ type: 'incidents/loaded', payload: incidents });
        incidents.forEach((incident) => {
          cacheRef.current.incidentDetails.set(incident.id, incident);
        });
        return incidents;
      } catch (error) {
        addToast({
          title: 'Error al cargar incidentes',
          description: error.message || 'Intenta nuevamente más tarde.',
          tone: 'danger',
        });
        return [];
      } finally {
        dispatch({ type: 'incidents/loading', payload: false });
      }
    };

    const loadIncidentById = async (id) => {
      dispatch({ type: 'incident/loading', payload: true });
      try {
        if (cacheRef.current.incidentDetails.has(id)) {
          const cached = cacheRef.current.incidentDetails.get(id);
          dispatch({ type: 'incident/loaded', payload: cached });
          return cached;
        }
        const incident = await fetchIncidentById(id, state.settings.apiBaseUrl);
        cacheRef.current.incidentDetails.set(id, incident);
        dispatch({ type: 'incident/loaded', payload: incident });
        return incident;
      } catch (error) {
        addToast({
          title: 'No se pudo cargar el incidente',
          description: error.message || 'Revisa la conexión al backend.',
          tone: 'danger',
        });
        return null;
      } finally {
        dispatch({ type: 'incident/loading', payload: false });
      }
    };

    const updateIncidentStatus = async (id, actionKey) => {
      try {
        const incident = await postIncidentAction(id, actionKey, state.settings.apiBaseUrl);
        cacheRef.current.incidentDetails.set(id, incident);
        dispatch({ type: 'incident/updated', payload: { incident } });
        addToast({
          title: 'Estado actualizado',
          description: `El incidente ${id} ha sido actualizado.`,
          tone: 'success',
        });
        return incident;
      } catch (error) {
        addToast({
          title: 'No se pudo actualizar',
          description: error.message || 'Intenta nuevamente.',
          tone: 'danger',
        });
        throw error;
      }
    };

    const openWarRoom = async (id) => {
      dispatch({ type: 'warroom/loading', payload: true });
      try {
        let existing = cacheRef.current.warRooms.get(id);
        if (!existing) {
          for (const value of cacheRef.current.warRooms.values()) {
            if (value.incidentId === id) {
              existing = value;
              break;
            }
          }
        }
        if (existing) {
          dispatch({ type: 'warroom/loaded', payload: existing });
          return existing;
        }
        const warRoom = await openWarRoomSession(id, state.settings.apiBaseUrl);
        cacheRef.current.warRooms.set(warRoom.id, warRoom);
        dispatch({ type: 'warroom/loaded', payload: warRoom });
        return warRoom;
      } catch (error) {
        addToast({
          title: 'No se pudo abrir la mesa de trabajo',
          description: error.message || 'Intenta más tarde.',
          tone: 'danger',
        });
        throw error;
      } finally {
        dispatch({ type: 'warroom/loading', payload: false });
      }
    };

    const loadWarRoomMessages = async (warRoomId) => {
      try {
        const messages = await fetchWarRoomMessages(warRoomId, state.settings.apiBaseUrl);
        dispatch({ type: 'warroom/messages', payload: { id: warRoomId, messages } });
        const cached = cacheRef.current.warRooms.get(warRoomId) || { id: warRoomId };
        cacheRef.current.warRooms.set(warRoomId, { ...cached, messages });
        return messages;
      } catch (error) {
        addToast({
          title: 'No se pudieron actualizar los mensajes',
          description: error.message || 'Revisa la API.',
          tone: 'warn',
        });
        return [];
      }
    };

    const sendWarRoomMessage = async (warRoomId, content) => {
      try {
        const { userMessage, assistantMessage } = await postWarRoomMessage(
          warRoomId,
          { role: 'user', content },
          state.settings.apiBaseUrl,
        );
        const existing = cacheRef.current.warRooms.get(warRoomId) || { id: warRoomId, messages: [] };
        const updatedMessages = [...(existing.messages || []), userMessage];
        if (assistantMessage) {
          updatedMessages.push(assistantMessage);
        }
        cacheRef.current.warRooms.set(warRoomId, { ...existing, messages: updatedMessages });
        dispatch({ type: 'warroom/messages', payload: { id: warRoomId, messages: updatedMessages } });
        return updatedMessages;
      } catch (error) {
        addToast({
          title: 'No se pudo enviar el mensaje',
          description: error.message || 'Intenta nuevamente.',
          tone: 'danger',
        });
        throw error;
      }
    };

    const updateWarRoomChecklist = (warRoomId, checklist) => {
      const existing = cacheRef.current.warRooms.get(warRoomId) || { id: warRoomId };
      const updated = { ...existing, checklist };
      cacheRef.current.warRooms.set(warRoomId, updated);
      dispatch({ type: 'warroom/checklist', payload: { id: warRoomId, checklist } });
    };

    const saveSettings = (updates) => {
      const next = { ...state.settings, ...updates };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      dispatch({ type: 'settings/saved', payload: next });
      addToast({
        title: 'Preferencias guardadas',
        description: 'Los cambios de configuración se aplicaron correctamente.',
        tone: 'success',
      });
      return next;
    };

    const authStartGoogle = async () => {
      dispatch({ type: 'auth/loading', payload: true });
      try {
        if (state.settings.apiBaseUrl) {
          const url = new URL('/auth/google/start', state.settings.apiBaseUrl);
          dispatch({ type: 'auth/loading', payload: false });
          window.location.href = url.toString();
          return { redirected: true };
        }
        await apiAuthStartGoogle(state.settings.apiBaseUrl);
        dispatch({ type: 'auth/loading', payload: false });
        addToast({
          title: 'OAuth simulado',
          description: 'Usa el código 123456 para completar el segundo factor en el entorno mock.',
          tone: 'info',
        });
        return { mock: true };
      } catch (error) {
        dispatch({ type: 'auth/error', payload: error.message });
        addToast({
          title: 'No se pudo iniciar sesión',
          description: error.message || 'Intenta nuevamente.',
          tone: 'danger',
        });
        throw error;
      }
    };

    const authHandleReturn = async () => {
      dispatch({ type: 'auth/loading', payload: true });
      try {
        const result = await apiAuthFetchMe(state.settings.apiBaseUrl);
        if (result && result.mfa_required && result.mfa_ticket) {
          dispatch({ type: 'auth/mfa', payload: { ticket: result.mfa_ticket } });
          addToast({
            title: 'Autenticación adicional requerida',
            description: 'Introduce el código de tu aplicación TOTP.',
            tone: 'warn',
          });
          return { mfaRequired: true, ticket: result.mfa_ticket };
        }
        if (result && result.id) {
          dispatch({ type: 'auth/success', payload: result });
          addToast({
            title: 'Sesión iniciada',
            description: `Bienvenido, ${result.name || result.email}`,
            tone: 'success',
          });
          return { user: result };
        }
        dispatch({ type: 'auth/logout' });
        return null;
      } catch (error) {
        dispatch({ type: 'auth/error', payload: error.message });
        addToast({
          title: 'No se pudo validar la sesión',
          description: error.message || 'Intenta iniciar nuevamente.',
          tone: 'danger',
        });
        return null;
      }
    };

    const authVerifyTotp = async (ticket, code) => {
      dispatch({ type: 'auth/loading', payload: true });
      try {
        await apiAuthVerifyTotp(ticket, code, state.settings.apiBaseUrl);
        const user = await apiAuthFetchMe(state.settings.apiBaseUrl);
        if (user && user.id) {
          dispatch({ type: 'auth/success', payload: user });
          addToast({
            title: 'TOTP verificado',
            description: 'Autenticación en dos pasos completada.',
            tone: 'success',
          });
          return { user };
        }
        dispatch({ type: 'auth/logout' });
        return null;
      } catch (error) {
        dispatch({ type: 'auth/error', payload: error.message });
        addToast({
          title: 'Código inválido',
          description: error.message || 'Revisa el código e intenta nuevamente.',
          tone: 'danger',
        });
        throw error;
      }
    };

    const authLogout = async () => {
      dispatch({ type: 'auth/loading', payload: true });
      try {
        await apiAuthLogout(state.settings.apiBaseUrl);
      } catch (error) {
        console.warn('Fallo al cerrar sesión en backend. Se limpiará el estado local.', error);
      } finally {
        dispatch({ type: 'auth/logout' });
        addToast({
          title: 'Sesión cerrada',
          description: 'Has cerrado sesión correctamente.',
          tone: 'info',
        });
      }
    };

    const appendTrafficBatch = (packets) => {
      if (!Array.isArray(packets) || !packets.length) return;
      const lastTimestamp = packets.reduce((max, packet) => {
        const ts = new Date(packet.timestamp).getTime();
        return ts > max ? ts : max;
      }, state.traffic.lastTimestamp || 0);
      if (state.traffic.paused) {
        dispatch({ type: 'traffic/pending', payload: { packets } });
      } else {
        dispatch({ type: 'traffic/append', payload: { packets, lastTimestamp } });
      }
    };

    const flushTrafficQueue = () => {
      dispatch({ type: 'traffic/flush', payload: { lastTimestamp: Date.now() } });
    };

    const selectTrafficPacket = (packetId, ip) => {
      dispatch({ type: 'traffic/select', payload: { packetId, ip } });
      if (ip) {
        dispatch({ type: 'traffic/ip-filter', payload: ip });
      }
    };

    const setTrafficFilters = (filters) => {
      dispatch({ type: 'traffic/filters', payload: filters });
    };

    const setTrafficMode = (mode) => {
      dispatch({ type: 'traffic/mode', payload: mode });
    };

    const setTrafficPollingInterval = (interval) => {
      dispatch({ type: 'traffic/polling', payload: interval });
    };

    const setTrafficPaused = (paused) => {
      dispatch({ type: 'traffic/paused', payload: paused });
      if (!paused && state.traffic.pendingPackets.length) {
        flushTrafficQueue();
      }
    };

    const setTrafficBufferSize = (size) => {
      dispatch({ type: 'traffic/buffer-size', payload: size });
    };

    const setTrafficIpFilter = (ip) => {
      dispatch({ type: 'traffic/ip-filter', payload: ip });
    };

    const linkPacketToIncident = (packetId, incidentId, severity) => {
      if (incidentId && cacheRef.current.incidentDetails.has(incidentId)) {
        const cached = cacheRef.current.incidentDetails.get(incidentId);
        cacheRef.current.incidentDetails.set(incidentId, { ...cached, linkedPacketId: packetId });
      }
      dispatch({ type: 'traffic/link', payload: { packetId, incidentId, severity } });
    };

    const loadPacketDetail = async (packetId) => {
      try {
        const detail = await fetchPacketDetail(packetId, state.settings.apiBaseUrl);
        return detail;
      } catch (error) {
        addToast({
          title: 'No se pudo obtener el detalle del paquete',
          description: error.message || 'Intenta nuevamente.',
          tone: 'danger',
        });
        throw error;
      }
    };

    const requestRecentTraffic = async ({ since, limit }) => {
      try {
        const packets = await fetchRecentTraffic({ since, limit }, state.settings.apiBaseUrl);
        return packets;
      } catch (error) {
        addToast({
          title: 'No se pudo actualizar el tráfico',
          description: error.message || 'Revisa la conexión al backend.',
          tone: 'warn',
        });
        throw error;
      }
    };

    const createIncidentFromPacketAction = async ({ packetId, reason, severity }) => {
      try {
        const result = await createIncidentFromPacket({ packetId, reason, severity }, state.settings.apiBaseUrl);
        linkPacketToIncident(packetId, result.incidentId, severity);
        addToast({
          title: 'Incidente generado',
          description: `Se creó el incidente ${result.incidentId} a partir del paquete seleccionado.`,
          tone: 'success',
        });
        return result;
      } catch (error) {
        addToast({
          title: 'No se pudo crear el incidente',
          description: error.message || 'Intenta nuevamente.',
          tone: 'danger',
        });
        throw error;
      }
    };

    return {
      addToast,
      dismissToast,
      loadIncidents,
      loadIncidentById,
      updateIncidentStatus,
      openWarRoom,
      loadWarRoomMessages,
      sendWarRoomMessage,
      updateWarRoomChecklist,
      saveSettings,
      authStartGoogle,
      authHandleReturn,
      authVerifyTotp,
      authLogout,
      appendTrafficBatch,
      flushTrafficQueue,
      selectTrafficPacket,
      setTrafficFilters,
      setTrafficMode,
      setTrafficPollingInterval,
      setTrafficPaused,
      setTrafficBufferSize,
      setTrafficIpFilter,
      linkPacketToIncident,
      loadPacketDetail,
      requestRecentTraffic,
      createIncidentFromPacketAction,
    };
  }, [state.settings, state.traffic, state.incidents]);

  return createElement(
    AppStateContext.Provider,
    { value: state },
    createElement(AppActionsContext.Provider, { value: actions }, children),
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState debe usarse dentro de AppProvider');
  }
  return context;
}

export function useAppActions() {
  const context = useContext(AppActionsContext);
  if (!context) {
    throw new Error('useAppActions debe usarse dentro de AppProvider');
  }
  return context;
}
