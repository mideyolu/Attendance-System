import { useRef, useState, useCallback } from "react";
import { calculateEAR, calculateMAR, estimateHeadPose } from "../utils/liveness";
import { LEFT_EYE, RIGHT_EYE, MOUTH, getEyePoints, getMouthPoints } from "../utils/landmarks";
import * as Logic from "../utils/liveness";

export const useLiveness = () => {
  const [metrics, setMetrics] = useState({ ear: 0, mar: 0, motionScore: 0, livenessScore: 0 });
  const [progress, setProgress] = useState(0);
  const [counts, setCounts] = useState({ blink: 0, mouth: 0, left: 0, right: 0 });

  const state = useRef({
    prevEye: false,
    prevMouth: false,
    prevYaw: "CENTER",
    prevLandmarks: null,
    motionHistory: []
  });

  const resetCounts = useCallback(() => {
    setCounts({ blink: 0, mouth: 0, left: 0, right: 0 });
    setMetrics({ ear: 0, mar: 0, motionScore: 0, livenessScore: 0 });
    setProgress(0);
    state.current = { ...state.current, prevLandmarks: null, motionHistory: [], prevYaw: "CENTER" };
  }, []);

  const processLandmarks = useCallback((landmarks, activeChallenge) => {
    if (!landmarks) return;

    const { current } = state;

    // 1. Extract raw data
    const avgEAR = (calculateEAR(getEyePoints(landmarks, LEFT_EYE)) + calculateEAR(getEyePoints(landmarks, RIGHT_EYE))) / 2;
    const valMAR = getMouthPoints(landmarks, MOUTH).length > 0 ? calculateMAR(getMouthPoints(landmarks, MOUTH)) : 0;
    const { yaw } = estimateHeadPose(landmarks);

    let currentProgress = 0;
    let historyAvgValue = 0;

    // 2. Motion Scoring Logic
    if (current.prevLandmarks) {
      const { historyAvg, newHistory } = Logic.calculateMotion(landmarks, current.prevLandmarks, current.motionHistory);
      current.motionHistory = newHistory;
      historyAvgValue = historyAvg;
    }
    current.prevLandmarks = landmarks;

    // 3. Challenge Execution
    if (activeChallenge === "BLINK") {
      const { triggered, isBlinking, progress: p } = Logic.detectBlink(avgEAR, current.prevEye);
      if (triggered) setCounts(c => ({ ...c, blink: c.blink + 1 }));
      current.prevEye = isBlinking;
      currentProgress = p;
    }

    if (activeChallenge === "MOUTH") {
      const { isMouthOpen, progress: p } = Logic.detectMouth(valMAR);
      if (isMouthOpen && !current.prevMouth) setCounts(c => ({ ...c, mouth: c.mouth + 1 }));
      current.prevMouth = isMouthOpen;
      currentProgress = p;
    }

    if (activeChallenge === "LEFT" || activeChallenge === "RIGHT") {
      const { triggered, currentYawState, progress: p } = Logic.detectYaw(yaw, activeChallenge, current.prevYaw);
      if (triggered) {
        if (activeChallenge === "LEFT") setCounts(c => ({ ...c, left: 1 }));
        else setCounts(c => ({ ...c, right: 1 }));
      }
      current.prevYaw = currentYawState;
      currentProgress = p;
    }

    // 4. Consolidated UI State Updates
    setProgress(currentProgress);

    setMetrics(prev => {
      const newMotionScore = prev.motionScore * 0.9 + Math.min(historyAvgValue * 50, 1) * 0.1;
      return {
        ...prev,
        motionScore: newMotionScore,
        ear: avgEAR,
        mar: valMAR,
        livenessScore: activeChallenge ? Math.min(newMotionScore * 2, 0.4) : 1.0
      };
    });
  }, []); 

  return {
    ...metrics,
    ...counts,
    challengeProgress: progress,
    processLandmarks,
    resetCounts
  };
};
