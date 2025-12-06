import { useMemo } from 'react';
import './AlertsCharts.css';

// Configuración de rangos de probabilidad
const PROBABILITY_CONFIG = [
  { range: '0-20', color: '#28a745' },
  { range: '20-40', color: '#90ee90' },
  { range: '40-60', color: '#ffc107' },
  { range: '60-80', color: '#ff9800' },
  { range: '80-100', color: '#dc3545' },
];

// Estados considerados como resueltos
const RESOLVED_STATUSES = ['resolved', 'contenido', 'resuelto', 'cerrado', 'closed'];
const RESOLVED_ACTIONS = ['contenido', 'resolved'];

/**
 * AlertsCharts - Muestra diagramas de barras de alertas clasificadas por severidad
 * y estado de resolución. Se actualiza reactivamente cuando cambian los incidentes.
 */
function AlertsCharts({ incidents = [] }) {
  // Clasificar alertas por severidad y estado
  const chartData = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return {
        bySeverity: [
          { severity: 'CONOCIDO', count: 0, color: '#6c757d' },
          { severity: 'CRITICA', count: 0, color: '#dc3545' },
          { severity: 'FALSO-POSITIVO', count: 0, color: '#28a745' },
        ],
        byStatus: {
          resolved: 0,
          unresolved: 0,
        },
        byProbability: {
          '0-20': 0,
          '20-40': 0,
          '40-60': 0,
          '60-80': 0,
          '80-100': 0,
        },
      };
    }

    const bySeverity = {
      'CONOCIDO': 0,
      'CRITICA': 0,
      'FALSO-POSITIVO': 0,
    };

    let resolved = 0;
    let unresolved = 0;

    const probabilityBuckets = {
      '0-20': 0,
      '20-40': 0,
      '40-60': 0,
      '60-80': 0,
      '80-100': 0,
    };

    incidents.forEach((incident) => {
      const severity = (incident.severity || 'CONOCIDO').toUpperCase();
      
      if (severity === 'CRITICA') {
        bySeverity['CRITICA']++;
      } else if (severity === 'FALSO-POSITIVO') {
        bySeverity['FALSO-POSITIVO']++;
      } else {
        bySeverity['CONOCIDO']++;
      }

      // Verificar múltiples formas de identificar si está resuelto
      const status = (incident.status || '').toLowerCase();
      const actionTaken = (incident.actionTaken || '').toLowerCase();
      
      const isResolved = 
        RESOLVED_STATUSES.includes(status) ||
        RESOLVED_ACTIONS.includes(actionTaken) ||
        incident.meetingResolved === true;

      if (isResolved) {
        resolved++;
      } else {
        unresolved++;
      }

      // Clasificar por probabilidad de ataque
      const probability = incident.attackProbability ?? 0;
      const percentile = probability * 100;

      const PROBABILITY_RANGES = [
        { max: 20, key: '0-20' },
        { max: 40, key: '20-40' },
        { max: 60, key: '40-60' },
        { max: 80, key: '60-80' },
        { max: 100, key: '80-100' },
      ];

      const range = PROBABILITY_RANGES.find(r => percentile < r.max) || PROBABILITY_RANGES[4];
      probabilityBuckets[range.key]++;
    });

    const severityArray = [
      { severity: 'CONOCIDO', count: bySeverity['CONOCIDO'], color: '#6c757d' },
      { severity: 'CRITICA', count: bySeverity['CRITICA'], color: '#dc3545' },
      { severity: 'FALSO-POSITIVO', count: bySeverity['FALSO-POSITIVO'], color: '#28a745' },
    ];

    return {
      bySeverity: severityArray,
      byStatus: { resolved, unresolved },
      byProbability: probabilityBuckets,
    };
  }, [incidents]);

  const maxSeverity = Math.max(...chartData.bySeverity.map(s => s.count), 1);
  const maxProbability = Math.max(...Object.values(chartData.byProbability), 1);
  
  const totalAlerts = chartData.byStatus.resolved + chartData.byStatus.unresolved;
  const unclassifiedAlerts = Math.max(0, incidents.length - totalAlerts);
  
  // Si el total calculado es menor que el total de incidentes, 
  // significa que hay incidentes sin clasificar, así que los sumamos a sin solucionar
  const adjustedUnresolved = chartData.byStatus.unresolved + unclassifiedAlerts;
  const maxStatus = incidents.length || 1;

  return (
    <section className="alerts-charts">
      <div className="charts-grid">
        {/* Diagrama de barras verticales - Severidad */}
        <div className="chart-wrapper severity-chart">
          <h4>Alertas por Severidad</h4>
          <div className="bar-chart-vertical">
            {chartData.bySeverity.map((item) => {
              const percentage = maxSeverity > 0 ? (item.count / maxSeverity) * 100 : 0;
              return (
                <div key={item.severity} className="bar-column">
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        height: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                      title={`${item.severity}: ${item.count}`}
                    />
                  </div>
                  <div className="bar-label">{item.severity}</div>
                  <div className="bar-count">{item.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagrama de barras verticales - Probabilidad */}
        <div className="chart-wrapper probability-chart">
          <h4>Distribución de Probabilidad de Ataque</h4>
          <div className="bar-chart-vertical">
            {PROBABILITY_CONFIG.map(({ range, color }) => {
              const count = chartData.byProbability[range];
              const percentage = maxProbability > 0 ? (count / maxProbability) * 100 : 0;
              return (
                <div key={range} className="bar-column">
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        height: `${percentage}%`,
                        backgroundColor: color,
                      }}
                      title={`${range}%: ${count}`}
                    />
                  </div>
                  <div className="bar-label">{range}%</div>
                  <div className="bar-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagrama de barras horizontal - Estado */}
        <div className="chart-wrapper status-chart">
          <h4>Alertas Sin Solucionar</h4>
          <div className="bar-chart-horizontal">
            {/* Barra de No Solucionadas */}
            <div className="status-row">
              <div className="status-label">
                <span className="status-dot unresolved" />
                Sin Solucionar
              </div>
              <div className="bar-wrapper">
                <div
                  className="bar-fill unresolved"
                  style={{
                    width: `${(adjustedUnresolved / maxStatus) * 100}%`,
                  }}
                >
                  <span className="bar-text">{adjustedUnresolved}</span>
                </div>
              </div>
              <span className="count-label">{adjustedUnresolved}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AlertsCharts;
