// --- ML helpers to avoid duplication ---
function deriveMlDescription({ standardProtocol, prediction, category, attackProbability }) {
  if (standardProtocol) {
    return standardProtocol.split('\n')[0].trim();
  } else if (prediction) {
    let probStr;
    if (attackProbability === null || attackProbability === undefined) {
      probStr = 'prob. desconocida';
    } else {
      probStr = `${(attackProbability * 100).toFixed(1)}%`;
    }
      if (category) {
        return `${prediction} (${category}) detectado. Probabilidad ${probStr}.`;
      } else {
        return `${prediction} detectado. Probabilidad ${probStr}.`;
      }
  }
  return '—';
}

function extractMlChecklist(standardProtocol) {
  if (!standardProtocol) return [];
  const lines = standardProtocol.split('\n').map(l => l.trim()).filter(Boolean);
  let collecting = false;
  const checklist = [];
  for (const line of lines) {
    if (/Acciones/i.test(line)) { collecting = true; continue; }
    if (collecting && /^\d+\)/.test(line)) {
      checklist.push(line.replace(/^\d+\)\s*/, ''));
    }
  }
  return checklist;
}
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
  if (contentType?.includes('application/json')) {
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

const mapAlertToIncident = (alert, overrides = {}) => {
  // Parse probabilities if backend sent JSON string
  let probabilities = alert.probabilities;
  if (probabilities && typeof probabilities === 'string') {
    try { probabilities = JSON.parse(probabilities); } catch { /* ignore */ }
  }

  const attackProbability = alert.attackProbability ?? alert.attack_probability;
  const prediction = alert.prediction || alert.detection_label;
  const category = alert.category;
  const standardProtocol = alert.standardProtocol;

  const mlDescription = deriveMlDescription({ standardProtocol, prediction, category, attackProbability });
  const mlChecklist = extractMlChecklist(standardProtocol);

  // Normalize severity values from backend to lowercase Spanish
  const normalizeSeverity = (sev) => {
    if (!sev) return 'baja';
    const lower = String(sev).toLowerCase();
    // Map English and Spanish variations
    if (lower === 'critical' || lower === 'critico') return 'critica';
    if (lower === 'high' || lower === 'alto') return 'alta';
    if (lower === 'medium' || lower === 'medio') return 'media';
    if (lower === 'low' || lower === 'bajo') return 'baja';
    if (lower === 'conocido') return 'conocido';
    if (lower === 'falso_positivo' || lower === 'falso-positivo') return 'falso-positivo';
    return lower;
  };

  return {
    id: alert.incidentId || `alert-${alert.id}`,
    source: alert.packetId,
    severity: normalizeSeverity(alert.severity),
    createdAt: alert.timestamp,
    detection: {
      model_version: alert.modelVersion || alert.model_version,
      model_score: alert.score,
      prediction,
    },
    // New ML fields surfaced directly
    attackProbability,
    category,
    standardProtocol,
    probabilities,
    mlDescription,
    mlChecklist,
    status: 'no-conocido',
    type: 'alert',
    linkedPacketId: alert.packetId,
    _alertId: alert.id,
    warRoomId: alert.warRoomId,
    ...overrides,
  };
};

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
  if (!alert) return null;
  // Use the same mapping as mapAlertToIncident, but preserve updatedAt and warRoom fields
  const incident = mapAlertToIncident(alert);
  return {
    ...incident,
    createdAt: alert.timestamp || alert.createdAt,
    updatedAt: alert.updatedAt,
    status: alert.status || incident.status,
    type: alert.type || incident.type,
    warRoomCode: alert.warRoomCode,
    warRoomStartTime: alert.warRoomStartTime,
    warRoomDuration: alert.warRoomDuration,
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

export async function uploadTrafficFile(file, baseUrl = 'http://localhost:8080') {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const url = toUrl(baseUrl, '/api/traffic/upload');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response.json();
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
