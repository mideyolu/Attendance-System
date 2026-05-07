import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export default function useFaceModel() {
  const videoRef = useRef(null);
  const modelRef = useRef(null);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const model = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
        },
        runningMode: "VIDEO",
      });

      modelRef.current = model;
      setIsReady(true);
    };

    loadModel();
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const detect = () => {
    if (!modelRef.current || !videoRef.current) return null;

    return modelRef.current.detectForVideo(
      videoRef.current,
      performance.now()
    );
  };

  return {
    videoRef,
    isReady,
    startCamera,
    detect,
  };
}
