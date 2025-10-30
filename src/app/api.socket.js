import { createMockTrafficSocket } from './mocks/traffic.mock.js';

const shouldUseMock = (baseUrl) => {
  if (!baseUrl || !baseUrl.trim()) return true;
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_USE_MOCKS === 'true') {
    return true;
  }
  return false;
};

const normalizeWsBase = (baseUrl) => {
  if (!baseUrl) return '';
  if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) return baseUrl;
  try {
    const parsed = new URL(baseUrl);
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return parsed.toString();
  } catch (error) {
    return baseUrl;
  }
};

export function createTrafficSocket({ baseUrl, onMessage, onError, onOpen, onClose }) {
  if (shouldUseMock(baseUrl)) {
    const socket = createMockTrafficSocket();
    socket.onmessage = (event) => {
      if (onMessage) {
        onMessage(JSON.parse(event.data));
      }
    };
    if (onOpen) {
      socket.onopen = onOpen;
    }
    if (onClose) {
      socket.onclose = onClose;
    }
    if (onError) {
      socket.onerror = onError;
    }
    return socket;
  }

  const wsBase = normalizeWsBase(baseUrl);
  const wsUrl = `${wsBase.replace(/\/$/, '')}/traffic/stream`;
  let socket;

  try {
    socket = new WebSocket(wsUrl);
  } catch (error) {
    if (onError) onError(error);
    return null;
  }

  if (onOpen) {
    socket.addEventListener('open', onOpen, { once: true });
  }
  if (onClose) {
    socket.addEventListener('close', onClose);
  }
  if (onError) {
    socket.addEventListener('error', onError);
  }
  if (onMessage) {
    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessage(payload);
      } catch (error) {
        console.warn('Paquete WS no válido', error);
      }
    });
  }
  return socket;
}

export function closeSocket(socket) {
  if (!socket) return;
  try {
    socket.close();
  } catch (error) {
    console.warn('No se pudo cerrar el socket', error);
  }
}
