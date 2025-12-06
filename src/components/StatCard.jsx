import { memo } from 'react';
import PropTypes from 'prop-types';

const StatCard = memo(function StatCard({ label, value, helper, tone = 'default' }) {
  return (
    <article className={`stat-card stat-card-${tone}`} aria-live="polite">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {helper ? <span className="stat-helper">{helper}</span> : null}
    </article>
  );
});

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  tone: PropTypes.string,
};

export default StatCard;
