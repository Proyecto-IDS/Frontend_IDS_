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

// --- Autenticación --------------------------------------------------------

export async function authStartGoogle(baseUrl) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env file and restart the dev server.');
  }

  await initGoogle(clientId);
  const idToken = await requestIdToken({ timeoutMs: 60000 });

  const url = toUrl(baseUrl, '/api/auth/google');
  return request(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ idToken }),
  });
}

export async function authFetchMe(baseUrl) {
  const url = toUrl(baseUrl, '/api/auth/me');
  return request(url, { method: 'GET' });
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

export async function getIncidents(filters = {}, baseUrl) {
  // Backend_IDS uses /api/alerts instead of /incidents
  try {
    // Ensure we have a valid baseUrl
    const url = baseUrl || 'http://localhost:8080';
    const limit = filters.limit || 1000;  // Request up to 1000 alerts by default
    const alertsUrl = toUrl(url, '/api/alerts', { limit });
    
    const alerts = await request(alertsUrl, { method: 'GET' });
    
    // Convert alerts to incident format
    if (!Array.isArray(alerts)) return [];
    return alerts.map((alert) => ({
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
      warRoomId: alert.warRoomId,  // Include warRoomId from backend
    }));
  } catch (error) {
    throw error;
  }
}

export async function getIncidentById(id, baseUrl) {
  if (!id || id === 'undefined') {
    return null;
  }
  
  const url = toUrl(baseUrl, `/api/alerts/by-incident/${id}`);
  const alert = await request(url, { method: 'GET' });
  
  // Map alert to incident format, ensuring warRoomId is included
  if (!alert) return null;
  
  return {
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
    warRoomId: alert.warRoomId,  // Include warRoomId from backend
  };
}

export async function postIncidentAction(id, body, baseUrl) {
  const url = toUrl(baseUrl, `/incidents/${id}/actions`);
  return request(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(body),
  });
}

export async function postIncidentFromPacket(packetId, reason, severity, baseUrl) {
  const url = toUrl(baseUrl, '/incidents/from-packet');
  return request(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ packetId, reason, severity }),
  });
}

export async function postIncidentWarRoom(id, baseUrl) {
  // Create a meeting instead of using non-existent war-room endpoint
  const url = toUrl(baseUrl, '/api/meetings');
  
  // Format: ISO_LOCAL_DATE_TIME (YYYY-MM-DDTHH:mm:ss - no Z, no milliseconds)
  const formatLocalDateTime = (date) => {
    const isoString = date.toISOString(); // 2025-11-03T21:27:38.575Z
    return isoString.substring(0, 19); // Take only YYYY-MM-DDTHH:mm:ss
  };
  
  const now = new Date();
  const startTime = formatLocalDateTime(now);
  const endTime = formatLocalDateTime(new Date(now.getTime() + 3600000)); // +1 hour
  
  return request(url, { 
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      title: `Meeting for Incident ${id}`,
      description: `Discussion and response coordination for incident ${id}`,
      startTime,
      endTime,
      incidentId: id
    })
  });
}

// --- War Room / Meeting ---------------------------------------------------

export async function getMeetingDetails(meetingId, baseUrl) {
  // Get full meeting details including participants, status, etc.
  const url = toUrl(baseUrl, `/api/meetings/${meetingId}`);
  return request(url, { method: 'GET' });
}

export async function joinMeeting(code, baseUrl) {
  // Join an existing meeting using the meeting code
  const url = toUrl(baseUrl, '/api/meetings/join');
  return request(url, { 
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ code })
  });
}

export async function getWarRoomMessages(warRoomId, baseUrl) {
  // TODO: Implement meeting messages endpoint
  // For now, return empty array to avoid errors
  return [];
}

export async function leaveMeeting(meetingId, baseUrl) {
  // Leave an existing meeting
  const url = toUrl(baseUrl, `/api/meetings/${meetingId}/leave`);
  return request(url, { method: 'POST' });
}

export async function postWarRoomMessage(warRoomId, message, baseUrl) {
  // TODO: Implement meeting message creation
  // For now, return success response
  return { 
    userMessage: { id: Date.now(), role: 'user', content: message.content, createdAt: new Date().toISOString() },
    assistantMessage: null
  };
}

// --- Tráfico --------------------------------------------------------------

export async function getTrafficRecent({ since, limit } = {}, baseUrl) {
  const url = toUrl(baseUrl, '/traffic/recent', { since, limit });
  return request(url, { method: 'GET' });
}

export async function getTrafficPacketById(packetId, baseUrl) {
  const url = toUrl(baseUrl, `/traffic/packets/${packetId}`);
  return request(url, { method: 'GET' });
}

// --- Alertas (métricas) ---

export async function getAlertsCount(baseUrl) {
  const url = toUrl(baseUrl, '/api/alerts/count');
  return request(url, { method: 'GET' });
}

export async function getAlertsBySeverity(baseUrl) {
  const url = toUrl(baseUrl, '/api/alerts/count/by-severity');
  return request(url, { method: 'GET' });
}

export async function getAlertsToday(baseUrl) {
  const url = toUrl(baseUrl, '/api/alerts/today');
  return request(url, { method: 'GET' });
}

export async function getAlertsTodayCount(baseUrl) {
  const url = toUrl(baseUrl, '/api/alerts/today/count');
  return request(url, { method: 'GET' });
}

// --- WebSocket ------------------------------------------------------------

export function connectTrafficStream(baseUrl, onEvent, { onOpen, onClose, onError } = {}) {
  let closedExplicitly = false;
  let currentSocket = null;
  let retryTimer = null;

  const buildWsUrl = () => {
    const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
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
        // Parse error
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
  connectTrafficStream,
  getAlertsCount,
  getAlertsBySeverity,
  getAlertsToday,
  getAlertsTodayCount,
};

export default api;
