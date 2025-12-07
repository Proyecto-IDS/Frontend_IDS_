import { useMemo } from 'react';
import PropTypes from 'prop-types';

function ProbabilityDistribution({ probabilities }) {
  const topThreats = useMemo(() => {
    if (!probabilities) return [];
    
    return Object.entries(probabilities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .filter(([, value]) => value > 0);
  }, [probabilities]);
  
  if (!topThreats.length) {
    return (
      <div className="probability-distribution">
        <h4>Distribución de Amenazas</h4>
        <p style={{ padding: '1rem', color: 'var(--muted)' }}>
          No hay datos disponibles
        </p>
      </div>
    );
  }
  
  const maxValue = topThreats[0][1];
  
  return (
    <div className="probability-distribution">
      <h4>📈 Distribución de Amenazas (Top 8)</h4>
      
      <div className="distribution-bars">
        {topThreats.map(([threat, probability]) => (
          <div key={threat} className="distribution-item">
            <div className="distribution-header">
              <span className="threat-name">{threat}</span>
              <span className="threat-percentage">
                {(probability * 100).toFixed(2)}%
              </span>
            </div>
            
            <div className="distribution-bar-container">
              <div
                className="distribution-bar"
                style={{
                  width: `${(probability / maxValue) * 100}%`,
                  backgroundColor: probability > 0.5 ? '#ef4444' : probability > 0.3 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ProbabilityDistribution.propTypes = {
  probabilities: PropTypes.object,
};

export default ProbabilityDistribution;
