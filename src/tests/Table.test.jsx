import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Table from '../components/Table.jsx';

describe('Table Component', () => {
  const mockColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { key: 'status', label: 'Estado', render: (value) => value.toUpperCase() },
  ];

  const mockData = [
    { id: 1, name: 'Item 1', status: 'active' },
    { id: 2, name: 'Item 2', status: 'inactive' },
    { id: 3, name: 'Item 3', status: 'active' },
  ];

  it('should render table with data', () => {
    render(<Table columns={mockColumns} data={mockData} />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('should apply custom render function', () => {
    render(<Table columns={mockColumns} data={mockData} />);
    
    expect(screen.getAllByText('ACTIVE')).toHaveLength(2);
  });

  it('should show loading state', () => {
    render(<Table columns={mockColumns} data={[]} loading={true} />);
    
    expect(screen.getByText(/Cargando incidentes/i)).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<Table columns={mockColumns} data={[]} emptyMessage="No hay datos" />);
    
    expect(screen.getByText('No hay datos')).toBeInTheDocument();
  });

  it('should handle row click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        onRowClick={handleClick}
      />
    );
    
    const firstRow = screen.getByText('Item 1').closest('tr');
    await user.click(firstRow);
    
    expect(handleClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('should paginate data correctly', () => {
    const largeData = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      status: 'active',
    }));

    render(<Table columns={mockColumns} data={largeData} pageSize={5} />);
    
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Item 6')).not.toBeInTheDocument();
  });

  it('should navigate between pages', async () => {
    const user = userEvent.setup();
    const largeData = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      status: 'active',
    }));

    render(<Table columns={mockColumns} data={largeData} pageSize={5} />);
    
    const nextButton = screen.getByText('Siguiente');
    await user.click(nextButton);
    
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
    expect(screen.getByText('Item 6')).toBeInTheDocument();
  });

  it('should disable navigation buttons at boundaries', () => {
    render(<Table columns={mockColumns} data={mockData} pageSize={5} />);
    
    const prevButton = screen.getByText('Anterior');
    expect(prevButton).toBeDisabled();
  });
});
