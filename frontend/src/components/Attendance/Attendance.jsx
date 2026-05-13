import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useCamera } from "../../hooks/useCamera";
import { useFaceLoop } from "../../hooks/useFaceLoop";
import useFaceModel from "../../hooks/useFaceModel";
import { useLive } from "../../hooks/useLive";
import { useNumberAnimation } from "../../hooks/useNumberAnimation";
import { useTypingAnimation } from "../../hooks/useTypingAnimation";
import { recognizeUser, submitAttendance } from "../../services/api";
import { captureFrame } from "../../utils/canvasUtils";
import CameraView from "../Camera/CameraView";
import UserForm from "../Form/UserForm";
import "./Attendance.css";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Attendance({ onClose, onAddUser }) {
    const { videoRef, detect } = useFaceModel();
    const canvasRef = useRef(null);
    const { startCamera, stopCamera } = useCamera(videoRef);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isStabilizing, setIsStabilizing] = useState(false);

    const [isSubmitted, setIsSubmitted] = useState(false);

    const [displayData, setDisplayData] = useState({
        name: "",
        regno: "",
        itype: "",
    });

    const [displayConfidence, setDisplayConfidence] = useState(0);
    const [animateCards, setAnimateCards] = useState(false);

    const { typeText } = useTypingAnimation();
    const { animateNumber } = useNumberAnimation();

    const {
        challenge,
        status: livenessStatus,
        timeLeft,
        currentValue,
        checkLiveness,
        startLiveness,
    } = useLive(isVerifying && !isStabilizing);

    const onFaceDetected = useCallback(
        (landmarks) => {
            if (isVerifying && !isStabilizing && livenessStatus === "PENDING") {
                checkLiveness(landmarks);
            }
        },
        [isVerifying, isStabilizing, livenessStatus, checkLiveness],
    );

    const { stopLoop } = useFaceLoop({
        videoRef,
        canvasRef,
        detect,
        isActive: isVerifying,
        onFaceDetected,
    });

    const isCameraActive = hasStarted;

    const handleStopCamera = async (shouldRestart = true) => {
        stopLoop();

        setIsVerifying(false);
        setIsVerified(false);
        setIsProcessing(false);
        setAnimateCards(false);
        setIsSubmitted(false);

        setDisplayData({
            name: "",
            regno: "",
            itype: "",
        });

        setDisplayConfidence(0);

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                ctx.clearRect(
                    0,
                    0,
                    canvasRef.current.width,
                    canvasRef.current.height,
                );
            }
        }

        stopCamera();

        if (shouldRestart) {
            const ok = await startCamera();
            setHasStarted(ok);
        } else {
            setHasStarted(false);
        }
    };

    useEffect(() => {
        startCamera().then((ok) => ok && setHasStarted(true));
        return () => handleStopCamera(false);
    }, []);

    useEffect(() => {
        if (livenessStatus === "SUCCESS") {
            processRecognition();
        } else if (livenessStatus === "TIMEOUT") {
            toast.error("Liveness check failed: Timeout");
            setIsVerifying(false);
            setIsProcessing(false);
            handleStopCamera(true);
        }
    }, [livenessStatus]);

    const handleStart = async () => {
        setIsSubmitted(false);

        setIsVerifying(true);
        setIsProcessing(true);
        setIsVerified(false);
        setIsStabilizing(true);

        await delay(1200);
        setIsStabilizing(false);

        startLiveness();
    };

    const processRecognition = async () => {
        const images = [];

        for (let i = 0; i < 5; i++) {
            const image = captureFrame(videoRef.current, canvasRef.current);
            if (image) images.push(image);
            await delay(200);
        }

        if (images.length < 3) {
            toast.error("Not enough face samples");
            setIsProcessing(false);
            setIsVerifying(false);
            handleStopCamera(true);
            return;
        }

        try {
            const res = await recognizeUser(images);

            const attendanceStatus = res?.attendance_status;

            if (attendanceStatus === "already_marked") {
                toast.info("Attendance already marked for today");
                setIsProcessing(false);
                setIsVerifying(false);
                handleStopCamera(true);
                return;
            }

            const name = res?.name || "";

            if (name && name.toLowerCase() !== "unknown") {
                setIsVerified(true);
                setIsVerifying(false);

                setDisplayData({ name: "", regno: "", itype: "" });

                await delay(400);

                setAnimateCards(true);

                await Promise.all([
                    typeText(name, (v) =>
                        setDisplayData((p) => ({ ...p, name: v })),
                    ),
                    typeText(res?.regno || "", (v) =>
                        setDisplayData((p) => ({ ...p, regno: v })),
                    ),
                    typeText(res?.itype || "", (v) =>
                        setDisplayData((p) => ({ ...p, itype: v })),
                    ),
                ]);

                await animateNumber(
                    Math.round(res?.confidence * 100),
                    setDisplayConfidence,
                );

                await delay(800);
            } else {
                const status = res?.attendance_status;
                const confidence = res?.confidence ?? 0;
                const margin = res?.margin ?? 0;

                let message = "Face verification failed";

                if (status === "no_face") {
                    message =
                        "No face detected. Please position your face properly.";
                } else if (status === "unknown") {
                    message =
                        `Face not recognized confidently. ` +
                        `(Confidence: ${confidence.toFixed(2)}, Margin: ${margin.toFixed(2)})`;
                } else if (status === "error") {
                    message =
                        "Recognition system could not identify this user.";
                }

                toast.error(message);

                setIsProcessing(false);
                setIsVerifying(false);

                handleStopCamera(true);
            }
        } catch (err) {
            console.error(err);
            setIsProcessing(false);
            setIsVerifying(false);
            handleStopCamera(true);
        }
    };

    const handleAutoSubmit = async () => {
        if (isSubmitted) return;

        setIsSubmitted(true);

        try {
            const res = await submitAttendance(displayData.regno, displayConfidence / 100);

            if (res.status === "success") {
                toast.success(`Attendance Marked for ${displayData.name} 🎉`);

                onAddUser?.();

                if (onClose) {
                    onClose();
                } else {
                    handleStopCamera(false);
                }
            } else if (res.status === "already_marked") {
                toast.info("Attendance already marked today");
            } else {
                toast.error("Failed to submit attendance");
            }
        } catch (err) {
            console.error(err);

            toast.error("Attendance submission failed");
        }
    };

    return (
        <div className="attendance-card">
            <div className="attendance-camera">
                <CameraView
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    isVerifying={isVerifying}
                    isPaused={!isVerifying && !hasStarted}
                    livenessInfo={{
                        isStabilizing,
                        challenge,
                        timeLeft,
                        status: livenessStatus,
                    }}
                />
            </div>

            <div className="attendance-form-content">
                <UserForm
                    mode="attendance"
                    userData={displayData}
                    setUserData={setDisplayData}
                    onStart={handleStart}
                    onStop={() => handleStopCamera(true)}
                    onPause={() => setIsVerifying(false)}
                    onSubmit={() => handleAutoSubmit(displayData.name, displayConfidence / 100)}
                    isProcessing={isProcessing}
                    isCameraActive={isCameraActive}
                    isVerified={isVerified}
                    animateCards={animateCards}
                    isVerifying={isVerifying}
                    confidence={displayConfidence}
                    challenge={challenge}
                    currentValue={currentValue}
                />
            </div>
        </div>
    );
}
