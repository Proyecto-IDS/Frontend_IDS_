import { useEffect, useState } from 'react';

const ROUTES = [
  {
    key: 'dashboard',
    path: '#/',
    pattern: /^#?\/?$/,
    loader: () => import('../pages/Dashboard.jsx'),
    mapParams: () => ({}),
  },
  {
    key: 'incident',
    path: '#/incident/:id',
    pattern: /^#\/incident\/([^/]+)$/,
    loader: () => import('../pages/IncidentDetail.jsx'),
    mapParams: (match) => ({ id: decodeURIComponent(match[1]) }),
  },
  {
    key: 'war-room',
    path: '#/war-room/:id',
    pattern: /^#\/war-room\/([^/]+)$/,
    loader: () => import('../pages/WarRoom.jsx'),
    mapParams: (match) => ({ id: decodeURIComponent(match[1]) }),
  },
  {
    key: 'settings',
    path: '#/settings',
    pattern: /^#\/settings$/,
    loader: () => import('../pages/Settings.jsx'),
    mapParams: () => ({}),
  },
];

const DEFAULT_ROUTE = ROUTES[0];

const normalizeHash = (hash) => {
  if (!hash) return DEFAULT_ROUTE.path;
  return hash.startsWith('#') ? hash : `#${hash}`;
};

function matchRoute(hash) {
  const normalized = normalizeHash(hash);
  for (const route of ROUTES) {
    const match = normalized.match(route.pattern);
    if (match) {
      return {
        key: route.key,
        params: route.mapParams(match),
        load: route.loader,
        path: route.path,
        hash: normalized,
      };
    }
  }
  return {
    key: DEFAULT_ROUTE.key,
    params: {},
    load: DEFAULT_ROUTE.loader,
    path: DEFAULT_ROUTE.path,
    hash: DEFAULT_ROUTE.path,
  };
}

export function navigate(to) {
  if (typeof window === 'undefined') return;
  window.location.hash = to;
}

export function useRoute() {
  const [route, setRoute] = useState(() => matchRoute(typeof window !== 'undefined' ? window.location.hash : '#/'));
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;
    setComponent(null);
    setError(null);

    route
      .load()
      .then((mod) => {
        if (!isActive) return;
        setComponent(() => mod.default);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error('No se pudo cargar la ruta', err);
        setError(err);
      });

    return () => {
      isActive = false;
    };
  }, [route]);

  useEffect(() => {
    const handler = () => {
      setRoute(matchRoute(window.location.hash));
    };
    window.addEventListener('hashchange', handler);
    if (!window.location.hash) {
      window.location.hash = DEFAULT_ROUTE.path;
    }
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return { ...route, Component, error };
}

export function getRouteHash(key, params = {}) {
  switch (key) {
    case 'dashboard':
      return '#/';
    case 'incident':
      return `#/incident/${encodeURIComponent(params.id)}`;
    case 'war-room':
      return `#/war-room/${encodeURIComponent(params.id)}`;
    case 'settings':
      return '#/settings';
    default:
      return '#/';
  }
}
