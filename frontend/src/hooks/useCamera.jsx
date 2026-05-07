import { useCallback, useRef } from "react";

export const useCamera = (videoRef) => {
    const streamRef = useRef(null);

    const startCamera = useCallback(async () => {
        // Prevent duplicate streams
        if (streamRef.current && streamRef.current.active) {
            // If stream exists but video is paused/stopped, just resume it
            if (videoRef.current) {
                videoRef.current
                    .play()
                    .catch((e) => console.error("Play error:", e));
            }
            return true;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for metadata to load to ensure proper dimensions
                await new Promise((resolve) => {
                    if (videoRef.current.readyState >= 2) resolve();
                    else videoRef.current.onloadedmetadata = () => resolve();
                });
                await videoRef.current.play();
            }
            streamRef.current = stream;
            return true;
        } catch (err) {
            console.error("Error accessing camera:", err);
            return false;
        }
    }, [videoRef]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
            videoRef.current.load();
        }
    }, [videoRef]);

    const pauseCamera = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
    }, [videoRef]);

    const resumeCamera = useCallback(() => {
        if (videoRef.current && streamRef.current) {
            videoRef.current
                .play()
                .catch((err) => console.error("Resume failed:", err));
        }
    }, [videoRef]);

    return {
        streamRef,
        startCamera,
        stopCamera,
        pauseCamera,
        resumeCamera,
    };
};
