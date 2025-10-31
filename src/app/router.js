import { createElement, useEffect, useRef, useState } from 'react';
import Loader from '../components/Loader.jsx';
import { useAppActions, useAppState } from './state.js';

const ROUTES = [
  {
    key: 'dashboard',
    path: '#/dashboard',
    pattern: /^#\/(?:dashboard)?$/,
    loader: () => import('../pages/Dashboard.jsx'),
    mapParams: () => ({}),
    private: true,
  },
  {
    key: 'login',
    path: '#/login',
    pattern: /^#\/login(?:\?(.*))?$/,
    loader: () => import('../pages/Login.jsx'),
    mapParams: (match) => ({ query: match[1] || '' }),
    private: false,
  },
  {
    key: 'incident',
    path: '#/incident/:id',
    pattern: /^#\/incident\/([^/]+)$/,
    loader: () => import('../pages/IncidentDetail.jsx'),
    mapParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    private: true,
  },
  {
    key: 'war-room',
    path: '#/war-room/:id',
    pattern: /^#\/war-room\/([^/]+)$/,
    loader: () => import('../pages/WarRoom.jsx'),
    mapParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    private: true,
  },
  {
    key: 'settings',
    path: '#/settings',
    pattern: /^#\/settings$/,
    loader: () => import('../pages/Settings.jsx'),
    mapParams: () => ({}),
    private: true,
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
        private: Boolean(route.private),
      };
    }
  }
  return {
    key: DEFAULT_ROUTE.key,
    params: {},
    load: DEFAULT_ROUTE.loader,
    path: DEFAULT_ROUTE.path,
    hash: DEFAULT_ROUTE.path,
    private: Boolean(DEFAULT_ROUTE.private),
  };
}

export function navigate(to) {
  if (typeof window === 'undefined') return;
  window.location.hash = to;
}

export function useRoute() {
  const [route, setRoute] = useState(() =>
    matchRoute(typeof window !== 'undefined' ? window.location.hash : '#/'),
  );
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
      return '#/dashboard';
    case 'incident':
      return `#/incident/${encodeURIComponent(params.id)}`;
    case 'war-room':
      return `#/war-room/${encodeURIComponent(params.id)}`;
    case 'settings':
      return '#/settings';
    case 'login':
      return params.query ? `#/login?${params.query}` : '#/login';
    default:
      return '#/';
  }
}

function RequireAuthGate({ render }) {
  const { auth } = useAppState();
  const { authHandleReturn } = useAppActions();
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!auth.user && !auth.loading && !hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      authHandleReturn()
        .then((result) => {
          if (!result || !result.user) {
            navigate('#/login');
          }
        })
        .catch(() => navigate('#/login'));
    }
  }, [auth.loading, auth.user, authHandleReturn]);

  if (auth.loading || (!auth.user && !hasAttemptedRef.current)) {
    return createElement(Loader, { label: 'Validando sesión' });
  }

  if (!auth.user) {
    return createElement(Loader, { label: 'Redirigiendo a login' });
  }

  return render();
}

export function requireAuth(render) {
  return createElement(RequireAuthGate, { render });
}
