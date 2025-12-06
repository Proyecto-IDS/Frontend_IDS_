import { memo } from 'react';
import PropTypes from 'prop-types';

const toneLabels = {
  info: 'Información',
  success: 'Éxito',
  warn: 'Advertencia',
  danger: 'Error',
};

const Toast = memo(function Toast({ id, title, description, tone = 'info', onDismiss }) {
  return (
    <div className={`toast toast-${tone}`} role="status" aria-label={toneLabels[tone] || 'Aviso'}>
      <div className="toast-body">
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      <button
        type="button"
        className="toast-dismiss"
        onClick={() => onDismiss?.(id)}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
});

Toast.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  tone: PropTypes.string,
  onDismiss: PropTypes.func,
};

export default Toast;
