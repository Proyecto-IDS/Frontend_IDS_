import { memo } from 'react';
import PropTypes from 'prop-types';

const Stepper = memo(function Stepper({ steps = [], currentIndex = steps.length - 1 }) {
  return (
    <ol className="stepper">
      {steps.map((step, index) => (
        <li key={step.label} className={index <= currentIndex ? 'is-complete' : 'is-pending'}>
          <span className="step-label">{step.label}</span>
          {step.timestamp ? (
            <time dateTime={step.timestamp}>{new Date(step.timestamp).toLocaleString()}</time>
          ) : null}
        </li>
      ))}
    </ol>
  );
});

Stepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      timestamp: PropTypes.string,
    })
  ),
  currentIndex: PropTypes.number,
};

export default Stepper;
