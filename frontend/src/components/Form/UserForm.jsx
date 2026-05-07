/* eslint-disable react/prop-types */
export default function UserForm({
    mode = "enroll",
    userData,
    setUserData,
    onStart,
    onStop,
    onSubmit,
    onPause,
    isProcessing,
    isCameraActive,
    isEnrolling,
    isVerified = false,
    confidence = 0,
     instruction,
    // challengeType is no longer needed here
}) {
    const isAttendance = mode === "attendance";
    const isEnroll = mode === "enroll";
    const isLocked = isAttendance;

    return (
        <div className="form-content">
            {/* HEADER */}
            <div className="form-header">
                <h3>{isAttendance ? "Attendance Details" : "User Details"}</h3>
                {isVerified && (
                    <div
                        className="verification-badge"
                        style={{
                            color: "#22c55e",
                            fontWeight: "bold",
                            marginTop: "5px",
                        }}
                    >
                        ✅ Verification Complete
                    </div>
                )}
            </div>

            {instruction && (
                <div
                    style={{
                        margin: "10px 0",
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#0f172a",
                        color: "white",
                        textAlign: "center",
                        fontWeight: "600",
                    }}
                >
                    {instruction}
                </div>
            )}

            {/* NAME */}
            <div className="input-group">
                <label className="input-label">Full Name</label>
                {/* Removed the inner span/metric-tag logic */}
                <input
                    className="custom-input"
                    value={userData.name || ""}
                    onChange={(e) =>
                        setUserData({ ...userData, name: e.target.value })
                    }
                    disabled={isLocked || isEnrolling}
                />
            </div>

            {/* REG NO */}
            <div className="input-group">
                <label className="input-label">Registration Number</label>
                <input
                    className="custom-input"
                    value={userData.regno || ""}
                    onChange={(e) =>
                        setUserData({ ...userData, regno: e.target.value })
                    }
                    disabled={isLocked || isEnrolling}
                />
            </div>

            {/* ENROLLMENT FIELDS */}
            {isEnroll && (
                <>
                    <div className="input-group">
                        <label className="input-label">Gender</label>
                        <select
                            className="custom-input"
                            value={userData.gender || "Male"}
                            onChange={(e) =>
                                setUserData({
                                    ...userData,
                                    gender: e.target.value,
                                })
                            }
                            disabled={isEnrolling}
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">IT Type</label>
                        <select
                            className="custom-input"
                            value={userData.itype || "SIWES"}
                            onChange={(e) =>
                                setUserData({
                                    ...userData,
                                    itype: e.target.value,
                                })
                            }
                            disabled={isEnrolling}
                        >
                            <option value="SIWES">SIWES</option>
                            <option value="NYSC">NYSC</option>
                        </select>
                    </div>
                </>
            )}

            {/* CONFIDENCE DISPLAY */}
            {isVerified && isAttendance && (
                <div
                    className="confidence-display"
                    style={{
                        margin: "10px 0",
                        padding: "10px",
                        background: "#0f172a",
                        borderRadius: "8px",
                        textAlign: "center",
                    }}
                >
                    Confidence: {confidence}%
                </div>
            )}

            {/* BUTTONS */}
            <div className="button-grid">
                {!isEnrolling && !isProcessing && !isVerified && (
                    <button className="btn btn-primary" onClick={onStart}>
                        {isAttendance ? "Start Verification" : "Start Capture"}
                    </button>
                )}

                {isEnrolling && !isVerified && (
                    <button className="btn btn-secondary" onClick={onPause}>
                        Pause
                    </button>
                )}

                {isCameraActive && (
                    <button className="btn btn-danger" onClick={onStop}>
                        Stop Camera
                    </button>
                )}

                {isVerified && isAttendance && (
                    <button
                        className="btn btn-success"
                        onClick={onSubmit}
                        style={{ width: "100%" }}
                    >
                        Submit Attendance
                    </button>
                )}

                {isProcessing && !isVerified && (
                    <button className="btn btn-secondary" disabled>
                        Processing...
                    </button>
                )}
            </div>
        </div>
    );
}
