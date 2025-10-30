import {
  mockFetchIncidentById,
  mockFetchIncidents,
  mockPostIncidentAction,
  mockOpenWarRoom,
  mockFetchWarRoomMessages,
  mockPostWarRoomMessage,
  mockAuthStartGoogle,
  mockAuthFetchMe,
  mockAuthVerifyTotp,
  mockAuthLogout,
} from './api.mock.js';

const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };

const hasBackend = (baseUrl) => Boolean(baseUrl && baseUrl.trim().length);

const toUrl = (baseUrl, path, params) => {
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
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
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

export async function fetchIncidents(filters, baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockFetchIncidents(filters);
  }
  const url = toUrl(baseUrl, '/incidents', {
    query: filters?.query || '',
    status: filters?.status || '',
    severity: filters?.severity || '',
    from: filters?.from || '',
    to: filters?.to || '',
  });
  const response = await fetch(url, { method: 'GET' });
  return handleResponse(response);
}

export async function fetchIncidentById(id, baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockFetchIncidentById(id);
  }
  const url = toUrl(baseUrl, `/incidents/${id}`);
  const response = await fetch(url, { method: 'GET' });
  return handleResponse(response);
}

export async function postIncidentAction(id, action, baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockPostIncidentAction(id, action);
  }
  const url = toUrl(baseUrl, `/incidents/${id}/actions`);
  const response = await fetch(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ action }),
  });
  return handleResponse(response);
}

export async function openWarRoomSession(id, baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockOpenWarRoom(id);
  }
  const url = toUrl(baseUrl, `/incidents/${id}/war-room`);
  const response = await fetch(url, { method: 'POST' });
  return handleResponse(response);
}

export async function fetchWarRoomMessages(warRoomId, baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockFetchWarRoomMessages(warRoomId);
  }
  const url = toUrl(baseUrl, `/war-room/${warRoomId}/messages`);
  const response = await fetch(url, { method: 'GET' });
  return handleResponse(response);
}

export async function postWarRoomMessage(warRoomId, payload, baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockPostWarRoomMessage(warRoomId, payload);
  }
  const url = toUrl(baseUrl, `/war-room/${warRoomId}/messages`);
  const response = await fetch(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function authStartGoogle(baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockAuthStartGoogle();
  }
  const url = toUrl(baseUrl, '/auth/google/start');
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response);
}

export async function authFetchMe(baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockAuthFetchMe();
  }
  const url = toUrl(baseUrl, '/auth/me');
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response);
}

export async function authVerifyTotp(ticket, code, baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockAuthVerifyTotp(ticket, code);
  }
  const url = toUrl(baseUrl, '/auth/mfa/verify');
  const response = await fetch(url, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ ticket, code }),
  });
  return handleResponse(response);
}

export async function authLogout(baseUrl) {
  if (!hasBackend(baseUrl)) {
    return mockAuthLogout();
  }
  const url = toUrl(baseUrl, '/auth/logout');
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
  });
  await handleResponse(response);
}
