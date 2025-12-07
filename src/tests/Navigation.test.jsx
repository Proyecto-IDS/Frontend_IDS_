import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Topbar from '../components/Topbar.jsx';
import Sidebar from '../components/Sidebar.jsx';

describe('Topbar Component', () => {
  const mockUser = {
    name: 'Juan Pérez',
    email: 'juan@example.com',
    role: 'ROLE_ADMIN',
  };

  it('debe renderizar nombre de usuario', () => {
    render(<Topbar user={mockUser} onLogout={vi.fn()} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('debe renderizar componente topbar', () => {
    const { container } = render(<Topbar user={mockUser} onLogout={vi.fn()} />);
    expect(container.querySelector('.topbar')).toBeInTheDocument();
  });

  it('debe tener botón de salir', () => {
    render(<Topbar user={mockUser} onLogout={vi.fn()} />);
    expect(screen.getByText('Salir')).toBeInTheDocument();
  });

  it('debe renderizar sin usuario', () => {
    const { container } = render(<Topbar user={null} onLogout={vi.fn()} />);
    expect(container.querySelector('.topbar')).toBeInTheDocument();
  });

  it('debe llamar onLogout al hacer click en salir', () => {
    const onLogout = vi.fn();
    render(<Topbar user={mockUser} onLogout={onLogout} />);
    
    const logoutButton = screen.getByText('Salir');
    fireEvent.click(logoutButton);
    
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe('Sidebar Component', () => {
  it('debe renderizar elementos de navegación', () => {
    render(<Sidebar currentView="dashboard" onNavigate={vi.fn()} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('debe llamar onNavigate al hacer click', () => {
    const onNavigate = vi.fn();
    render(<Sidebar currentView="dashboard" onNavigate={onNavigate} />);
    
    const dashboardLink = screen.getByText('Dashboard');
    fireEvent.click(dashboardLink);
    
    expect(onNavigate).toHaveBeenCalled();
  });

  it('debe renderizar componente sidebar', () => {
    const { container } = render(<Sidebar currentView="dashboard" onNavigate={vi.fn()} />);
    expect(container.querySelector('.sidebar')).toBeInTheDocument();
  });

  it('debe renderizar logo o título de la aplicación', () => {
    const { container } = render(<Sidebar currentView="dashboard" onNavigate={vi.fn()} />);
    expect(container.querySelector('.sidebar')).toBeInTheDocument();
  });
});
