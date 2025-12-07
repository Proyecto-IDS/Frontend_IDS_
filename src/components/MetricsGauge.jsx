import PropTypes from 'prop-types';

function MetricsGauge({ value, label, max = 1, thresholds = { low: 0.3, medium: 0.7 } }) {
  const percentage = (value / max) * 100;
  const angle = (percentage / 100) * 180;
  
  // Determinar color basado en umbrales
  const getColor = () => {
    if (value < thresholds.low) return '#10b981'; // Verde
    if (value < thresholds.medium) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };
  
  const color = getColor();
  
  return (
    <div className="metrics-gauge">
      <div className="gauge-header">
        <h4>📊 Probabilidad de Ataque</h4>
      </div>
      
      <svg viewBox="0 0 200 120" className="gauge-svg">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Value arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.51} 251.2`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={100 + 70 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={100 + 70 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Center dot */}
        <circle cx="100" cy="100" r="6" fill={color} />
        
        {/* Value text */}
        <text
          x="100"
          y="110"
          textAnchor="middle"
          fill="var(--text)"
          fontSize="24"
          fontWeight="bold"
        >
          {(value * 100).toFixed(1)}%
        </text>
      </svg>
      
      <div className="gauge-label">{label}</div>
    </div>
  );
}

MetricsGauge.propTypes = {
  value: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  max: PropTypes.number,
  thresholds: PropTypes.shape({
    low: PropTypes.number,
    medium: PropTypes.number,
  }),
};

export default MetricsGauge;
