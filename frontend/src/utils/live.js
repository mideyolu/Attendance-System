/**
 * Calculates Eye Aspect Ratio (EAR)
 * Threshold: < 0.20 usually indicates a blink (was 0.18, made slightly more lenient)
 */
export const calculateEar = (eyePoints) => {
  if (!eyePoints || eyePoints.length < 6) return 1.0;

  const v1 = Math.hypot(
    eyePoints[1].x - eyePoints[5].x,
    eyePoints[1].y - eyePoints[5].y,
  );
  const v2 = Math.hypot(
    eyePoints[2].x - eyePoints[4].x,
    eyePoints[2].y - eyePoints[4].y,
  );
  const h = Math.hypot(
    eyePoints[0].x - eyePoints[3].x,
    eyePoints[0].y - eyePoints[3].y,
  );

  if (h === 0) return 1.0;

  const ear = (v1 + v2) / (2.0 * h);
  return ear;
};

/**
 * Calculates Mouth Aspect Ratio (MAR)
 * Threshold: > 0.30 indicates a smile/open mouth
 */
export const calculateMar = (mouthPoints) => {
  if (!mouthPoints || mouthPoints.length < 8) return 0.0;

  const vertical = Math.hypot(
    mouthPoints[2].x - mouthPoints[6].x,
    mouthPoints[2].y - mouthPoints[6].y,
  );
  const horizontal = Math.hypot(
    mouthPoints[0].x - mouthPoints[4].x,
    mouthPoints[0].y - mouthPoints[4].y,
  );

  if (horizontal === 0) return 0.0;

  const mar = vertical / horizontal;
  return mar;
};

/**
 * Detects Head Pose Yaw (Left/Right)
 * Threshold: ±0.04
 */
export const detectHeadPose = (landmarks) => {
  if (!landmarks || landmarks.length < 263) return "CENTER";

  const noseTip = landmarks[1];
  const leftEyeCorner = landmarks[33];
  const rightEyeCorner = landmarks[263];

  const eyeCenter = {
    x: (leftEyeCorner.x + rightEyeCorner.x) / 2,
    y: (leftEyeCorner.y + rightEyeCorner.y) / 2,
  };

  const yaw = noseTip.x - eyeCenter.x;

  if (yaw < -0.04) return "TURN_RIGHT";
  if (yaw > 0.04) return "TURN_LEFT";
  return "CENTER";
};

/**
 * Liveness Manager
 */
export class LivenessSession {
  constructor() {
    const availableChallenges = ["BLINK", "TURN_LEFT", "TURN_RIGHT", "SMILE"];
    this.challenge =
      availableChallenges[
        Math.floor(Math.random() * availableChallenges.length)
      ];

    this.startTime = Date.now();
    this.CHALLENGE_TIMEOUT = 5000;
    this.isCompleted = false;
    this.isFailed = false;

    console.log("🎯 Liveness Challenge Started:", this.challenge);
  }

  getChallenge() {
    return this.challenge;
  }

  checkProgress(landmarks, eyePoints, mouthPoints) {
    if (this.isCompleted || this.isFailed) return null;

    if (Date.now() - this.startTime > this.CHALLENGE_TIMEOUT) {
      this.isFailed = true;
      console.warn("⏱️ Liveness Timeout");
      return "TIMEOUT";
    }

    let success = false;
    let currentValue = 0;

    switch (this.challenge) {
      case "BLINK":
        currentValue = calculateEar(eyePoints);
        if (currentValue < 0.2) success = true;
        break;
      case "SMILE":
        currentValue = calculateMar(mouthPoints);
        if (currentValue > 0.3) success = true; // ✅ LOWERED FROM 0.45 TO 0.30
        break;
      case "TURN_LEFT":
      case "TURN_RIGHT":
        const pose = detectHeadPose(landmarks);
        currentValue = pose;
        if (pose === this.challenge) success = true;
        break;
      default:
        break;
    }

    if (success) {
      this.isCompleted = true;
      console.log("✅ Liveness Success!");
      return "SUCCESS";
    }

    if (
      Math.floor((Date.now() - this.startTime) / 1000) >
      Math.floor((Date.now() - this.startTime - 100) / 1000)
    ) {
      console.log(`Waiting for ${this.challenge}... Current:`, currentValue);
    }

    return "PENDING";
  }
}
