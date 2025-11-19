import { createContext, createElement, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  authStartGoogle as authStartGoogleApi,
  authFetchMe as authFetchMeApi,
  authFetchSessionStatus as authFetchSessionStatusApi,
  authVerifyTotp as authVerifyTotpApi,
  authLogout as authLogoutApi,
  getIncidents,
  getIncidentById,
  postIncidentAction,
  postIncidentFromPacket,
  postIncidentWarRoom,
  getMeetingDetails,
  joinMeeting,
  getWarRoomMessages,
  postWarRoomMessage as apiPostWarRoomMessage,
  getTrafficRecent,
  getTrafficPacketById,
  connectAlertsWebSocket,
  markIncidentAsResolved,
  setAuthToken,
} from './api.js';

const AppStateContext = createContext(null);
const AppActionsContext = createContext(null);
const USE_MOCKS = import.meta?.env?.VITE_USE_MOCKS === 'true';
const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.trim();
};

const shouldUseMock = (baseUrl) => {
  const normalized = normalizeBaseUrl(baseUrl);
  return USE_MOCKS || !normalized;
};

const envApiBaseUrl = normalizeBaseUrl(import.meta?.env?.VITE_API_BASE_URL);
const DEFAULT_API_BASE_URL = envApiBaseUrl || 'http://localhost:8080';

const STORAGE_KEY = 'ids-settings';
const AUTH_STORAGE_KEY = 'ids-auth';

const defaultSettings = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
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
  // Prefer globalThis over window for SSR safety
  if (!globalThis?.localStorage) return defaultSettings;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    const merged = { ...defaultSettings, ...parsed };
    // Ensure apiBaseUrl is never empty
    merged.apiBaseUrl = normalizeBaseUrl(merged.apiBaseUrl) || defaultSettings.apiBaseUrl;
    if (
      merged.apiBaseUrl === 'http://localhost:4000' &&
      defaultSettings.apiBaseUrl !== 'http://localhost:4000'
    ) {
      merged.apiBaseUrl = defaultSettings.apiBaseUrl;
    }
    // Extra safety: if apiBaseUrl is still empty, use default
    if (!merged.apiBaseUrl || merged.apiBaseUrl.trim() === '') {
      merged.apiBaseUrl = defaultSettings.apiBaseUrl;
    }
    return merged;
  } catch (error) {
    console.warn('[state] Failed to load stored settings, using defaults:', error?.message);
    return defaultSettings;
  }
}

function loadStoredAuth() {
  if (!globalThis?.localStorage) {
    return { token: null, user: null };
  }
  try {
    const raw = globalThis.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { token: null, user: null };
    }
    
    // Try to parse as JSON first (for backwards compatibility)
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') {
        return { token: parsed, user: null };
      } else if (typeof parsed?.token === 'string') {
        return { token: parsed.token, user: parsed.user || null };
      }
    } catch (parseError) {
      console.warn('[state] Failed to parse stored auth JSON, using raw token string:', parseError?.message);
    }
    
    // Treat as direct token string
    return { token: raw, user: null };
  } catch (error) {
    console.warn('[state] Failed to load stored auth, clearing token:', error?.message);
    return { token: null, user: null };
  }
}

