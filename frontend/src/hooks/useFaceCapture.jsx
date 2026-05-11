import { useEffect, useRef } from "react";

export const useFaceCapture = ({
    isReady,
    isEnrolling,
    isAutoCapture = false,
    videoRef,
    canvasRef,
    detect,
    maxImages,
    currentCount,
    onCaptureComplete
}) => {
    const requestRef = useRef();
    const lastTimeRef = useRef(0);
    const lastCaptureTimeRef = useRef(0);
    const faceDetectedSinceRef = useRef(0);

    const CAPTURE_INTERVAL = 1500;
    const DETECTION_DELAY = 800;

    useEffect(() => {
        if (!isReady || !isEnrolling) return;

        const loop = (time) => {
            if (time - lastTimeRef.current < 33) {
                requestRef.current = requestAnimationFrame(loop);
                return;
            }
            lastTimeRef.current = time;

            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (!video || !canvas || video.readyState < 2) {
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (currentCount >= maxImages) {
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            const result = detect();
            const now = Date.now();

            if (result?.faceLandmarks?.length > 0) {
                const landmarks = result.faceLandmarks[0];
                let minX = 1, minY = 1, maxX = 0, maxY = 0;
                landmarks.forEach((lm) => {
                    if (lm.x < minX) minX = lm.x;
                    if (lm.y < minY) minY = lm.y;
                    if (lm.x > maxX) maxX = lm.x;
                    if (lm.y > maxY) maxY = lm.y;
                });

                if (faceDetectedSinceRef.current === 0) faceDetectedSinceRef.current = now;
                const timeFaceHasBeenVisible = now - faceDetectedSinceRef.current;

                const x = minX * canvas.width;
                const y = minY * canvas.height;
                const w = (maxX - minX) * canvas.width;
                const h = (maxY - minY) * canvas.height;

                // Bouding Box
                ctx.strokeStyle = "#00FF00";
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, w, h);

                // Add "Face Detected" text
                ctx.fillStyle = "#00FF00";
                ctx.font = "bold 16px Inter, Arial";
                // Position text 10px above the box, or at the top if box is too high
                ctx.fillText("Face Detected", x, y > 20 ? y - 10 : 20);

                // AUTO-CAPTURE LOGIC
                if (isAutoCapture) {
                    const isFaceStable = timeFaceHasBeenVisible >= DETECTION_DELAY;
                    const isIntervalReady = (now - lastCaptureTimeRef.current) >= CAPTURE_INTERVAL;

                    if (isFaceStable && isIntervalReady) {
                        const captureCanvas = document.createElement("canvas");
                        captureCanvas.width = 160;
                        captureCanvas.height = 160;
                        const captureCtx = captureCanvas.getContext("2d");

                        const padding = 0.2;
                        const srcX = Math.max(0, (minX - padding) * video.videoWidth);
                        const srcY = Math.max(0, (minY - padding) * video.videoHeight);
                        const srcW = Math.min(video.videoWidth - srcX, (maxX - minX + (padding * 2)) * video.videoWidth);
                        const srcH = Math.min(video.videoHeight - srcY, (maxY - minY + (padding * 2)) * video.videoHeight);

                        captureCtx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, 160, 160);
                        const img = captureCanvas.toDataURL("image/jpeg", 0.7);

                        lastCaptureTimeRef.current = now;
                        faceDetectedSinceRef.current = 0;
                        onCaptureComplete(img);
                    }
                }
            } else {
                faceDetectedSinceRef.current = 0;
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isReady, isEnrolling, isAutoCapture, detect, videoRef, canvasRef, onCaptureComplete, maxImages, currentCount]);
};
