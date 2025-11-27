import { memo } from 'react';
import PropTypes from 'prop-types';

const Tag = memo(function Tag({ tone = 'neutral', children }) {
  return (
    <span className={`tag tag-${tone}`} role="status">
      {children}
    </span>
  );
});

Tag.propTypes = {
  tone: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Tag;
