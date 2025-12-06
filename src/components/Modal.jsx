import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function Modal({ open, title, description, children, actions, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    const node = dialogRef.current;
    if (node) {
      node.focus();
    }
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Cerrar"
        onClick={() => onClose?.()}
      />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
        </header>
        {description ? (
          <p id="modal-description" className="modal-description">
            {description}
          </p>
        ) : null}
        <div className="modal-content">{children}</div>
        {actions ? <div className="modal-actions">{actions}</div> : null}
        <button
          type="button"
          className="modal-close"
          aria-label="Cerrar"
          onClick={() => onClose?.()}
        >
          ×
        </button>
      </div>
    </>
  );
}

export default Modal;

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
  onClose: PropTypes.func,
};
