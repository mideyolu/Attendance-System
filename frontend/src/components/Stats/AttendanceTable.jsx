/* eslint-disable react/prop-types */
export default function AttendanceTable({ data }) {

    const handleExport = () => {
        if (!data || data.length === 0) return;

        const headers = [
            "S/N",
            "Reg Number",
            "Name",
            "IT Type",
            "Status",
            "Score",
            "Date",
            "Time",
        ];

        const rows = data.map((row, index) => [
            row.sn || index + 1,
            row.regno || "",
            row.name || "Unknown",
            row.itype || "",
            row.status || "",
            row.score ? Number(row.score).toFixed(4) : "",
            row.date || "",
            row.time || "",
        ]);

        const csvContent =
            [headers, ...rows]
                .map((e) => e.join(","))
                .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.setAttribute("download", `attendance_${Date.now()}.csv`);
        document.body.appendChild(link);

        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="table-container">
            <div className="table-header-bar">
                <h3>Attendance Records</h3>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Showing {data?.length || 0} records
                    </span>

                    {/* ✅ EXPORT BUTTON */}
                    <button className="btn-add-user" onClick={handleExport}>
                        ⬇ Export CSV
                    </button>
                </div>
            </div>

            <table className="custom-table">
                <thead>
                    <tr>
                        <th>S/N</th>
                        <th>Name</th>
                        <th>Reg Number</th>
                        <th>IT Type</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Date</th>
                        <th>Time</th>
                    </tr>
                </thead>

                <tbody>
                    {data && data.length > 0 ? (
                        data.map((row, index) => (
                            <tr key={row.sn || index}>
                                <td style={{ color: "var(--text-muted)" }}>
                                    {row.sn}
                                </td>

                                <td style={{ fontWeight: 600, fontFamily: "monospace" }}>
                                    {row.regno || "-"}
                                </td>

                                <td>{row.name || "Unknown"}</td>

                                <td>
                                    <span
                                        className={`badge ${
                                            row.itype === "SIWES"
                                                ? "badge-siwes"
                                                : "badge-nysc"
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

                                <td>
                                    {row.score ? Number(row.score).toFixed(4) : "-"}
                                </td>

                                <td style={{ color: "var(--text-muted)" }}>
                                    {row.date}
                                </td>

                                <td style={{ color: "var(--text-muted)" }}>
                                    {row.time}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="8"
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
    );
}
