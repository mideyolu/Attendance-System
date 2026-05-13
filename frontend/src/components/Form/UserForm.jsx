// import { useRef } from "react";
// /* eslint-disable react/prop-types */
// export default function UserForm({
//     mode = "enroll",
//     userData,
//     setUserData,
//     onStart,
//     onStop,
//     onSubmit,
//     onPause,
//     isProcessing,
//     isCameraActive,
//     isEnrolling,
//     isVerified = false,
//     confidence = 0,
//     instruction,
//     challenge,
//     currentValue = 0,
// }) {
//     const isAttendance = mode === "attendance";
//     const isEnroll = mode === "enroll";
//     const isLocked = isAttendance;

//     const lastValidRef = useRef(0);

//     const formatValue = () => {
//         if (!challenge) return "-";

//         const isValid =
//             currentValue !== undefined &&
//             currentValue !== null &&
//             !Number.isNaN(currentValue);

//         if (isValid) {
//             lastValidRef.current =
//                 lastValidRef.current * 0.7 + currentValue * 0.3;
//         }

//         return Number(lastValidRef.current.toFixed(2));
//     };

//     return (
//         <div className="form-content">
//             {/* HEADER */}
//             <div className="form-header">
//                 <h3>{isAttendance ? "Attendance Details" : "User Details"}</h3>
//                 {isVerified && (
//                     <div className="verification-badge">
//                         ✅ Verification Complete
//                     </div>
//                 )}

//                 {isAttendance && challenge && (
//                     <div
//                         style={{
//                             display: "flex",
//                             gap: "0.5rem",
//                             justifyContent: "flex-end",
//                             alignItems: "center",
//                             marginTop: "5px",
//                             fontSize: "0.9rem",
//                             color: "#cbd5e1",
//                         }}
//                     >
//                         <span>Challenge:</span>
//                         <span
//                             style={{
//                                 fontWeight: "bold",
//                                 color: "#38bdf8",
//                                 textTransform: "capitalize",
//                             }}
//                         >
//                             {challenge.replace(/_/g, " ")}
//                         </span>
//                         <span style={{ color: "#64748b" }}>|</span>
//                         <span>Value:</span>
//                         <span
//                             style={{
//                                 fontWeight: "bold",
//                                 color: "#fbbf24",
//                                 fontFamily: "monospace",
//                             }}
//                         >
//                             {formatValue()}
//                         </span>
//                     </div>
//                 )}
//             </div>

//             {instruction && (
//                 <div
//                     style={{
//                         margin: "10px 0",
//                         padding: "10px",
//                         borderRadius: "8px",
//                         background: "#0f172a",
//                         color: "white",
//                         textAlign: "center",
//                         fontWeight: "600",
//                     }}
//                 >
//                     {instruction}
//                 </div>
//             )}

//             {/* NAME */}
//             <div className="input-group">
//                 <label className="input-label">Full Name</label>
//                 <input
//                     className="custom-input"
//                     value={userData.name || ""}
//                     onChange={(e) =>
//                         setUserData({ ...userData, name: e.target.value })
//                     }
//                     disabled={isLocked || isEnrolling}
//                 />
//             </div>

//             {/* REG NO */}
//             <div className="input-group">
//                 <label className="input-label">Registration Number</label>
//                 <input
//                     className="custom-input"
//                     value={userData.regno || ""}
//                     onChange={(e) =>
//                         setUserData({ ...userData, regno: e.target.value })
//                     }
//                     disabled={isLocked || isEnrolling}
//                 />
//             </div>

//             {/* ENROLLMENT FIELDS */}
//             {isEnroll && (
//                 <>
//                     <div className="input-group">
//                         <label className="input-label">Gender</label>
//                         <select
//                             className="custom-input"
//                             value={userData.gender || "Male"}
//                             onChange={(e) =>
//                                 setUserData({
//                                     ...userData,
//                                     gender: e.target.value,
//                                 })
//                             }
//                             disabled={isEnrolling}
//                         >
//                             <option value="Male">Male</option>
//                             <option value="Female">Female</option>
//                         </select>
//                     </div>

