import { useEffect, useRef, useState } from "react";
import "../../App.css";

import { useCamera } from "../../hooks/useCamera";
import { useFaceCapture } from "../../hooks/useFaceCapture";
import useFaceModel from "../../hooks/useFaceModel";
import { enrollUser } from "../../services/api";

import CameraView from "../Camera/CameraView";
import UserForm from "../Form/UserForm";

export default function Enrollment({ onClose }) {
  const { videoRef, isReady, detect } = useFaceModel();
  const canvasRef = useRef(null);
  const { streamRef, startCamera, stopCamera } = useCamera(videoRef);

  const sessionRef = useRef(0);
  const hasSubmittedRef = useRef(false);

  const maxImages = 10;
  const [count, setCount] = useState(0);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [images, setImages] = useState([]);
  const [instruction, setInstruction] = useState("");

  const [userData, setUserData] = useState({
    name: "",
    regno: "",
    gender: "Male",
    itype: "SIWES",
  });

  const isCameraActive = !!streamRef.current;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      clearCanvas();
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (!isEnrolling) {
      const prefix = userData.itype;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setUserData((prev) => ({
        ...prev,
        regno: `${prefix}-${randomNum}`,
      }));
    }
  }, [userData.itype, isEnrolling]);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.7);
  };

  const resetAll = () => {
    sessionRef.current += 1;
    setIsEnrolling(false);
    setImages([]);
    setCount(0);
    setInstruction("");
    hasSubmittedRef.current = false;
    clearCanvas();
  };

  const handleStart = async () => {
    if (!userData.name || !userData.regno) {
      alert("Fill required fields (Name & Reg No)");
      return;
    }

    resetAll();
    setIsEnrolling(true);
    // ✅ AUTO-SCROLL TO TOP OF MODAL
    const modalBody = document.querySelector(".modal-body");
    if (modalBody) {
      modalBody.scrollTo({ top: 0, behavior: "smooth" });
    }

    const currentSession = sessionRef.current;
    const collectedImages = [];

    try {
      const sequence = [
        { label: "Look straight 👀", count: 3 },
        { label: "Turn head LEFT ⬅️", count: 3 },
        { label: "Turn head RIGHT ➡️", count: 3 },
        { label: "Look slightly UP ⬆️", count: 1 },
      ];

      for (const step of sequence) {
        if (sessionRef.current !== currentSession) return;
        setInstruction(step.label);

        for (let i = 0; i < step.count; i++) {
          if (sessionRef.current !== currentSession) return;

          const img = captureFrame();
          if (img) {
            collectedImages.push(img);
            setImages([...collectedImages]);
            setCount(collectedImages.length);
          }
          await delay(1200);
        }
        await delay(200);
      }

      if (
        sessionRef.current === currentSession &&
        collectedImages.length >= maxImages
      ) {
        hasSubmittedRef.current = true;
        await enrollUser({
          user: userData,
          images: collectedImages,
        });
        alert("Enrollment Successful 🚀");
        onClose?.();
      }
    } catch (err) {
      if (sessionRef.current === currentSession) {
        alert("Enrollment Failed: " + err.message);
      }
    } finally {
      if (sessionRef.current === currentSession) {
        setIsEnrolling(false);
        setInstruction("");
      }
    }
  };

  const handleStop = async () => {
    resetAll();
    stopCamera();
    await startCamera();
  };

  const handlePause = () => {
    resetAll();
  };

  useFaceCapture({
    isReady,
    isEnrolling: true,
    isAutoCapture: false,
    videoRef,
    canvasRef,
    detect,
    maxImages,
    currentCount: count,
    onCaptureComplete: () => {},
  });

  const progressPercent = (count / maxImages) * 100;

  return (
    <div className="enrollment-card">
      <div className="camera-container">
        <CameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          isEnrolling={isEnrolling}
          isPaused={!isEnrolling}
        />
      </div>

      {instruction && (
        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            fontWeight: "600",
            color: "#fff",
          }}
        >
          {instruction}
        </div>
      )}

      <div className="progress-wrapper">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <div className="progress-text">
          {count} / {maxImages} Faces Captured
        </div>
      </div>

      <UserForm
        mode={"enroll"}
        userData={userData}
        setUserData={setUserData}
        isCameraActive={isCameraActive}
        isPaused={!isEnrolling}
        onStart={handleStart}
        onStop={handleStop}
        onPause={handlePause}
        instruction={instruction}
      />
    </div>
  );
}
