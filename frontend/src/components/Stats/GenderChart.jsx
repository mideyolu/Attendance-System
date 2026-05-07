/* eslint-disable react/prop-types */
export default function GenderChart({ male, female }) {
  const total = male + female;
  const malePct = total === 0 ? 0 : Math.round((male / total) * 100);

  return (
    <div className="chart-container">
      <div className="chart-header">Gender Distribution</div>

      <div className="gender-visualizer">
        {/* CSS Donut Chart */}
        <div
          className="donut-chart"
          style={{ '--male-pct': `${malePct}%` }}
        >
          <div className="donut-inner">
            <span className="donut-total">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="legend-list">
          <div className="legend-item">
            <div className="dot dot-male"></div>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Male</div>
              <div>{male} ({malePct}%)</div>
            </div>
          </div>
          <div className="legend-item">
            <div className="dot dot-female"></div>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Female</div>
              <div>{female} ({100 - malePct}%)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
