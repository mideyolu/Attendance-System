export const enrollUser = async (payload) => {
    const res = await fetch("http://localhost:8000/enroll", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("API Response", data);

    return data;
};

export const getEnrollStats = async () => {
    const res = await fetch("http://localhost:8000/enroll/stats");
    return res.json();
};

export const recognizeUser = async (images) => {
    const res = await fetch("http://localhost:8000/attendance", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ images }),
    });

    const data = await res.json();
    console.log("API Response", data);

    return data;
};

// api.js

export const submitAttendance = async (regno, confidence) => {
    const res = await fetch("http://localhost:8000/attendance/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ regno, confidence }),
    });

    return res.json();
};

export const getAttendanceStats = async () => {
    const res = await fetch("http://localhost:8000/attendance/stats");
    return res.json();
};
