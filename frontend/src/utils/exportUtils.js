// src/utils/exportUtils.js

/**
 * Normalizes raw attendance data into a consistent format for export
 */
export const getFormattedAttendanceData = (data) => {
    if (!data || data.length === 0) return [];

    return data.map((row, index) => ({
        "S/N": row.sn || index + 1,
        "Reg Number": row.regno || "",
        Name: row.name || "Unknown",
        "IT Type": row.itype || "",
        Status: row.status || "",
        Date: row.date || "",
        Time: row.time || "",
    }));
};

/**
 * Generic helper to trigger browser download
 */
const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Exports data as CSV
 */
export const exportToCSV = (data, filenamePrefix = "attendance") => {
    const formattedData = getFormattedAttendanceData(data);
    if (formattedData.length === 0) return;

    const headers = Object.keys(formattedData[0]);
    const rows = formattedData.map((obj) =>
        headers
            .map((fieldName) => JSON.stringify(obj[fieldName], (key, val) => (val == null ? "" : val)))
            .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    triggerDownload(blob, `${filenamePrefix}_${Date.now()}.csv`);
};

/**
 * Exports data as Excel (.xls) using HTML table structure
 */
export const exportToExcel = (data, filenamePrefix = "attendance") => {
    const formattedData = getFormattedAttendanceData(data);
    if (formattedData.length === 0) return;

    const headers = Object.keys(formattedData[0]);

    let tableHTML = `
        <table border="1">
            <thead>
                <tr>${headers.map((h) => `<th style="background-color:#f2f2f2; font-weight:bold;">${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${formattedData
                    .map(
                        (row) =>
                            `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`
                    )
                    .join("")}
            </tbody>
        </table>
    `;

    const blob = new Blob([tableHTML], { type: "application/vnd.ms-excel" });
    triggerDownload(blob, `${filenamePrefix}_${Date.now()}.xls`);
};

/**
 * Exports data as JSON
 */
export const exportToJSON = (data, filenamePrefix = "attendance") => {
    const formattedData = getFormattedAttendanceData(data);
    if (formattedData.length === 0) return;

    const jsonContent = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });

    triggerDownload(blob, `${filenamePrefix}_${Date.now()}.json`);
};
