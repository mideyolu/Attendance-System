// import { useCallback, useEffect, useRef } from "react";

// export const useFaceLoop = ({ videoRef, canvasRef, detect, isActive }) => {
//     const animationRef = useRef(null);

//     const drawLoop = useCallback(() => {
//         const video = videoRef.current;
//         const canvas = canvasRef.current;

//         if (!video || !canvas || video.readyState < 2) {
//             animationRef.current = requestAnimationFrame(drawLoop);
//             return;
//         }

//         const ctx = canvas.getContext("2d");

//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;

//         ctx.clearRect(0, 0, canvas.width, canvas.height);

//         const result = detect?.();

//         if (result?.faceLandmarks?.length > 0) {
//             const landmarks = result.faceLandmarks[0];

//             let minX = 1, minY = 1, maxX = 0, maxY = 0;

//             landmarks.forEach((lm) => {
//                 minX = Math.min(minX, lm.x);
//                 minY = Math.min(minY, lm.y);
//                 maxX = Math.max(maxX, lm.x);
//                 maxY = Math.max(maxY, lm.y);
//             });

//             const x = minX * canvas.width;
//             const y = minY * canvas.height;
//             const w = (maxX - minX) * canvas.width;
//             const h = (maxY - minY) * canvas.height;

//             ctx.strokeStyle = "#00FF00";
//             ctx.lineWidth = 3;
//             ctx.strokeRect(x, y, w, h);

//             ctx.fillStyle = "#00FF00";
//             ctx.fillText("Face Detected", x, y > 20 ? y - 10 : 20);
//         }

//         animationRef.current = requestAnimationFrame(drawLoop);
//     }, [detect]);

//     useEffect(() => {
//         if (!isActive) return;

//         animationRef.current = requestAnimationFrame(drawLoop);

//         return () => {
//             if (animationRef.current) {
//                 cancelAnimationFrame(animationRef.current);
//                 animationRef.current = null;
//             }
//         };
//     }, [isActive, drawLoop]);

//     const stopLoop = () => {
//         if (animationRef.current) {
//             cancelAnimationFrame(animationRef.current);
//             animationRef.current = null;
//         }

//         const canvas = canvasRef.current;
//         if (canvas) {
//             const ctx = canvas.getContext("2d");
//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//         }
//     };

//     return { stopLoop };
// };


import { useCallback, useEffect, useRef } from "react";

export const useFaceLoop = ({ videoRef, canvasRef, detect, isActive, onFaceDetected }) => {
    const animationRef = useRef(null);

    const drawLoop = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Safety check: if video isn't ready, keep looping but don't crash
        if (!video || !canvas || video.readyState < 2) {
            animationRef.current = requestAnimationFrame(drawLoop);
            return;
        }

        const ctx = canvas.getContext("2d");

        // Match canvas resolution to video resolution for accurate drawing
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Run Detection
        const result = detect?.();

        // 2. If landmarks found, draw AND send them to the parent
        if (result?.faceLandmarks?.length > 0) {
            const landmarks = result.faceLandmarks[0];

            // >>> CRITICAL FIX: Send landmarks to Attendance.jsx <<<
            if (onFaceDetected) {
                onFaceDetected(landmarks);
            }

            // Drawing Logic (Visual Feedback)
            let minX = 1, minY = 1, maxX = 0, maxY = 0;

            landmarks.forEach((lm) => {
                minX = Math.min(minX, lm.x);
                minY = Math.min(minY, lm.y);
                maxX = Math.max(maxX, lm.x);
                maxY = Math.max(maxY, lm.y);
            });

            const x = minX * canvas.width;
            const y = minY * canvas.height;
            const w = (maxX - minX) * canvas.width;
            const h = (maxY - minY) * canvas.height;

            ctx.strokeStyle = "#00FF00";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            ctx.fillStyle = "#00FF00";
            ctx.font = "14px Arial";
            ctx.fillText("Face Detected", x, y > 20 ? y - 10 : 20);
        } else {
            // Optional: Draw "No Face" text if needed
            ctx.fillStyle = "#FFF";
            ctx.font = "14px Arial";
            ctx.fillText("Scanning...", 10, 30);
        }

        animationRef.current = requestAnimationFrame(drawLoop);
    }, [detect, onFaceDetected]); // Added onFaceDetected to dependencies

    useEffect(() => {
        if (!isActive) return;

        animationRef.current = requestAnimationFrame(drawLoop);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [isActive, drawLoop]);

    const stopLoop = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return { stopLoop };
};
