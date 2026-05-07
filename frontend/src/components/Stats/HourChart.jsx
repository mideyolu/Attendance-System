/* eslint-disable react/prop-types */
export default function HourChart({ peakHour }) {
    return (
        <div className="chart-container">
            <div className="chart-header">Peak Activity Hour</div>

            <div className="peak-display">
                <span className="big-time">{peakHour}:00</span>
                <span className="time-suffix">HRS</span>
            </div>
        </div>
    );
}
