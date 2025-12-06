import PropTypes from 'prop-types';

function ThreatLevelIndicator({ prediction, attackProbability, state }) {
  // Calcular nivel de amenaza
  const getThreatLevel = () => {
    if (prediction === 'normal' && attackProbability < 0.3) {
      return { level: 'low', label: 'Bajo', color: '#10b981' };
    }
    if (attackProbability < 0.5) {
      return { level: 'medium', label: 'Medio', color: '#f59e0b' };
    }
    if (attackProbability < 0.8) {
      return { level: 'high', label: 'Alto', color: '#f97316' };
    }
    return { level: 'critical', label: 'Crítico', color: '#ef4444' };
  };
  
  const threat = getThreatLevel();
  
  return (
    <div className="threat-level-indicator">
      <div className="threat-header">
        <h4>🎯 Nivel de Amenaza Detectado</h4>
      </div>
      
      <div className="threat-visual">
        <div className="threat-bars">
          {['low', 'medium', 'high', 'critical'].map((level, idx) => (
            <div
              key={level}
              className={`threat-bar ${threat.level === level ? 'active' : ''}`}
              style={{
                backgroundColor: threat.level === level ? threat.color : 'var(--border)',
                height: `${(idx + 1) * 25}%`,
              }}
            />
          ))}
        </div>
        
        <div className="threat-details">
          <div 
            className="threat-level-badge"
            style={{ backgroundColor: threat.color }}
          >
            {threat.label}
          </div>
          
          <div className="threat-metrics">
            <div className="threat-metric">
              <span className="metric-label">Predicción:</span>
              <span className="metric-value">{prediction || 'N/A'}</span>
            </div>
            <div className="threat-metric">
              <span className="metric-label">Probabilidad:</span>
              <span className="metric-value">{(attackProbability * 100).toFixed(1)}%</span>
            </div>
            <div className="threat-metric">
              <span className="metric-label">Estado:</span>
              <span className="metric-value">{state || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ThreatLevelIndicator.propTypes = {
  prediction: PropTypes.string,
  attackProbability: PropTypes.number.isRequired,
  state: PropTypes.string,
};

export default ThreatLevelIndicator;
