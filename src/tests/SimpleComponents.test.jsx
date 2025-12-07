import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Tag from '../components/Tag.jsx';
import Pill from '../components/Pill.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatCard from '../components/StatCard.jsx';

describe('Tag Component', () => {
  it('debe renderizar con texto', () => {
    render(<Tag>Test Tag</Tag>);
    expect(screen.getByText('Test Tag')).toBeInTheDocument();
  });

  it('debe aplicar el tono correcto', () => {
    const { container } = render(<Tag tone="success">Success Tag</Tag>);
    expect(container.querySelector('.tag-success')).toBeInTheDocument();
  });

  it('debe aplicar tono danger', () => {
    const { container } = render(<Tag tone="danger">Danger Tag</Tag>);
    expect(container.querySelector('.tag-danger')).toBeInTheDocument();
  });

  it('debe aplicar tono warn', () => {
    const { container } = render(<Tag tone="warn">Warning Tag</Tag>);
    expect(container.querySelector('.tag-warn')).toBeInTheDocument();
  });

  it('debe aplicar tono info', () => {
    const { container } = render(<Tag tone="info">Info Tag</Tag>);
    expect(container.querySelector('.tag-info')).toBeInTheDocument();
  });

  it('debe usar tono neutral por defecto', () => {
    const { container } = render(<Tag>Default Tag</Tag>);
    expect(container.querySelector('.tag-neutral')).toBeInTheDocument();
  });
});

describe('Pill Component', () => {
  it('debe renderizar con texto', () => {
    render(<Pill>Test Pill</Pill>);
    expect(screen.getByText('Test Pill')).toBeInTheDocument();
  });

  it('debe aplicar el tono correcto', () => {
    const { container } = render(<Pill tone="success">Success</Pill>);
    expect(container.querySelector('.pill-success')).toBeInTheDocument();
  });

  it('debe aplicar tono danger', () => {
    const { container } = render(<Pill tone="danger">Danger</Pill>);
    expect(container.querySelector('.pill-danger')).toBeInTheDocument();
  });

  it('debe usar tono neutral por defecto', () => {
    const { container } = render(<Pill>Default</Pill>);
    expect(container.querySelector('.pill-neutral')).toBeInTheDocument();
  });
});

describe('Loader Component', () => {
  it('debe renderizar con label', () => {
    render(<Loader label="Cargando datos" />);
    expect(screen.getByText('Cargando datos')).toBeInTheDocument();
  });

  it('debe renderizar sin label', () => {
    const { container } = render(<Loader />);
    expect(container.querySelector('.loader')).toBeInTheDocument();
  });

  it('debe tener la clase loader', () => {
    const { container } = render(<Loader label="Test" />);
    expect(container.querySelector('.loader')).toBeInTheDocument();
  });
});

describe('EmptyState Component', () => {
  it('debe renderizar título y descripción', () => {
    render(
      <EmptyState 
        title="Sin datos" 
        description="No hay información disponible" 
      />
    );
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('No hay información disponible')).toBeInTheDocument();
  });

  it('debe renderizar acción cuando se proporciona', () => {
    render(
      <EmptyState 
        title="Sin datos" 
        description="Test" 
        action={<button>Acción</button>}
      />
    );
    expect(screen.getByText('Acción')).toBeInTheDocument();
  });

  it('debe renderizar sin acción', () => {
    render(<EmptyState title="Test" description="Descripción" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});

describe('StatCard Component', () => {
  it('debe renderizar label y valor', () => {
    render(<StatCard label="Total" value="100" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('debe renderizar helper cuando se proporciona', () => {
    render(<StatCard label="Test" value="50" helper="🔥" />);
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('debe renderizar sin helper', () => {
    render(<StatCard label="Test" value="50" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('debe aplicar tono cuando se proporciona', () => {
    const { container } = render(<StatCard label="Test" value="50" tone="success" />);
    expect(container.querySelector('.stat-card-success')).toBeInTheDocument();
  });
});
