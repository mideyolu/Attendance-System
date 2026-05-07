import { useEffect, useRef, useState } from "react";
import { useCamera } from "../hooks/useCamera";
import useFaceModel from "../hooks/useFaceModel";
import { useLiveness } from "../hooks/useLiveness";

const ALL_CHALLENGES = ["BLINK", "MOUTH", "LEFT", "RIGHT"];

export default function LiveRecognition() {
    const { videoRef, isReady, detect } = useFaceModel();
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const { startCamera, stopCamera } = useCamera(videoRef);

    const {
        blink,
        mouth,
        left,
        right,
        motionScore,
        livenessScore,
        challengeProgress,
        processLandmarks,
        resetCounts,
    } = useLiveness();

    const [challenges, setChallenges] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeChallenge = challenges[currentIndex];

    // Initialize Challenges
    useEffect(() => {
        const shuffled = [...ALL_CHALLENGES]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        setChallenges(shuffled);
        resetCounts();
        startCamera();

        return () => {
            stopCamera();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [resetCounts, startCamera, stopCamera]);

    // Validation Logic using the correct hook return keys
    const isCompleted = (type) => {
        switch (type) {
            case "BLINK":
                return blink > 0;
            case "MOUTH":
                return mouth > 0;
            case "LEFT":
                return left > 0;
            case "RIGHT":
                return right > 0;
            default:
                return false;
        }
    };

    // Auto-Progress to next challenge
    useEffect(() => {
        if (activeChallenge && isCompleted(activeChallenge)) {
            const timer = setTimeout(() => setCurrentIndex((p) => p + 1), 600);
            return () => clearTimeout(timer);
        }
        // Dependencies updated to match the destructuring above
    }, [blink, mouth, left, right, activeChallenge]);

    // Main Detection Loop
    useEffect(() => {
        if (!isReady) return;

        const loop = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.readyState < 2) {
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            const result = detect();
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (result?.faceLandmarks?.length > 0) {
                const landmarks = result.faceLandmarks[0];

                // Process landmarks with the current challenge
                processLandmarks(landmarks, activeChallenge);

                // Simple Bounding Box Drawing
                let minX = 1,
                    minY = 1,
                    maxX = 0,
                    maxY = 0;
                landmarks.forEach((lm) => {
                    minX = Math.min(minX, lm.x);
                    minY = Math.min(minY, lm.y);
                    maxX = Math.max(maxX, lm.x);
                    maxY = Math.max(maxY, lm.y);
                });
                ctx.strokeStyle = "#00FF00";
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    minX * canvas.width,
                    minY * canvas.height,
                    (maxX - minX) * canvas.width,
                    (maxY - minY) * canvas.height,
                );
            }
            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isReady, activeChallenge, processLandmarks, detect]);

    return (
        <div
            style={{
                textAlign: "center",
                fontFamily: "sans-serif",
                padding: "20px",
            }}
        >
            <div
                style={{
                    position: "relative",
                    display: "inline-block",
                    border: "4px solid #333",
                    borderRadius: "16px",
                    overflow: "hidden",
                }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    width={400}
                    height={300}
                    style={{ background: "#000", display: "block" }}
                />
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={300}
                    style={{ position: "absolute", top: 0, left: 0 }}
                />
            </div>

            <div style={{ marginTop: "20px", minHeight: "100px" }}>
                {activeChallenge ? (
                    <>
                        <h2 style={{ color: "#333" }}>
                            {activeChallenge === "BLINK" &&
                                "Blink Your Eyes 👁️"}
                            {activeChallenge === "MOUTH" &&
                                "Open Your Mouth 😮"}
                            {activeChallenge === "LEFT" && "Turn Head Left 👈"}
                            {activeChallenge === "RIGHT" &&
                                "Turn Head Right 👉"}
                        </h2>

                        <div
                            style={{
                                width: "200px",
                                height: "10px",
                                background: "#eee",
                                margin: "15px auto",
                                borderRadius: "5px",
                                overflow: "hidden",
                                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
                            }}
                        >
                            <div
                                style={{
                                    width: `${challengeProgress * 100}%`,
                                    height: "100%",
                                    background: "#00FF00",
                                    transition: "width 0.2s ease-out",
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <div style={{ animation: "fadeIn 0.5s ease-in" }}>
                        <h2 style={{ color: "#00C853" }}>
                            ✅ Verification Complete
                        </h2>
                        <p>Face liveness confirmed.</p>
                    </div>
                )}
            </div>

            <div
                style={{
                    background: "#f9f9f9",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    display: "inline-flex",
                    gap: "20px",
                    marginTop: "10px",
                    fontSize: "14px",
                    color: "#666",
                    border: "1px solid #ddd",
                }}
            >
                <span>
                    Motion: <strong>{motionScore.toFixed(2)}</strong>
                </span>
                <span>
                    Liveness: <strong>{livenessScore.toFixed(2)}</strong>
                </span>
            </div>
        </div>
    );
}
