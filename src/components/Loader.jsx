import { memo } from 'react';
import PropTypes from 'prop-types';

const Loader = memo(function Loader({ label = 'Cargando' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader-indicator" aria-hidden="true" />
      <span className="loader-label">{label}</span>
    </div>
  );
});

export default Loader;

Loader.propTypes = {
  label: PropTypes.string,
};