//                     <div className="input-group">
//                         <label className="input-label">IT Type</label>
//                         <select
//                             className="custom-input"
//                             value={userData.itype || "SIWES"}
//                             onChange={(e) =>
//                                 setUserData({
//                                     ...userData,
//                                     itype: e.target.value,
//                                 })
//                             }
//                             disabled={isEnrolling}
//                         >
//                             <option value="SIWES">SIWES</option>
//                             <option value="NYSC">NYSC</option>
//                         </select>
//                     </div>
//                 </>
//             )}

//             {/* CONFIDENCE DISPLAY */}
//             {isVerified && isAttendance && (
//                 <div
//                     className="confidence-display"
//                     style={{
//                         margin: "10px 0",
//                         padding: "10px",
//                         background: "#",
//                         borderRadius: "8px",
//                         textAlign: "center",
//                     }}
//                 >
//                     Confidence: {confidence}%
//                 </div>
//             )}

//             {/* BUTTONS */}
//             <div className="button-grid">
//                 {!isEnrolling && !isProcessing && !isVerified && (
//                     <button className="btn btn-primary" onClick={onStart}>
//                         {isAttendance ? "Start Verification" : "Start Capture"}
//                     </button>
//                 )}

//                 {isEnrolling && !isVerified && (
//                     <button className="btn btn-secondary" onClick={onPause}>
//                         Pause
//                     </button>
//                 )}

//                 {isCameraActive && (
//                     <button className="btn btn-danger" onClick={onStop}>
//                         Stop Camera
//                     </button>
//                 )}

//                 {isVerified && isAttendance && (
//                     <button
//                         className="btn btn-success"
//                         onClick={onSubmit}
//                         style={{ width: "100%" }}
//                     >
//                         Submit Attendance
//                     </button>
//                 )}

//                 {isProcessing && !isVerified && (
//                     <button className="btn btn-secondary" disabled>
//                         Processing...
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// }


import { useRef, useEffect } from "react";
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
    challenge,
    currentValue = 0,
}) {
    const isAttendance = mode === "attendance";
    const isEnroll = mode === "enroll";
    const isLocked = isAttendance;

    // ✅ per-challenge smoothing refs
    const blinkRef = useRef(0);
    const smileRef = useRef(0);
    const yawRef = useRef(0);

    // 🔥 reset when challenge changes (VERY IMPORTANT)
    useEffect(() => {
        blinkRef.current = 0;
        smileRef.current = 0;
        yawRef.current = 0;
    }, [challenge]);

    const formatValue = () => {
        if (!challenge) return "-";

        const isValid =
            currentValue !== undefined &&
            currentValue !== null &&
            !Number.isNaN(currentValue);

        // fallback: return last stable value
        if (!isValid) {
            if (challenge === "BLINK") return blinkRef.current.toFixed(2);
            if (challenge === "SMILE") return smileRef.current.toFixed(2);
            return yawRef.current.toFixed(2);
        }

        // 🔥 per-challenge smoothing
        switch (challenge) {
            case "BLINK": {
                blinkRef.current =
                    blinkRef.current * 0.8 + currentValue * 0.2;
                return blinkRef.current.toFixed(2);
            }

            case "SMILE": {
                smileRef.current =
                    smileRef.current * 0.75 + currentValue * 0.25;
                return smileRef.current.toFixed(2);
            }

            case "TURN_LEFT":
            case "TURN_RIGHT": {
                yawRef.current =
                    yawRef.current * 0.7 + currentValue * 0.3;
                return yawRef.current.toFixed(2);
            }

            default:
                return Number(currentValue).toFixed(2);
        }
    };

    return (
        <div className="form-content">
            {/* HEADER */}
            <div className="form-header">
                <h3>{isAttendance ? "Attendance Details" : "User Details"}</h3>

                {isVerified && (
                    <div className="verification-badge">
                        ✅ Verification Complete
                    </div>
                )}

                {isAttendance && challenge && (
                    <div
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            marginTop: "5px",
                            fontSize: "0.9rem",
                            color: "#cbd5e1",
                        }}
                    >
                        <span>Challenge:</span>
                        <span
                            style={{
                                fontWeight: "bold",
                                color: "#38bdf8",
                                textTransform: "capitalize",
                            }}
                        >
                            {challenge.replace(/_/g, " ")}
                        </span>

                        <span style={{ color: "#64748b" }}>|</span>

                        <span>Value:</span>
                        <span
                            style={{
                                fontWeight: "bold",
                                color: "#fbbf24",
                                fontFamily: "monospace",
                            }}
                        >
                            {formatValue()}
                        </span>
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
