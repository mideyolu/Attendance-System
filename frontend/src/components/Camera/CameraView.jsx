/* eslint-disable react/prop-types */
export default function CameraView({
    videoRef,
    canvasRef,
    isVerifying,
    isPaused,
    livenessInfo,
}) {
    const { isStabilizing, challenge, timeLeft, status } =
        livenessInfo || {};

    const showChallenge =
        isVerifying &&
        !isStabilizing &&
        status === "PENDING" &&
        challenge;

    const getChallengeText = (type) => {
        if (!type) return "";

        if (type === "BLINK") return "👁️ Blink";
        if (type === "SMILE") return "😊 Smile";
        if (type === "TURN_LEFT") return "⬅️ Turn Left";
        if (type === "TURN_RIGHT") return "➡️ Turn Right";

        return type;
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* VIDEO */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    background: "#000",
                }}
            />

            {/* CANVAS */}
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />

            {/* READY OVERLAY */}
            {isPaused && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.25)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 20,
                    }}
                >
                    <div
                        style={{
                            color: "white",
                            fontSize: "1rem",
                            background: "rgba(0,0,0,0.6)",
                            padding: "12px 18px",
                            borderRadius: "10px",
                            fontWeight: "600",
                        }}
                    >
                        Camera Ready — Click Start Verification
                    </div>
                </div>
            )}

            {/* STABILIZING OVERLAY */}
            {isStabilizing && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        padding: "15px 25px",
                        borderRadius: "12px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        zIndex: 40,
                    }}
                >
                    Stabilizing Face...
                </div>
            )}

            {/* CHALLENGE DISPLAY */}
            {showChallenge && (
                <div
                    style={{
                        position: "absolute",
                        top: "120px",
                        right: "20px",
                        background: "rgba(22, 163, 74, 0.95)",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "50px",
                        fontSize: "1.1rem",
                        fontWeight: "800",
                        zIndex: 50,
                        boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        border: "2px solid white",
                    }}
                >
                    <span>{getChallengeText(challenge)}</span>

                    <span
                        style={{
                            background: "rgba(0,0,0,0.3)",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.9rem",
                            fontFamily: "monospace",
                            minWidth: "40px",
                            textAlign: "center",
                            opacity: "0"
                        }}
                    >
                        {timeLeft !== undefined
                            ? timeLeft.toFixed(1)
                            : "0.0"}
                        s
                    </span>
                </div>
            )}

            {/* STATUS BADGE */}

            {isVerifying &&
                !isStabilizing &&
                status !== "PENDING" && (
                    <div
                        style={{
                            position: "absolute",
                            top: "15px",
                            right: "15px",
                            background: "#3b82f6",
                            color: "white",
                            padding: "8px 14px",
                            borderRadius: "999px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            zIndex: 30,
                        }}
                    >
                        Verifying...
                    </div>
                )}

            {isVerifying &&
                !isStabilizing &&
                status === "PENDING" && (
                    <div
                        style={{
                            position: "absolute",
                            top: "15px",
                            right: "15px",
                            background: "#3b82f6",
                            color: "white",
                            padding: "8px 14px",
                            borderRadius: "999px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            zIndex: 30,
                        }}
                    >
                        Verifying...
                    </div>
                )}
        </div>
    );
}
