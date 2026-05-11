import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "../../hooks/useCamera";
import { useFaceLoop } from "../../hooks/useFaceLoop";
import useFaceModel from "../../hooks/useFaceModel";
import { useLive } from "../../hooks/useLive";
import { useNumberAnimation } from "../../hooks/useNumberAnimation";
import { useTypingAnimation } from "../../hooks/useTypingAnimation";
import { recognizeUser } from "../../services/api";
import { captureFrame } from "../../utils/canvasUtils";
import CameraView from "../Camera/CameraView";
import UserForm from "../Form/UserForm";
import "./Attendance.css";
import toast from "react-hot-toast";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Attendance({ onClose, onAddUser, onAttendanceMarked }) {
  const { videoRef, detect } = useFaceModel();
  const canvasRef = useRef(null);
  const { startCamera, stopCamera } = useCamera(videoRef);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isStabilizing, setIsStabilizing] = useState(false);

  const [displayData, setDisplayData] = useState({
    name: "",
    regno: "",
    itype: "",
  });

  const [displayConfidence, setDisplayConfidence] = useState(0);
  const [animateCards, setAnimateCards] = useState(false);
  const [recognizedName, setRecognizedName] = useState("");

  const { typeText } = useTypingAnimation();
  const { animateNumber } = useNumberAnimation();

  const {
    challenge,
    status: livenessStatus,
    timeLeft,
    checkLiveness,
    startLiveness,
  } = useLive(isVerifying && !isStabilizing);

  // Check liveness when face is detected
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

  // Stop camera and reset all states
  const handleStopCamera = async () => {
    stopLoop();

    setIsVerifying(false);
    setIsVerified(false);
    setIsProcessing(false);
    setAnimateCards(false);

    setDisplayData({
      name: "",
      regno: "",
      itype: "",
    });

    setDisplayConfidence(0);

    stopCamera();

    const ok = await startCamera();
    setHasStarted(ok);
  };

  // Start camera when component mounts
  useEffect(() => {
    startCamera().then((ok) => ok && setHasStarted(true));
    return () => handleStopCamera();
  }, []);

  // Handle liveness check result
  useEffect(() => {
    if (livenessStatus === "SUCCESS") {
      processRecognition();
    } else if (livenessStatus === "TIMEOUT") {
      alert("Liveness check failed: Timeout");
      setIsVerifying(false);
      setIsProcessing(false);
    }
  }, [livenessStatus]);

  // Start verification process
  const handleStart = async () => {
    setIsVerifying(true);
    setIsProcessing(true);
    setIsVerified(false);
    setIsStabilizing(true);

    await delay(1200);
    setIsStabilizing(false);

    startLiveness();
  };

  // Capture multiple frames and recognize face
  const processRecognition = async () => {
    const images = [];

    for (let i = 0; i < 5; i++) {
      const image = captureFrame(videoRef.current, canvasRef.current);
      if (image) images.push(image);
      await delay(200);
    }

    if (images.length < 3) {
      alert("Not enough face samples");
      setIsProcessing(false);
      return;
    }

    try {
      const res = await recognizeUser(images);

      const name = res?.name || "";
      setRecognizedName(name);

      if (name && name.toLowerCase() !== "unknown") {
        setIsVerified(true);

        setDisplayData({ name: "", regno: "", itype: "" });

        await delay(400);

        setAnimateCards(true);

        // Animate name, regno, and itype typing
        await Promise.all([
          typeText(name, (v) => setDisplayData((p) => ({ ...p, name: v }))),
          typeText(res?.regno || "", (v) =>
            setDisplayData((p) => ({ ...p, regno: v })),
          ),
          typeText(res?.itype || "", (v) =>
            setDisplayData((p) => ({ ...p, itype: v })),
          ),
        ]);

        // Animate confidence number
        await animateNumber(
          Math.round(res?.confidence * 100),
          setDisplayConfidence,
        );
      } else {
        alert("Face not recognized");
        setIsProcessing(false);
        setIsVerifying(false);
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setIsVerifying(false);
    }
  };

  // Submit attendance when user clicks Submit button
  const handleAutoSubmit = () => {
    toast.success(`Attendance Marked for ${recognizedName} 🎉`);

    // Tell dashboard that attendance was actually submitted
    onAttendanceMarked?.();

    // Trigger modal refresh
    onAddUser?.();

    // Close modal
    onClose ? onClose() : handleStopCamera();
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
          onStop={handleStopCamera}
          onPause={() => setIsVerifying(false)}
          onSubmit={handleAutoSubmit}
          isProcessing={isProcessing}
          isCameraActive={isCameraActive}
          isVerified={isVerified}
          animateCards={animateCards}
          isVerifying={isVerifying}
          confidence={displayConfidence}
        />
      </div>
    </div>
  );
}
