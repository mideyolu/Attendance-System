/* eslint-disable react/prop-types */
import ExportButton from "../ExportButton";

export default function AttendanceTable({ data }) {
    return (
        <div className="table-container">
            <div className="table-header-bar">
                <h3>Attendance Records</h3>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Showing {data?.length || 0} records
                    </span>

                    <ExportButton data={data} />
                </div>
            </div>

            <div
                style={{
                    overflowX: "auto",
                    overflowY: "hidden",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color, #e5e7eb)",
                }}
            >
                <table className="custom-table" style={{ minWidth: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Name</th>
                            <th>Reg Number</th>
                            <th>IT Type</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Time</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data && data.length > 0 ? (
                            data.map((row, index) => (
                                <tr key={row.sn || index}>
                                    <td style={{ color: "var(--text-muted)" }}>{row.sn}</td>

                                    <td style={{ fontWeight: 600, fontFamily: "monospace" }}>
                                        {row.regno || "-"}
                                    </td>

                                    <td>{row.name || "Unknown"}</td>

                                    <td>
                                        <span
                                            className={`badge ${
                                                row.itype === "SIWES" ? "badge-siwes" : "badge-nysc"
                                            }`}
                                        >
                                            {row.itype || "-"}
                                        </span>
                                    </td>

                                    <td>
                                        <span
                                            className={`badge ${
                                                row.status === "PRESENT"
                                                    ? "badge-success"
                                                    : row.status === "UNKNOWN"
                                                    ? "badge-warning"
                                                    : "badge-danger"
                                            }`}
                                        >
                                            {row.status}
                                        </span>
                                    </td>

                                    <td style={{ color: "var(--text-muted)" }}>{row.date}</td>

                                    <td style={{ color: "var(--text-muted)" }}>{row.time}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="7"
                                    style={{
                                        textAlign: "center",
                                        padding: 32,
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    No attendance records available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
