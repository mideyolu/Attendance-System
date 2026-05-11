import { useState, useEffect, useCallback, useRef } from "react";
import { LivenessSession } from "../utils/live";
import {
    getEyePoints,
    getMouthPoints,
    LEFT_EYE,
    MOUTH,
} from "../utils/landmarks";

export const useLive = (isActive) => {
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState("IDLE");
    const [challenge, setChallenge] = useState(null);
    const [timeLeft, setTimeLeft] = useState(5);
    const [currentValue, setCurrentValue] = useState(0);

    const timerRef = useRef(null);

    // Create completely NEW randomized challenge every start
    const startLiveness = useCallback(() => {
        clearInterval(timerRef.current);

        const newSession = new LivenessSession();

        setSession(newSession);

        // ✅ Force fresh randomized challenge
        setChallenge(newSession.getChallenge());

        setStatus("PENDING");

        // Timer starts AFTER stabilization delay
        setTimeLeft(5);

        // Reset live metric
        setCurrentValue(0);
    }, []);

    // ✅ Timer starts ONLY when active and challenge actually pending
    useEffect(() => {
        if (status !== "PENDING" || !isActive) {
            clearInterval(timerRef.current);
            return;
        }

        clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0.1) {
                    clearInterval(timerRef.current);
                    setStatus("TIMEOUT");
                    return 0;
                }

                return +(prev - 0.1).toFixed(1);
            });
        }, 100);

        return () => clearInterval(timerRef.current);
    }, [status, isActive]);

    // Process landmarks safely
    const checkLiveness = useCallback(
        (landmarks) => {
            if (!session || status !== "PENDING" || !isActive) return;

            // Ignore invalid landmarks
            if (!landmarks || landmarks.length === 0) return;

            const eyePoints = getEyePoints(landmarks, LEFT_EYE);
            const mouthPoints = getMouthPoints(landmarks, MOUTH);

            // ignore incomplete landmark detection
            if (
                !eyePoints ||
                !mouthPoints ||
                eyePoints.length === 0 ||
                mouthPoints.length === 0
            ) {
                return;
            }

            const result = session.checkProgress(
                landmarks,
                eyePoints,
                mouthPoints
            );

            if (!result) return;

            const { status: resultStatus, value } = result;

            // Prevent random fallback to 0
            if (
                value !== undefined &&
                value !== null &&
                !Number.isNaN(value) &&
                value > 0
            ) {
                setCurrentValue(value);
            }

            if (resultStatus === "SUCCESS") {
                setStatus("SUCCESS");
                clearInterval(timerRef.current);
            }

            if (resultStatus === "TIMEOUT") {
                setStatus("TIMEOUT");
                clearInterval(timerRef.current);
            }
        },
        [session, status, isActive]
    );

    // ✅ FULL reset whenever liveness stops/modal closes
    useEffect(() => {
        if (!isActive) {
            clearInterval(timerRef.current);

            setSession(null);
            setStatus("IDLE");

            // ✅ Clears old challenge completely
            setChallenge(null);

            setTimeLeft(5);
            setCurrentValue(0);
        }
    }, [isActive]);

    return {
        challenge,
        status,
        timeLeft,
        currentValue,
        checkLiveness,
        startLiveness,
    };
};
