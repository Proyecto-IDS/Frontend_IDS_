import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Stepper from '../components/Stepper.jsx';

describe('Stepper Component', () => {
  const mockSteps = [
    { label: 'Paso 1', timestamp: '2024-12-01T10:00:00Z' },
    { label: 'Paso 2', timestamp: '2024-12-01T11:00:00Z' },
    { label: 'Paso 3', timestamp: '2024-12-01T12:00:00Z' },
  ];

  it('debe renderizar lista de pasos', () => {
    render(<Stepper steps={mockSteps} />);
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('Paso 2')).toBeInTheDocument();
    expect(screen.getByText('Paso 3')).toBeInTheDocument();
  });

  it('debe renderizar timestamps', () => {
    render(<Stepper steps={mockSteps} />);
    const times = screen.getAllByRole('time');
    expect(times.length).toBe(3);
  });

  it('debe renderizar array vacío sin errores', () => {
    const { container } = render(<Stepper steps={[]} />);
    expect(container.querySelector('.stepper')).toBeInTheDocument();
  });

  it('debe manejar pasos sin timestamp', () => {
    const stepsWithoutTime = [{ label: 'Paso sin tiempo' }];
    render(<Stepper steps={stepsWithoutTime} />);
    expect(screen.getByText('Paso sin tiempo')).toBeInTheDocument();
  });

  it('debe renderizar con un solo paso', () => {
    const singleStep = [{ label: 'Único paso', timestamp: '2024-12-01T10:00:00Z' }];
    render(<Stepper steps={singleStep} />);
    expect(screen.getByText('Único paso')).toBeInTheDocument();
  });
});
