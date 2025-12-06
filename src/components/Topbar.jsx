import { memo } from 'react';
import PropTypes from 'prop-types';

const themeLabels = {
  auto: 'Tema automático',
  light: 'Tema claro',
  dark: 'Tema oscuro',
};

const Topbar = memo(function Topbar({
  title,
  subtitle,
  theme = 'auto',
  onThemeCycle,
  onMenuToggle,
  user,
  onLogout,
  authLoading = false,
  hideUserActions = false,
}) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2)?.toUpperCase();

  return (
    <header className="topbar" role="banner">
      <div className="topbar-meta">
        {onMenuToggle ? (
          <button type="button" className="btn subtle menu-toggle" onClick={onMenuToggle} aria-label="Mostrar menú">
            Menú
          </button>
        ) : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="topbar-actions">
        {user && !hideUserActions ? (
          <div className="topbar-user">
            {user.picture ? (
              <img src={user.picture} alt={user.name || user.email} />
            ) : (
              <span aria-hidden="true">{initials}</span>
            )}
            <div className="user-meta">
              <strong>{user.name || user.email}</strong>
            </div>
            <button
              type="button"
              className="btn subtle"
              onClick={onLogout}
              disabled={authLoading}
              aria-label="Cerrar sesión"
            >
              {authLoading ? '...' : 'Salir'}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
});

Topbar.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  theme: PropTypes.oneOf(['auto', 'light', 'dark']),
  onThemeCycle: PropTypes.func.isRequired,
  onMenuToggle: PropTypes.func,
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    picture: PropTypes.string,
  }),
  onLogout: PropTypes.func,
  authLoading: PropTypes.bool,
  hideUserActions: PropTypes.bool,
};

export default Topbar;
