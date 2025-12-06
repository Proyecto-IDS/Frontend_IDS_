import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBox from '../components/SearchBox.jsx';

describe('SearchBox Component', () => {
  const defaultProps = {
    inputId: 'test-search',
    defaultValue: '',
    onSearch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default value', () => {
    render(<SearchBox {...defaultProps} defaultValue="test query" />);
    
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('test query');
  });

  it('should update value when typing', async () => {
    const user = userEvent.setup();
    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByRole('searchbox');
    await user.type(input, 'search term');
    
    expect(input).toHaveValue('search term');
  });

  it('should clear search input', async () => {
    const user = userEvent.setup();
    render(<SearchBox {...defaultProps} defaultValue="initial" />);
    
    const input = screen.getByRole('searchbox');
    await user.clear(input);
    
    expect(input).toHaveValue('');
  });
});
