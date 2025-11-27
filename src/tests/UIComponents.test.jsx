import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Tag from '../components/Tag.jsx';
import Pill from '../components/Pill.jsx';
import StatCard from '../components/StatCard.jsx';

describe('Tag Component', () => {
  it('should render with default tone', () => {
    render(<Tag>Default</Tag>);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('should apply custom tone class', () => {
    const { container } = render(<Tag tone="danger">Critical</Tag>);
    expect(container.querySelector('.tag')).toHaveClass('tag-danger');
  });
});

describe('Pill Component', () => {
  it('should render pill content', () => {
    render(<Pill>Status</Pill>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should apply tone styling', () => {
    const { container } = render(<Pill tone="success">Active</Pill>);
    expect(container.querySelector('.pill')).toHaveClass('pill-success');
  });
});

describe('StatCard Component', () => {
  it('should display label and value', () => {
    render(<StatCard label="Total Alerts" value={42} />);
    
    expect(screen.getByText('Total Alerts')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should show helper text when provided', () => {
    render(<StatCard label="Incidents" value={5} helper="Last 24 hours" />);
    expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
  });

  it('should apply tone class', () => {
    const { container } = render(<StatCard label="Critical" value={3} tone="danger" />);
    expect(container.querySelector('.stat-card')).toHaveClass('stat-card-danger');
  });
});
