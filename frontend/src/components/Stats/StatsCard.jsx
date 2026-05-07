/* eslint-disable react/prop-types */
export default function StatsCard({ title, value }) {
    return (
        <div className="stats-card">
            <div className="stats-label">{title}</div>
            <div className="stats-value">{value}</div>
        </div>
    );
}
