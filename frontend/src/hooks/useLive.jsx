import { useState, useEffect, useCallback, useRef } from "react";
import { LivenessSession } from "../utils/live";
import { getEyePoints, getMouthPoints, LEFT_EYE, MOUTH } from "../utils/landmarks";

export const useLive = (isActive) => {
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState("IDLE"); // IDLE, PENDING, SUCCESS, TIMEOUT
    const [challenge, setChallenge] = useState(null);
    const [timeLeft, setTimeLeft] = useState(4);

    const timerRef = useRef(null);

    // ================= INITIALIZE SESSION =================
    const startLiveness = useCallback(() => {
        const newSession = new LivenessSession();
        setSession(newSession);
        setChallenge(newSession.getChallenge());
        setStatus("PENDING");
        setTimeLeft(4);
    }, []);

    // ================= TIMER LOGIC =================
    useEffect(() => {
        if (status === "PENDING" && isActive) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 0.1) {
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return +(prev - 0.1).toFixed(1);
                });
            }, 100);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [status, isActive]);

    // ================= PROCESSING FRAME =================
    // FIX: Added 'session' to dependency array so it uses the current session instance
    const checkLiveness = useCallback((landmarks) => {
        if (!session || status !== "PENDING" || !isActive) return;

        const eyePoints = getEyePoints(landmarks, LEFT_EYE);
        const mouthPoints = getMouthPoints(landmarks, MOUTH);

        const result = session.checkProgress(landmarks, eyePoints, mouthPoints);

        if (result === "SUCCESS") {
            setStatus("SUCCESS");
            clearInterval(timerRef.current);
        } else if (result === "TIMEOUT") {
            setStatus("TIMEOUT");
            clearInterval(timerRef.current);
        }
    }, [session, status, isActive]);

    // Reset liveness when hook is disabled
    useEffect(() => {
        if (!isActive) {
            setSession(null);
            setStatus("IDLE");
            setChallenge(null);
            setTimeLeft(4);
        }
    }, [isActive]);

    return {
        challenge,
        status,
        timeLeft,
        checkLiveness,
        startLiveness,
    };
};
