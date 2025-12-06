import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Toast from '../components/Toast.jsx';

describe('Modal Component', () => {
  const defaultProps = {
    open: true,
    title: 'Test Modal',
    description: 'Modal description',
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  it('should render when open', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<Modal {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should call onClose when clicking backdrop', async () => {
    const user = userEvent.setup();
    const { container } = render(<Modal {...defaultProps} />);
    
    const backdrop = container.querySelector('.modal-backdrop');
    await user.click(backdrop);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should render custom actions', () => {
    const actions = (
      <button type="button">Custom Action</button>
    );
    
    render(<Modal {...defaultProps} actions={actions} />);
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });
});

describe('ConfirmDialog Component', () => {
  const defaultProps = {
    open: true,
    title: 'Confirm Action',
    message: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render confirmation dialog', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    
    const confirmButton = screen.getByText(/confirmar/i);
    await user.click(confirmButton);
    
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    
    const cancelButton = screen.getByText(/cancelar/i);
    await user.click(cancelButton);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});

describe('Toast Component', () => {
  const defaultProps = {
    id: 'toast-1',
    title: 'Success',
    description: 'Operation completed',
    tone: 'success',
    onDismiss: vi.fn(),
  };

  it('should render toast notification', () => {
    render(<Toast {...defaultProps} />);
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('should apply correct tone class', () => {
    const { container } = render(<Toast {...defaultProps} tone="danger" />);
    expect(container.querySelector('.toast')).toHaveClass('toast-danger');
  });

  it('should call onDismiss when dismiss button clicked', async () => {
    const user = userEvent.setup();
    render(<Toast {...defaultProps} />);
    
    const dismissButton = screen.getByRole('button', { name: /cerrar/i });
    await user.click(dismissButton);
    
    expect(defaultProps.onDismiss).toHaveBeenCalledWith('toast-1');
  });
});
