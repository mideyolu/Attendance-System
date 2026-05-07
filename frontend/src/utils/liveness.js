// utils/liveness.js

// BASIC MATH
export const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

// EAR (Eye Aspect Ratio)
export const calculateEAR = (eye) => {
    if (!eye || eye.length < 6) return 0;
    const [p1, p2, p3, p4, p5, p6] = eye;
    const vertical1 = distance(p2, p6);
    const vertical2 = distance(p3, p5);
    const horizontal = distance(p1, p4);
    return (vertical1 + vertical2) / (2.0 * horizontal);
};

// MAR (Mouth Aspect Ratio)
export const calculateMAR = (mouth) => {
    if (!mouth || mouth.length < 8) return 0;
    const [p1, p2, p3, p4, p5, p6, p7, p8] = mouth;
    const vertical1 = distance(p3, p7);
    const vertical2 = distance(p4, p6);
    const horizontal = distance(p1, p5);
    return (vertical1 + vertical2) / (2.0 * horizontal);
};

export const estimateHeadPose = (landmarks) => {
    if (!landmarks || landmarks.length < 468)
        return { yaw: 0, pitch: 0, roll: 0 };

    // Key Landmark Indices
    const NOSE_TIP = 1;
    const CHIN = 152;
    const LEFT_EYE_INNER = 133;
    const RIGHT_EYE_INNER = 362;
    const LEFT_EYE_OUTER = 33;
    const RIGHT_EYE_OUTER = 263;
    const FOREHEAD_TOP = 10;

    const nose = landmarks[NOSE_TIP];
    const chin = landmarks[CHIN];
    const leftEyeInner = landmarks[LEFT_EYE_INNER];
    const rightEyeInner = landmarks[RIGHT_EYE_INNER];
    const leftEyeOuter = landmarks[LEFT_EYE_OUTER];
    const rightEyeOuter = landmarks[RIGHT_EYE_OUTER];
    const forehead = landmarks[FOREHEAD_TOP];

    // 1. YAW (Left/Right Turn)
    const distLeft = distance(nose, leftEyeOuter);
    const distRight = distance(nose, rightEyeOuter);

    // Simple ratio: (Right - Left) / (Right + Left)
    const yaw = (distRight - distLeft) / (distRight + distLeft);

    // 2. PITCH (Up/Down Tilt)
    const faceHeight = Math.abs(chin.y - forehead.y);
    const noseOffset = Math.abs(nose.y - forehead.y);

    const pitch = noseOffset / faceHeight - 0.5;

    // 3. ROLL (Head Tilt)
    const dy = rightEyeOuter.y - leftEyeOuter.y;
    const dx = rightEyeOuter.x - leftEyeOuter.x;
    const roll = Math.atan2(dy, dx); // Radians

    return { yaw, pitch, roll };
};



// Logic for challenge detection and scoring.
export const LIVENESS_CONFIG = {
  EAR_T: 0.21,
  MAR_T: 0.30,
  YAW_THRESHOLD: 0.08,
  YAW_DEADZONE: 0.02,
};

export const detectBlink = (avgEAR, wasBlinking) => {
  const isBlinking = avgEAR < LIVENESS_CONFIG.EAR_T;
  const triggered = isBlinking && !wasBlinking;
  return { triggered, isBlinking, progress: isBlinking ? 1 : 0 };
};

export const detectMouth = (valMAR) => {
  const isMouthOpen = valMAR > LIVENESS_CONFIG.MAR_T;
  return {
    isMouthOpen,
    progress: Math.min(valMAR / LIVENESS_CONFIG.MAR_T, 1)
  };
};

export const detectYaw = (yaw, activeChallenge, prevYawState) => {
  let currentYawState = "CENTER";
  if (yaw > LIVENESS_CONFIG.YAW_THRESHOLD) currentYawState = "RIGHT";
  else if (yaw < -LIVENESS_CONFIG.YAW_THRESHOLD) currentYawState = "LEFT";

  let triggered = false;
  let progress = 0;

  if (activeChallenge === "LEFT") {
    triggered = currentYawState === "LEFT" && prevYawState !== "LEFT";
    progress = yaw < -LIVENESS_CONFIG.YAW_DEADZONE
      ? Math.min(Math.abs(yaw) / LIVENESS_CONFIG.YAW_THRESHOLD, 1)
      : 0;
  } else if (activeChallenge === "RIGHT") {
    triggered = currentYawState === "RIGHT" && prevYawState !== "RIGHT";
    progress = yaw > LIVENESS_CONFIG.YAW_DEADZONE
      ? Math.min(yaw / LIVENESS_CONFIG.YAW_THRESHOLD, 1)
      : 0;
  }

  return { triggered, currentYawState, progress };
};

export const calculateMotion = (landmarks, prevLandmarks, history) => {
  const indices = [1, 152, 33, 263];
  let totalMove = 0;

  indices.forEach(idx => {
    const prev = prevLandmarks[idx];
    const curr = landmarks[idx];
    if (prev && curr) {
      totalMove += Math.abs(curr.x - prev.x) + Math.abs(curr.y - prev.y);
    }
  });

  const avgMove = totalMove / indices.length;
  const newHistory = [...history, avgMove].slice(-15);
  const historyAvg = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;

  return { historyAvg, newHistory };
};
