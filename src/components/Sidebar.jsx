import { memo } from 'react';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', description: 'Resumen de incidentes' },
  { key: 'settings', label: 'Configuración', description: 'Preferencias del sistema' },
];

const Sidebar = memo(function Sidebar({ collapsed, onToggle, activeKey, onNavigate }) {
  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Navegación principal">
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Expandir navegación' : 'Colapsar navegación'}
        >
          ☰
        </button>
        {!collapsed && <span className="sidebar-brand">IDS Campus</span>}
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={activeKey === item.key ? 'active' : ''}
                onClick={() => onNavigate?.(item.key)}
                aria-current={activeKey === item.key ? 'page' : undefined}
              >
                <span className="nav-label">{item.label}</span>
                {!collapsed && <span className="nav-description">{item.description}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
});

export default Sidebar;
