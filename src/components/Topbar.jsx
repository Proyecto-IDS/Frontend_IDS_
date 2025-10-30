import { memo } from 'react';

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
  children,
}) {
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
        {children}
        <button
          type="button"
          className="btn subtle"
          onClick={onThemeCycle}
          aria-label={`Cambiar tema (actual: ${themeLabels[theme] || theme})`}
        >
          {themeLabels[theme] || 'Tema'}
        </button>
      </div>
    </header>
  );
});

export default Topbar;
