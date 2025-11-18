import { initGoogle, requestIdToken } from './googleAuth.js';

const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function getAuthToken() {
  return authToken;
}

const toUrl = (baseUrl, path, params) => {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = new URL(path.replace(/^\//, ''), normalized);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || Number.isNaN(value)) return;
      url.searchParams.set(key, value);
    });
  }
  return url;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}`);
  }
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

const request = async (url, init = {}) => {
  try {
    const headers = new Headers(init.headers || {});
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    const response = await fetch(url, {
      credentials: init.credentials ?? 'include',
      ...init,
      headers,
    });
    return handleResponse(response);
  } catch (error) {
    throw new Error(error?.message || 'Error al conectar con el backend');
  }
};

const get = (baseUrl, path, params) => {
  const url = toUrl(baseUrl, path, params);
  return request(url, { method: 'GET' });
};

const post = (baseUrl, path, payload) => {
  const url = toUrl(baseUrl, path);
  if (payload === undefined) {
    return request(url, { method: 'POST' });
  }
  return request(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
};

const mapAlertToIncident = (alert, overrides = {}) => ({
  id: alert.incidentId || `alert-${alert.id}`,
  source: alert.packetId,
  severity: alert.severity,
  createdAt: alert.timestamp,
  detection: {
    model_version: alert.modelVersion || alert.model_version,
    model_score: alert.score,
  },
  status: 'no-conocido',
  type: 'alert',
  linkedPacketId: alert.packetId,
  _alertId: alert.id,
  warRoomId: alert.warRoomId,
  ...overrides,
});

// --- Autenticación --------------------------------------------------------

export async function authStartGoogle(baseUrl) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env file and restart the dev server.');
  }

  await initGoogle(clientId);
  const idToken = await requestIdToken({ timeoutMs: 60000 });

  return post(baseUrl, '/api/auth/google', { idToken });
}

export async function authFetchMe(baseUrl) {
  return get(baseUrl, '/api/auth/me');
}

export async function authFetchSessionStatus() {
  return null;
}

export async function authVerifyTotp() {
  throw new Error('MFA/TOTP verification is not supported by Backend_IDS');
}

export async function authLogout() {
  return { ok: true };
}

// --- Incidentes (Alertas en Backend_IDS) ---

export async function getIncidents(filters = {}, baseUrl = 'http://localhost:8080') {
  // Backend_IDS uses /api/alerts instead of /incidents
  // Ensure we have a valid baseUrl
  const limit = filters.limit || 1000;  // Request up to 1000 alerts by default
  const alerts = await get(baseUrl, '/api/alerts', { limit });

  // Convert alerts to incident format
  if (!Array.isArray(alerts)) return [];
  return alerts.map((alert) => mapAlertToIncident(alert));
}

export async function getIncidentById(id, baseUrl) {
  if (!id || id === 'undefined') {
    return null;
  }
  
  const alert = await get(baseUrl, `/api/alerts/by-incident/${id}`);
  
  // Map alert to incident format, ensuring all backend fields are included
  if (!alert) return null;
  
  return {
    id: alert.incidentId || `alert-${alert.id}`,
    source: alert.packetId,
    severity: alert.severity,
    createdAt: alert.timestamp || alert.createdAt,
    updatedAt: alert.updatedAt,
    detection: {
      model_version: alert.modelVersion || alert.model_version,
      model_score: alert.score,
    },
    status: alert.status || 'no-conocido',
    type: alert.type || 'alert',
    linkedPacketId: alert.packetId,
    _alertId: alert.id,
    warRoomId: alert.warRoomId,
    // War room / meeting information
    warRoomCode: alert.warRoomCode,
    warRoomStartTime: alert.warRoomStartTime,
    warRoomDuration: alert.warRoomDuration,
    // Additional fields from backend
    relatedAssets: alert.relatedAssets || [],
    notes: alert.notes,
    timeline: alert.timeline || [],
    aiSummary: alert.aiSummary,
  };
}

export async function postIncidentAction(id, body, baseUrl) {
  return post(baseUrl, `/incidents/${id}/actions`, body);
}

export async function postIncidentFromPacket(packetId, reason, severity, baseUrl) {
  return post(baseUrl, '/incidents/from-packet', { packetId, reason, severity });
}

export async function postIncidentWarRoom(id, baseUrl) {
  // Create a meeting using the new simplified format (no dates needed)
  return post(baseUrl, '/api/meetings', {
    title: `Reunión para Incidente ${id}`,
    description: `Coordinación y respuesta para incidente ${id}`,
    incidentId: id
  });
}

// --- War Room / Meeting ---------------------------------------------------

export async function getMeetingDetails(meetingId, baseUrl) {
  // Get full meeting details including participants, status, etc.
  return get(baseUrl, `/api/meetings/${meetingId}`);
}

export async function joinMeeting(code, baseUrl) {
  // Join an existing meeting using the meeting code
  return post(baseUrl, '/api/meetings/join', { code });
}

export async function getWarRoomMessages(warRoomId, baseUrl) {
  return [];
}

export async function leaveMeeting(meetingId, baseUrl) {
  // Leave an existing meeting
  return post(baseUrl, `/api/meetings/${meetingId}/leave`);
}

export async function postWarRoomMessage(warRoomId, message, baseUrl) {
  return { 
    userMessage: { id: Date.now(), role: 'user', content: message.content, createdAt: new Date().toISOString() },
    assistantMessage: null
  };
}

// --- Tráfico --------------------------------------------------------------

export async function getTrafficRecent({ since, limit } = {}, baseUrl) {
  return get(baseUrl, '/traffic/recent', { since, limit });
}

export async function getTrafficPacketById(packetId, baseUrl) {
  return get(baseUrl, `/traffic/packets/${packetId}`);
}

// --- Alertas (métricas) ---

export async function getAlertsCount(baseUrl) {
  return get(baseUrl, '/api/alerts/count');
}

export async function getAlertsBySeverity(baseUrl) {
  return get(baseUrl, '/api/alerts/count/by-severity');
}

export async function getAlertsToday(baseUrl) {
  return get(baseUrl, '/api/alerts/today');
}

export async function getAlertsTodayCount(baseUrl) {
  return get(baseUrl, '/api/alerts/today/count');
}

export async function getResolvedIncidents(baseUrl) {
  const alerts = await get(baseUrl, '/api/alerts/resolved');
  
  // Convert alerts to incident format
  if (!Array.isArray(alerts)) return [];
  return alerts.map((alert) => mapAlertToIncident(alert, { status: 'contenido' }));
}

export async function markIncidentAsResolved(meetingId, baseUrl) {
  return post(baseUrl, `/api/meetings/${meetingId}/mark-as-resolved`);
}

// --- WebSocket ------------------------------------------------------------

// WebSocket connection for alerts and meeting events
export function connectAlertsWebSocket(baseUrl, onEvent, { onOpen, onClose, onError } = {}) {
  let closedExplicitly = false;
  let currentSocket = null;
  let retryTimer = null;

  const buildWsUrl = () => {
    const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    // Use the existing WebSocket endpoint that's already implemented in backend
    let target = normalized.replace(/^http/, 'ws') + '/traffic/stream';
    return target;
  };

  const setupSocket = () => {
    if (closedExplicitly) return;
    try {
      const wsUrl = buildWsUrl();
      currentSocket = new WebSocket(wsUrl);
    } catch (error) {
      onError?.(error);
      scheduleReconnect();
      return;
    }

    currentSocket.addEventListener('open', () => onOpen?.());
    currentSocket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type) onEvent?.(payload.type, payload);
      } catch (error) {
        console.warn('WebSocket: Failed to parse message:', error.message);
      }
    });

    currentSocket.addEventListener('close', () => {
      onClose?.();
      if (!closedExplicitly) scheduleReconnect();
    });

    currentSocket.addEventListener('error', (event) => {
      onError?.(event);
      if (!closedExplicitly) currentSocket?.close();
    });
  };

  const scheduleReconnect = () => {
    if (retryTimer || closedExplicitly) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      setupSocket();
    }, 5000);
  };

  setupSocket();

  return {
    close() {
      closedExplicitly = true;
      if (retryTimer) clearTimeout(retryTimer);
      currentSocket?.close();
    },
  };
}

// --- Export agrupado ------------------------------------------------------

export const api = {
  authStartGoogle,
  authFetchMe,
  authFetchSessionStatus,
  authVerifyTotp,
  authLogout,
  getIncidents,
  getIncidentById,
  postIncidentAction,
  postIncidentFromPacket,
  postIncidentWarRoom,
  getWarRoomMessages,
  postWarRoomMessage,
  getTrafficRecent, 
  getTrafficPacketById,
  connectAlertsWebSocket,
  getAlertsCount,
  getAlertsBySeverity,
  getAlertsToday,
  getAlertsTodayCount,
  getResolvedIncidents,
  markIncidentAsResolved,
};

export default api;
