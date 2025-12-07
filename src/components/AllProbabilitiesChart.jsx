import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

// Helper to compute CSS variable string
const getProbabilityPercentage = (prob) => {
  return `${(prob * 100).toFixed(2)}%`;
};

function AllProbabilitiesChart({ probabilities }) {
  const [query, setQuery] = useState('');

  // Compute filtered entries (no TopN option anymore)
  const entries = useMemo(() => {
    const arr = Object.entries(probabilities ?? {}).sort(([, a], [, b]) => b - a);
    const trimmedQuery = query?.trim();
    if (trimmedQuery) {
      const q = trimmedQuery.toLowerCase();
      return arr.filter(([label]) => String(label).toLowerCase().includes(q));
    }
    return arr;
  }, [probabilities, query]);

  if (!probabilities || Object.keys(probabilities).length === 0) {
    return (
      <div className="all-probabilities-chart panel">
        <header>
          <h3>Todas las Probabilidades</h3>
        </header>
        <div style={{ padding: '1rem' }}>No hay probabilidades disponibles.</div>
      </div>
    );
  }

  return (
    <div className="all-probabilities-chart panel">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h3 style={{ margin: 0 }}>Todas las Probabilidades</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            aria-label="Buscar etiqueta"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elev)' }}
          />
        </div>
      </header>

      {/* Compact heatmap/grid view for many classes */}
      <ul className="ap-heatmap">
        {entries.map(([label, prob]) => {
          const percentage = getProbabilityPercentage(prob);
          return (
            <li
              key={label}
              className="ap-cell"
              title={`${label}: ${percentage}`}
            >
              <div
                className="ap-cell-inner"
                style={{ ['--p']: percentage }}
              >
                <div className="ap-cell-label">{label}</div>
                <div className="ap-cell-value">{percentage}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

AllProbabilitiesChart.propTypes = {
  probabilities: PropTypes.object,
};

export default AllProbabilitiesChart;
