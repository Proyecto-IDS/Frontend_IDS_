import { memo } from 'react';
import PropTypes from 'prop-types';

const Pill = memo(function Pill({ tone = 'neutral', children }) {
  return (
    <span className={`pill pill-${tone}`} role="status">
      {children}
    </span>
  );
});

Pill.propTypes = {
  tone: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Pill;