const persistAuthState = (authState) => {
  if (!globalThis?.localStorage) return;
  try {
    if (authState.token) {
      globalThis.localStorage.setItem(AUTH_STORAGE_KEY, authState.token);
    } else {
      globalThis.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[state] Failed to persist auth state:', error?.message);
  }
};

const clearAuthState = () => {
  if (!globalThis?.localStorage) return;
  try {
    globalThis.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn('[state] Failed to clear auth state:', error?.message);
  }
};

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
    token: null,
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
    bufferSize: 500,
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
    case 'settings/loaded':
    case 'settings/saved': {
      return { ...state, settings: action.payload };
    }
    case 'incidents/loading': {
      return { ...state, loading: { ...state.loading, incidents: action.payload } };
    }
    case 'incidents/loaded': {
      return { ...state, incidents: action.payload };
    }
    case 'incidents/append-or-update': {
      // Append new incident or update existing one
      const { incident } = action.payload;
      const existingIndex = state.incidents.findIndex(inc => inc.id === incident.id);
      
      if (existingIndex >= 0) {
        // Update existing: move to top and update fields
        const updated = state.incidents.map((inc, idx) =>
          idx === existingIndex ? { ...inc, ...incident } : inc
        );
        // Move updated incident to the top
        const [moved] = updated.splice(existingIndex, 1);
        return { ...state, incidents: [moved, ...updated] };
      } else {
        // Prepend new incident
        return { ...state, incidents: [incident, ...state.incidents] };
      }
    }
    case 'incident/loading': {
      return { ...state, loading: { ...state.loading, incident: action.payload } };
    }
    case 'incident/loaded': {
      // Update both selectedIncident and the incident in the incidents array
      const updatedIncidents = state.incidents.map((item) =>
        item.id === action.payload.id ? action.payload : item,
      );
      return { 
        ...state, 
        selectedIncident: action.payload,
        incidents: updatedIncidents
      };
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
    case 'incident/cleared': {
      return { ...state, selectedIncident: null };
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
          user: action.payload.user,
          token: action.payload.token ?? state.auth.token,
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
          token: null,
          loading: false,
          error: null,
          mfaRequired: false,
          mfaTicket: null,
        },
        incidents: [],
        selectedIncident: null,
        alerts: {
          items: [],
          count: 0,
          loading: false,
        },
        warRoom: {
          id: null,
          code: null,
          participants: [],
          messages: [],
          checklist: [],
          loading: false,
        },
        traffic: {
          ...state.traffic,
          packets: [],
          pendingPackets: [],
          lastTimestamp: 0,
          paused: false,
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
  const [state, dispatch] = useReducer(reducer, initialState, (base) => {
    const storedSettings = loadStoredSettings();
    const storedAuth = loadStoredAuth();
    if (storedAuth.token) {
      setAuthToken(storedAuth.token);
    }
    return {
      ...base,
      settings: storedSettings,
      auth: {
        ...base.auth,
        token: storedAuth.token,
        user: storedAuth.user,
      },
    };
  });

  const cacheRef = useRef({
    incidentDetails: new Map(),
    warRooms: new Map(),
    notifiedAlertIds: new Set(), // Rastrear qué alertas ya fueron notificadas
  });

  const socketRef = useRef(null);

  useEffect(() => {
    dispatch({ type: 'settings/loaded', payload: loadStoredSettings() });
  }, []);

  // Store baseUrl and token in refs to avoid recreating WebSocket on every state change
  const baseUrlRef = useRef(state.settings.apiBaseUrl);
  const tokenRef = useRef(state.auth.token);
  
  useEffect(() => {
    baseUrlRef.current = state.settings.apiBaseUrl;
  }, [state.settings.apiBaseUrl]);
  
  useEffect(() => {
    tokenRef.current = state.auth.token;
  }, [state.auth.token]);

  // Connect to alerts WebSocket for real-time alerts and meeting events
  useEffect(() => {
    const baseUrl = baseUrlRef.current;
    const token = tokenRef.current;
    
    // Solo conectar si hay baseUrl Y token (usuario autenticado)
    if (!baseUrl || !token) {
      return;
    }

    // Helper: show toast notification
    const showToast = (title, description, tone) => {
      const id = crypto.randomUUID();
      dispatch({ type: 'toast/added', payload: { id, title, description, tone } });
      globalThis.setTimeout(() => dispatch({ type: 'toast/dismissed', payload: id }), 4000);
    };

    // Helper: determine severity tone
    const getSeverityTone = (severity) => {
      const severityLower = (severity || '').toLowerCase();
      return ['critica', 'critical', 'alta', 'high'].includes(severityLower) ? 'danger' : 'warn';
    };

    // Handler: new alert
    const handleNewAlert = (alert) => {
      const incidentId = alert.incidentId || `alert-${alert.id}`;
      const alertKey = `${incidentId}-${alert.timestamp}`;
      
      const incident = {
        id: incidentId,
        source: alert.packetId,
        severity: alert.severity,
        createdAt: alert.timestamp,
        detection: {
          model_version: alert.modelVersion || alert.model_version,
          model_score: alert.score,
        },
        status: 'no-conocido',
        type: 'alert',
        _from: 'websocket',
        linkedPacketId: alert.packetId,
      };
      
      dispatch({
        type: 'incidents/append-or-update',
        payload: { incident },
      });

      if (!cacheRef.current.notifiedAlertIds.has(alertKey)) {
        cacheRef.current.notifiedAlertIds.add(alertKey);
        showToast(
          'Nueva alerta detectada',
          `Severidad ${alert.severity || 'media'} detectada en paquete ${alert.packetId}`,
          getSeverityTone(alert.severity)
        );
      }
    };

    // Handler: war room created
    const handleWarRoomCreated = (incidentId, warRoom) => {
      dispatch({
        type: 'incident/updated',
        payload: {
          incident: {
            id: incidentId,
            warRoomId: warRoom.id,
          },
        },
      });

      cacheRef.current.warRooms.set(warRoom.id, warRoom);
      dispatch({ type: 'warroom/loaded', payload: warRoom });

      showToast(
        'Reunión creada',
        `Se creó una reunión para el incidente ${incidentId}. Código: ${warRoom.code}`,
        'info'
      );
    };

    // Helper: find incident by war room ID
    const findIncidentId = (warRoomId) => {
      if (state.selectedIncident?.warRoomId === warRoomId) {
        return state.selectedIncident.id;
      }
      return state.incidents.find(inc => inc.warRoomId === warRoomId)?.id || null;
    };

    // Helper: reload single incident
    const reloadIncident = async (incidentId) => {
      try {
        cacheRef.current.incidentDetails.delete(incidentId);
        console.log('Reloading incident from backend:', incidentId);
        const updatedIncident = await getIncidentById(incidentId, baseUrl);
        console.log('Updated incident data:', updatedIncident);
        
        if (updatedIncident) {
          cacheRef.current.incidentDetails.set(incidentId, updatedIncident);
          dispatch({ 
            type: 'incident/updated',
            payload: { incident: updatedIncident }
          });
          
          if (state.selectedIncident?.id === incidentId) {
            dispatch({ 
              type: 'incident/selected', 
              payload: updatedIncident
            });
          }
          console.log('State updated with resolved incident data');
        }
      } catch (error) {
        console.error('Error reloading incident after resolution:', error);
      }
    };

    // Helper: reload all incidents
    const reloadAllIncidents = async () => {
      try {
        cacheRef.current.incidentDetails.clear();
        const incidents = await getIncidents({}, baseUrl);
        dispatch({ type: 'incidents/loaded', payload: incidents });
        console.log('All incidents reloaded after meeting resolution');
      } catch (error) {
        console.error('Error reloading incidents list:', error);
      }
    };

    // Handler: war room resolved
    const handleWarRoomResolved = async (warRoomId) => {
      console.log('WARROOM RESOLVED EVENT RECEIVED IN STATE:', 'warroom.resolved', { warRoomId });
      
      const targetIncidentId = findIncidentId(warRoomId);
      console.log('Target incident found:', targetIncidentId, 'Current state:', {
        selectedIncident: state.selectedIncident?.id,
        incidentsCount: state.incidents?.length
      });

      if (targetIncidentId) {
        await reloadIncident(targetIncidentId);
      }
      await reloadAllIncidents();
    };

    // Helper: update participant emails
    const updateParticipantEmails = (existingEmails, action, userEmail) => {
      const emails = Array.isArray(existingEmails) ? [...existingEmails] : [];
      
      if (action === 'joined' && !emails.includes(userEmail)) {
        emails.push(userEmail);
      } else if (action === 'left') {
        return emails.filter(e => e !== userEmail);
      }
      return emails;
    };

    // Handler: war room participants
    const handleWarRoomParticipants = ({ warRoomId, currentParticipantCount, action, userEmail }) => {
      const existing = cacheRef.current.warRooms.get(warRoomId);
      if (!existing) return;

      const updated = {
        ...existing,
        currentParticipantCount,
      };
      
      if (userEmail) {
        updated.participantEmails = updateParticipantEmails(existing.participantEmails, action, userEmail);
      }
      
      cacheRef.current.warRooms.set(warRoomId, updated);
      dispatch({ type: 'warroom/loaded', payload: updated });
    };

    // Handler: war room duration
    const handleWarRoomDuration = ({ warRoomId, currentDurationSeconds }) => {
      const existing = cacheRef.current.warRooms.get(warRoomId);
      if (!existing) return;

      const updated = {
        ...existing,
        currentDurationSeconds,
      };
      
      cacheRef.current.warRooms.set(warRoomId, updated);
      dispatch({ type: 'warroom/loaded', payload: updated });
    };

    // Main event handler
    const handleAlertEvent = async (type, payload) => {
      if (type === 'alert' && payload?.alert) {
        handleNewAlert(payload.alert);
      } else if (type === 'warroom.created' && payload?.incidentId && payload?.warRoom) {
        handleWarRoomCreated(payload.incidentId, payload.warRoom);
      } else if (type === 'warroom.resolved' && payload?.warRoomId) {
        await handleWarRoomResolved(payload.warRoomId);
      } else if (type === 'warroom.participants' && payload?.warRoomId) {
        handleWarRoomParticipants(payload);
      } else if (type === 'warroom.duration' && payload?.warRoomId) {
        handleWarRoomDuration(payload);
      }
    };

    socketRef.current = connectAlertsWebSocket(baseUrl, handleAlertEvent, {
      onOpen: () => {
        // Connected to alerts WebSocket
      },
      onClose: () => {
        // Disconnected from alerts WebSocket
      },
      onError: (error) => {
        // Error connecting to alerts WebSocket
      },
    });

    return () => {
      socketRef.current?.close();
    };
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const { theme } = state.settings;
    const root = document.documentElement;
    root.dataset.theme = theme;
  }, [state.settings.theme]);

  useEffect(() => {
    setAuthToken(state.auth.token);
  }, [state.auth.token]);

  const actions = useMemo(() => {
    const dismissToast = (id) => {
      dispatch({ type: 'toast/dismissed', payload: id });
    };

    const addToast = ({ title, description, tone = 'info' }) => {
      const id = crypto.randomUUID();
      dispatch({ type: 'toast/added', payload: { id, title, description, tone } });
      globalThis.setTimeout(() => dismissToast(id), 4000);
    };

    const handleAuthSuccess = (token, user, toastOptions) => {
      const payload = { token, user };
      persistAuthState(payload);
      setAuthToken(token);
      dispatch({ type: 'auth/success', payload });
      if (toastOptions) {
        addToast(toastOptions);
      }
      return payload;
    };

    // Helper: check if incident is WebSocket-only
    const isWebSocketOnly = (incident, apiAlerts) => {
      return incident.type === 'alert' && 
             incident._from === 'websocket' && 
             !apiAlerts.some(apiAlert => apiAlert.id === incident.id);
    };

    // Helper: merge API and WebSocket incidents
    const mergeIncidents = (apiIncidents, existingIncidents) => {
      const apiAlerts = apiIncidents.map(incident => ({
        ...incident,
        type: 'alert',
        _from: 'api'
      }));
      
      const wsOnlyAlerts = existingIncidents.filter(inc => isWebSocketOnly(inc, apiAlerts));
      
      return [...apiAlerts, ...wsOnlyAlerts];
    };

    // Helper: try fallback incidents load
    const tryFallbackIncidents = async (filters, existingIncidents) => {
      if (USE_MOCKS) return [];
      
      try {
        const fallback = await getIncidents(filters, '');
        const merged = mergeIncidents(fallback, existingIncidents);
        dispatch({ type: 'incidents/loaded', payload: merged });
        return merged;
      } catch (fallbackError) {
        console.warn('[state] Fallback incidents load failed:', fallbackError?.message);
        return [];
      }
    };

    const loadIncidents = async (filters = {}) => {
      dispatch({ type: 'incidents/loading', payload: true });
      try {
        const incidents = await getIncidents(filters, state.settings.apiBaseUrl);
        const merged = mergeIncidents(incidents, state.incidents);
        
        dispatch({ type: 'incidents/loaded', payload: merged });
        incidents.forEach((incident) => {
          cacheRef.current.incidentDetails.set(incident.id, incident);
        });
  
        return merged;
      } catch (error) {
        addToast({
          title: 'Error al conectar con incidentes',
          description: error.message || 'Intenta nuevamente más tarde.',
          tone: 'danger',
        });
        
        return await tryFallbackIncidents(filters, state.incidents);
      } finally {
        dispatch({ type: 'incidents/loading', payload: false });
      }
    };

    // Helper: try fallback incident load
    const tryFallbackIncident = async (id) => {
      if (USE_MOCKS) return null;
      
      try {
        const fallback = await getIncidentById(id, '');
        cacheRef.current.incidentDetails.set(id, fallback);
        dispatch({ type: 'incident/loaded', payload: fallback });
        return fallback;
      } catch (fallbackError) {
        console.warn('[state] Fallback incident load failed:', fallbackError?.message);
        return null;
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
        const incident = await getIncidentById(id, state.settings.apiBaseUrl);
        cacheRef.current.incidentDetails.set(id, incident);
        dispatch({ type: 'incident/loaded', payload: incident });
        return incident;
      } catch (error) {
        addToast({
          title: 'No se pudo cargar el incidente',
          description: error.message || 'Revisa la conexión al backend.',
          tone: 'danger',
        });
        
        return await tryFallbackIncident(id);
      } finally {
        dispatch({ type: 'incident/loading', payload: false });
      }
    };

    const updateIncidentStatus = async (id, actionKey) => {
      try {
        let incident = null;
        
        // Handle special case for marking as resolved
        if (actionKey === 'mark_contained') {
          // Verificar que el usuario sea administrador
          const isAdmin = state.auth?.user?.role?.includes('ADMIN') || state.auth?.user?.roles?.includes('ADMIN');
          if (!isAdmin) {
            throw new Error('Solo los administradores pueden marcar incidentes como contenidos');
          }
          
          // Get the current incident to find the warRoomId (meetingId)
          const currentIncident = await getIncidentById(id, state.settings.apiBaseUrl);
          if (!currentIncident?.warRoomId) {
            throw new Error('No se encontró la reunión asociada al incidente');
          }
          
          // Mark the meeting as resolved
          await markIncidentAsResolved(currentIncident.warRoomId, state.settings.apiBaseUrl);
          
          // Reload the incident data from backend to get updated meeting information
          incident = await getIncidentById(id, state.settings.apiBaseUrl);
          
          addToast({
            title: 'Incidente contenido',
            description: `El incidente ${id} ha sido marcado como resuelto.`,
            tone: 'success',
          });
        } else {
          incident = await postIncidentAction(id, { action: actionKey }, state.settings.apiBaseUrl);
          addToast({
            title: 'Estado actualizado',
            description: `El incidente ${id} ha sido actualizado.`,
            tone: 'success',
          });
        }
        
        cacheRef.current.incidentDetails.set(id, incident);
        dispatch({ type: 'incident/updated', payload: { incident } });
        return incident;
      } catch (error) {
        addToast({
          title: 'No se pudo actualizar',
          description: error.message || 'Intenta nuevamente.',
          tone: 'danger',
        });
        if (!USE_MOCKS) {
          try {
            const fallback = await postIncidentAction(id, { action: actionKey }, '');
            cacheRef.current.incidentDetails.set(id, fallback);
            dispatch({ type: 'incident/updated', payload: { incident: fallback } });
            return fallback;
          } catch (fallbackError) {
            console.warn('[state] Fallback incident status update failed:', fallbackError?.message);
          }
        }
        throw error;
      }
    };

    // Helper: find war room in cache
    const findWarRoomInCache = (id) => {
      let existing = cacheRef.current.warRooms.get(id);
      if (existing) return existing;
      
      for (const value of cacheRef.current.warRooms.values()) {
        if (value.incidentId === id) {
          return value;
        }
      }
      return null;
    };

    // Helper: fetch existing meeting
    const fetchExistingMeeting = async (id) => {
      if (Number.isNaN(id)) return null;
      
      try {
        const meetingDetails = await getMeetingDetails(id, state.settings.apiBaseUrl);
        return {
          id: meetingDetails.id,
          warRoomId: meetingDetails.id,
          incidentId: id,
          ...meetingDetails
        };
      } catch (detailsError) {
        console.warn('[state] Failed to fetch existing meeting details:', detailsError?.message);
        return null;
      }
    };

    // Helper: get full meeting details
    const getFullMeetingDetails = async (meetingId) => {
      try {
        return await getMeetingDetails(meetingId, state.settings.apiBaseUrl);
      } catch (detailsError) {
        console.warn('[state] Failed to fetch full meeting details:', detailsError?.message);
        return null;
      }
    };

    // Helper: reload incident after war room creation
    const reloadIncidentAfterWarRoom = async (id) => {
      try {
        const updatedIncident = await getIncidentById(id, state.settings.apiBaseUrl);
        dispatch({ type: 'incident/loaded', payload: updatedIncident });
      } catch (reloadError) {
        console.warn('[state] Failed to reload incident after war room creation:', reloadError?.message);
      }
    };

    // Helper: create new war room
    const createNewWarRoom = async (id) => {
      const response = await postIncidentWarRoom(id, state.settings.apiBaseUrl);
      const meetingId = response.id || response.warRoomId;
      
      const fullDetails = await getFullMeetingDetails(meetingId);
      
      const warRoom = {
        id: meetingId,
        warRoomId: meetingId,
        incidentId: id,
        ...(fullDetails || response)
      };
      
      await reloadIncidentAfterWarRoom(id);
      
      return warRoom;
    };

    // Helper: try fallback war room
    const tryFallbackWarRoom = async (id) => {
      if (USE_MOCKS) return null;
      
      try {
        const fallbackResponse = await postIncidentWarRoom(id, '');
        const fallbackId = fallbackResponse.id || fallbackResponse.warRoomId;
        return {
          id: fallbackId,
          warRoomId: fallbackId,
          incidentId: id,
          ...fallbackResponse
        };
      } catch (fallbackError) {
        console.warn('Fallback war room failed', fallbackError);
        return null;
      }
    };

    const openWarRoom = async (id) => {
      dispatch({ type: 'warroom/loading', payload: true });
      try {
        const existing = findWarRoomInCache(id);
        if (existing) {
          dispatch({ type: 'warroom/loaded', payload: existing });
          return existing;
        }

        let warRoom = await fetchExistingMeeting(id);
        
        if (!warRoom) {
          warRoom = await createNewWarRoom(id);
        }

        cacheRef.current.warRooms.set(warRoom.id, warRoom);
        dispatch({ type: 'warroom/loaded', payload: warRoom });
        return warRoom;
      } catch (error) {
        addToast({
          title: 'No se pudo abrir la mesa de trabajo',
          description: error.message || 'Intenta más tarde.',
          tone: 'danger',
        });
        
        const fallback = await tryFallbackWarRoom(id);
        if (fallback) {
          cacheRef.current.warRooms.set(fallback.id, fallback);
          dispatch({ type: 'warroom/loaded', payload: fallback });
          return fallback;
        }
        
        throw error;
      } finally {
        dispatch({ type: 'warroom/loading', payload: false });
      }
    };

    const loadWarRoomMessages = async (warRoomId) => {
      try {
        const messages = await getWarRoomMessages(warRoomId, state.settings.apiBaseUrl);
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
        if (!USE_MOCKS) {
          return [];
        }
        throw error;
      }
    };

    const joinWarRoom = async (code) => {
      dispatch({ type: 'warroom/loading', payload: true });
      try {
        const response = await joinMeeting(code, state.settings.apiBaseUrl);
        const meetingId = response.id || response.warRoomId;
        
        // Obtener detalles completos de la reunión
        let fullDetails = response;
        try {
          fullDetails = await getMeetingDetails(meetingId, state.settings.apiBaseUrl);
        } catch (detailsError) {
          console.warn('Could not fetch full meeting details:', detailsError);
        }
        
        const warRoom = {
          id: meetingId,
          warRoomId: meetingId,
          code: code,
          ...fullDetails
        };
        cacheRef.current.warRooms.set(warRoom.id, warRoom);
        dispatch({ type: 'warroom/loaded', payload: warRoom });
        return warRoom;
      } catch (error) {
        // Add logging & classification
        console.warn('[state] Failed to join war room:', error?.message);
        // Flag error as already logged so caller can avoid duplicate toasts
        if (error && typeof error === 'object') {
          // Non-enumerable flag to minimize pollution; log if tagging fails
          try {
            Object.defineProperty(error, '_warRoomJoinLogged', { value: true, enumerable: false });
          } catch (defineErr) {
            console.warn('[state] Failed to mark join error as logged:', defineErr?.message);
          }
        }
        throw error; 
      } finally {
        dispatch({ type: 'warroom/loading', payload: false });
      }
    };
    
    const leaveWarRoom = async (meetingId) => {
      try {
        const { leaveMeeting } = await import('./api.js');
        await leaveMeeting(meetingId, state.settings.apiBaseUrl);
      } catch (error) {
        console.warn('Failed to leave meeting:', error);
        // Don't show toast for leave errors - user is navigating away anyway
      }
    };

    const sendWarRoomMessage = async (warRoomId, content) => {
      try {
        const { userMessage, assistantMessage } = await apiPostWarRoomMessage(
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
        if (!USE_MOCKS) {
          try {
            const fallback = await apiPostWarRoomMessage(
              warRoomId,
              { role: 'user', content },
              '',
            );
            const existing = cacheRef.current.warRooms.get(warRoomId) || { id: warRoomId, messages: [] };
            const updatedMessages = [...(existing.messages || []), fallback.userMessage];
            if (fallback.assistantMessage) {
              updatedMessages.push(fallback.assistantMessage);
            }
            cacheRef.current.warRooms.set(warRoomId, { ...existing, messages: updatedMessages });
            dispatch({ type: 'warroom/messages', payload: { id: warRoomId, messages: updatedMessages } });
            return updatedMessages;
          } catch (fallbackError) {
            console.warn('Fallback war room send failed', fallbackError);
          }
        }
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
      const next = {
        ...state.settings,
        ...updates,
        apiBaseUrl: normalizeBaseUrl(updates.apiBaseUrl) || DEFAULT_API_BASE_URL,
      };
      if (globalThis?.localStorage) {
        globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      dispatch({ type: 'settings/saved', payload: next });
      addToast({
        title: 'Preferencias guardadas',
        description: 'Los cambios de configuración se aplicaron correctamente.',
        tone: 'success',
      });
      return next;
    };

    const authStartGoogleAction = async () => {
      dispatch({ type: 'auth/loading', payload: true });
      try {
        const outcome = await authStartGoogleApi(state.settings.apiBaseUrl);
        dispatch({ type: 'auth/loading', payload: false });

        // If the API returned a token (client-side flow against backend_IDS), finish login here
        if (outcome && (outcome.token || outcome.access_token)) {
          const token = outcome.token || outcome.access_token;

          // Make subsequent requests authorized
          try {
            setAuthToken(token);
          } catch (e) {
            // ignore if setAuthToken not available
          }

          // Try to obtain user info from the response or fetch /api/auth/me
          let user = outcome.user ?? null;
          if (!user) {
            try {
              const meResponse = await authFetchMeApi(state.settings.apiBaseUrl);
              // Merge /api/auth/me with Google JWT claims to get complete user info
              user = {
                ...meResponse,
                name: outcome.claims?.name || meResponse.email?.split('@')[0],
                email: meResponse.email || outcome.email,
                picture: outcome.claims?.picture,
              };
            } catch (e) {
              // Fallback: build user from Google JWT claims
              user = outcome.user ?? {
                email: outcome.email || outcome.claims?.email,
                name: outcome.claims?.name || outcome.email?.split('@')[0],
                picture: outcome.claims?.picture,
                role: outcome.role || 'ROLE_USER',
              };
            }
          }

          handleAuthSuccess(token, user, {
            title: 'Sesión iniciada',
            description: `Bienvenido, ${user?.name || user?.email || ''}`,
            tone: 'success',
          });

          return { initiated: true };
        }

        return { initiated: true };
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

    const authHandleReturnAction = async () => {
      dispatch({ type: 'auth/loading', payload: true });
      try {
        // For Backend_IDS we use a client-side flow: the frontend obtains an id_token
        // and posts it to POST /api/auth/google. That call returns our backend JWT which
        // we store locally. Here we simply validate an existing stored token by calling
        // GET /api/auth/me. The legacy session polling endpoint (/auth/session/status)
        // belongs to the other backend and is not used when working with Backend_IDS.

        if (state.auth.token) {
          try {
            const currentUser = await authFetchMeApi(state.settings.apiBaseUrl);
            if (currentUser) {
              return handleAuthSuccess(state.auth.token, currentUser, null);
            }
          } catch (verifyError) {
            console.warn('No se pudo validar el token almacenado', verifyError);
          }
        }

        clearAuthState();
        setAuthToken(null);
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
        const result = await authVerifyTotpApi(ticket, code, state.settings.apiBaseUrl);
        if (result?.access_token && result?.user) {
          const payload = handleAuthSuccess(result.access_token, result.user, {
            title: 'TOTP verificado',
            description: 'Autenticación en dos pasos completada.',
            tone: 'success',
          });
          return payload;
        }
        throw new Error('Respuesta inválida del servicio de autenticación.');
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
        await authLogoutApi(state.settings.apiBaseUrl);
      } catch (error) {
        console.warn('[state] Logout request failed (continuing logout flow):', error?.message);
      } finally {
        clearAuthState();
        setAuthToken(null);
        dispatch({ type: 'auth/logout' });
        addToast({
          title: 'Sesión cerrada',
          description: 'Has cerrado sesión correctamente.',
          tone: 'info',
        });
        // Redirigir al login después de cerrar sesión
        if (globalThis?.location) {
          globalThis.setTimeout(() => {
            globalThis.location.hash = '#/login';
          }, 100);
        }
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
        const detail = await getTrafficPacketById(packetId, state.settings.apiBaseUrl);
        return detail;
      } catch (error) {
        addToast({
          title: 'No se pudo obtener el detalle del paquete',
          description: error.message || 'Intenta nuevamente.',
          tone: 'danger',
        });
        if (!USE_MOCKS) {
          try {
            return await getTrafficPacketById(packetId, '');
          } catch (fallbackError) {
            console.warn('Fallback packet detail failed', fallbackError);
          }
        }
        throw error;
      }
    };

    const requestRecentTraffic = async ({ since, limit }) => {
      try {
        const packets = await getTrafficRecent({ since, limit }, state.settings.apiBaseUrl);
        return packets;
      } catch (error) {
        addToast({
          title: 'No se pudo actualizar el tráfico',
          description: error.message || 'Revisa la conexión al backend.',
          tone: 'warn',
        });
        if (!USE_MOCKS) {
          try {
            return await getTrafficRecent({ since, limit }, '');
          } catch (fallbackError) {
            console.warn('Fallback traffic recent failed', fallbackError);
          }
        }
        throw error;
      }
    };

    const createIncidentFromPacketAction = async ({ packetId, reason, severity }) => {
      try {
        const result = await postIncidentFromPacket(packetId, reason, severity, state.settings.apiBaseUrl);
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
        if (!USE_MOCKS) {
          try {
            const fallback = await postIncidentFromPacket(packetId, reason, severity, '');
            linkPacketToIncident(packetId, fallback.incidentId, severity);
            return fallback;
          } catch (fallbackError) {
            console.warn('[state] Fallback create incident from packet failed:', fallbackError?.message);
          }
        }
        throw error;
      }
    };

    const clearSelectedIncident = () => {
      dispatch({ type: 'incident/cleared' });
    };

    const loadResolvedIncidents = async () => {
      dispatch({ type: 'incidents/loading', payload: true });
      try {
        const { getResolvedIncidents } = await import('./api.js');
        const resolvedIncidents = await getResolvedIncidents(state.settings.apiBaseUrl);
        dispatch({ type: 'incidents/loaded', payload: resolvedIncidents });
        return resolvedIncidents;
      } catch (error) {
        addToast({
          title: 'Error al cargar incidentes contenidos',
          description: error.message || 'Intenta nuevamente más tarde.',
          tone: 'danger',
        });
        return [];
      } finally {
        dispatch({ type: 'incidents/loading', payload: false });
      }
    };

    return {
      addToast,
      dismissToast,
      loadIncidents,
      loadIncidentById,
      clearSelectedIncident,
      updateIncidentStatus,
      openWarRoom,
      joinWarRoom,
      loadWarRoomMessages,
      sendWarRoomMessage,
      updateWarRoomChecklist,
      saveSettings,
      authStartGoogle: authStartGoogleAction,
      authHandleReturn: authHandleReturnAction,
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
      leaveWarRoom,
      loadResolvedIncidents,
    };
  }, [state.settings, state.traffic, state.incidents, state.auth]);

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
