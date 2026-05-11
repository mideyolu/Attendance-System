/* eslint-disable react/prop-types */
import { useState } from "react";
import { exportToCSV, exportToExcel, exportToJSON } from "../utils/exportUtils";

export default function ExportButton({ data }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleExport = (type) => {
        if (type === "csv") exportToCSV(data);
        if (type === "excel") exportToExcel(data);
        if (type === "json") exportToJSON(data);
        setIsOpen(false);
    };

    return (
        <div style={{ position: "relative" }}>
            <button
                className="btn-add-user"
                onClick={() => setIsOpen(!isOpen)}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
                ⬇ Export
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "8px",
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        zIndex: 50,
                        minWidth: "140px",
                        overflow: "hidden",
                    }}
                >
                    <button
                        onClick={() => handleExport("csv")}
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "10px 16px",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            color: "#374151",
                        }}
                        onMouseEnter={(e) => (e.target.style.background = "#f3f4f6")}
                        onMouseLeave={(e) => (e.target.style.background = "none")}
                    >
                        📄 CSV
                    </button>
                    <button
                        onClick={() => handleExport("excel")}
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "10px 16px",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            color: "#374151",
                            borderTop: "1px solid #f3f4f6",
                        }}
                        onMouseEnter={(e) => (e.target.style.background = "#f3f4f6")}
                        onMouseLeave={(e) => (e.target.style.background = "none")}
                    >
                        📊 Excel (.xls)
                    </button>
                    <button
                        onClick={() => handleExport("json")}
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "10px 16px",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            color: "#374151",
                            borderTop: "1px solid #f3f4f6",
                        }}
                        onMouseEnter={(e) => (e.target.style.background = "#f3f4f6")}
                        onMouseLeave={(e) => (e.target.style.background = "none")}
                    >
                        💻 JSON
                    </button>
                </div>
            )}
        </div>
    );
}
