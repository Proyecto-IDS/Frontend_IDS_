import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal.jsx';

function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'warn', onConfirm, onCancel, children }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('ConfirmDialog error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const actions = (
    <>
      <button type="button" className="btn subtle" onClick={onCancel} disabled={isLoading}>
        {cancelLabel}
      </button>
      <button type="button" className={`btn ${tone}`} onClick={handleConfirm} disabled={isLoading}>
        {isLoading ? 'Procesando...' : confirmLabel}
      </button>
    </>
  );

  return (
    <Modal open={open} title={title} description={description} onClose={onCancel} actions={actions}>
      {children}
    </Modal>
  );
}

export default ConfirmDialog;

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  tone: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  children: PropTypes.node,
};
