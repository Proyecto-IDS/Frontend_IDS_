import PropTypes from 'prop-types';

// Helper to describe an arc path for SVG
function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + (radius * Math.cos(angleInRadians)),
    y: cy + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  const d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', cx, cy,
    'Z'
  ].join(' ');
  return d;
}

function Top5Probabilities({ probabilities, showHeader }) {
  const hasData = probabilities && typeof probabilities === 'object' && Object.keys(probabilities).length > 0;

  const entries = hasData
    ? Object.entries(probabilities).map(([k, v]) => ({ key: k, value: Number(v) || 0 }))
    : [];

  entries.sort((a, b) => b.value - a.value);
  const top5 = entries.slice(0, 5);
  const total = top5.reduce((s, it) => s + it.value, 0) || 1;

  const colors = ['#4b83e8', '#6aa6ff', '#7dd3fc', '#9be7a8', '#f6c85f'];

  // If the parent already provides a panel wrapper/header, allow hiding the internal header
  if (!showHeader) {
    return (
      <div className="top5-inner" style={{ padding: '0' }}>
        {(!hasData || top5.length === 0) ? (
          <div style={{ padding: '1.5rem', color: 'var(--muted)' }}>No hay datos disponibles.</div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
            <svg width={160} height={160} viewBox="0 0 160 160" aria-hidden>
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.08" />
                </filter>
              </defs>
              <g transform="translate(80,80)" filter="url(#shadow)">
                {(() => {
                  let start = 0;
                  const arcs = top5.map((item, idx) => {
                    const value = item.value;
                    const angle = (value / total) * 360;
                    const path = describeArc(0, 0, 64, start, start + angle);
                    const seg = (
                      <path key={item.key} d={path} fill={colors[idx % colors.length]} stroke="#fff" strokeWidth="0.5" />
                    );
                    start += angle;
                    return seg;
                  });
                  return arcs;
                })()}
                <circle cx={0} cy={0} r={34} fill="#fff" />
              </g>
            </svg>

            <div style={{ flex: 1 }}>
              {top5.map((it, i) => (
                <div key={it.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: colors[i % colors.length], display: 'inline-block' }} />
                    <strong style={{ fontSize: '0.95rem' }}>{it.key}</strong>
                  </div>
                  <span style={{ color: 'var(--muted)' }}>{((it.value / total) * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="panel top5-panel">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h4>Top 5 Probabilidades</h4>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Explicación del modelo</span>
      </header>

      {(!hasData || top5.length === 0) ? (
        <div style={{ padding: '1.5rem', color: 'var(--muted)' }}>No hay datos disponibles.</div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
          <svg width={160} height={160} viewBox="0 0 160 160" aria-hidden>
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.08" />
              </filter>
            </defs>
            <g transform="translate(80,80)" filter="url(#shadow)">
              {(() => {
                let start = 0;
                const arcs = top5.map((item, idx) => {
                  const value = item.value;
                  const angle = (value / total) * 360;
                  const path = describeArc(0, 0, 64, start, start + angle);
                  const seg = (
                    <path key={item.key} d={path} fill={colors[idx % colors.length]} stroke="#fff" strokeWidth="0.5" />
                  );
                  start += angle;
                  return seg;
                });
                return arcs;
              })()}
              {/* inner cutout to create donut */}
              <circle cx={0} cy={0} r={34} fill="#fff" />
            </g>
          </svg>

          <div style={{ flex: 1 }}>
            {top5.map((it, i) => (
              <div key={it.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 10, background: colors[i % colors.length], display: 'inline-block' }} />
                  <strong style={{ fontSize: '0.95rem' }}>{it.key}</strong>
                </div>
                <span style={{ color: 'var(--muted)' }}>{((it.value / total) * 100).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

Top5Probabilities.propTypes = {
  probabilities: PropTypes.object,
  showHeader: PropTypes.bool,
};

Top5Probabilities.defaultProps = {
  probabilities: null,
  showHeader: true,
};

export default Top5Probabilities;
