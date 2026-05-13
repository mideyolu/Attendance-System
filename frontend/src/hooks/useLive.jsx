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

    /**
     * Start new liveness session
     */
    const startLiveness = useCallback(() => {
        clearInterval(timerRef.current);

        const newSession = new LivenessSession();

        setSession(newSession);

        // new random challenge
        setChallenge(newSession.getChallenge());

        setStatus("PENDING");

        setTimeLeft(5);

        setCurrentValue(0);
    }, []);

    /**
     * Countdown timer
     */
    useEffect(() => {
        if (status !== "PENDING" || !isActive || !session) {
            clearInterval(timerRef.current);
            return;
        }

        clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - session.startTime) / 1000;
            const remaining = Math.max(0, 5 - elapsed);

            setTimeLeft(+remaining.toFixed(1));

            if (remaining <= 0) {
                clearInterval(timerRef.current);
                setStatus("TIMEOUT");
            }
        }, 100);

        return () => clearInterval(timerRef.current);
    }, [status, isActive, session]);
    // useEffect(() => {
    //     if (status !== "PENDING" || !isActive) {
    //         clearInterval(timerRef.current);
    //         return;
    //     }

    //     clearInterval(timerRef.current);

    //     timerRef.current = setInterval(() => {
    //         setTimeLeft((prev) => {
    //             if (prev <= 0.1) {
    //                 clearInterval(timerRef.current);
    //                 setStatus("TIMEOUT");
    //                 return 0;
    //             }

    //             return +(prev - 0.1).toFixed(1);
    //         });
    //     }, 100);

    //     return () => clearInterval(timerRef.current);
    // }, [status, isActive]);

    /**
     * Liveness check per frame
     */
    const checkLiveness = useCallback(
        (landmarks) => {
            if (!session || status !== "PENDING" || !isActive) return;

            if (!landmarks || landmarks.length === 0) return;

            const eyePoints = getEyePoints(landmarks, LEFT_EYE);
            const mouthPoints = getMouthPoints(landmarks, MOUTH);

            if (!eyePoints || !mouthPoints) return;

            const result = session.checkProgress(
                landmarks,
                eyePoints,
                mouthPoints
            );

            if (!result) return;

            const { status: resultStatus, value } = result;

            /**
             * IMPORTANT FIX:
             * Do NOT filter out negative yaw values anymore.
             * TURN_RIGHT = negative yaw in 3D model.
             */
            if (
                value !== undefined &&
                value !== null &&
                !Number.isNaN(value)
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

    /**
     * Reset when modal closes / inactive
     */
    useEffect(() => {
        if (!isActive) {
            clearInterval(timerRef.current);

            setSession(null);
            setStatus("IDLE");
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
