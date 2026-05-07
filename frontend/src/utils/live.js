/**
 * Calculates Eye Aspect Ratio (EAR)
 * Threshold: < 0.20 usually indicates a blink (was 0.18, made slightly more lenient)
 */
export const calculateEar = (eyePoints) => {
  if (!eyePoints || eyePoints.length < 6) return 1.0; // Safety check

  // Vertical distances
  const v1 = Math.hypot(eyePoints[1].x - eyePoints[5].x, eyePoints[1].y - eyePoints[5].y);
  const v2 = Math.hypot(eyePoints[2].x - eyePoints[4].x, eyePoints[2].y - eyePoints[4].y);
  // Horizontal distance
  const h = Math.hypot(eyePoints[0].x - eyePoints[3].x, eyePoints[0].y - eyePoints[3].y);

  if (h === 0) return 1.0;

  const ear = (v1 + v2) / (2.0 * h);
  console.log("EAR:", ear); // Uncomment to debug in console
  return ear;
};

/**
 * Calculates Mouth Aspect Ratio (MAR)
 * Threshold: > 0.45 usually indicates a smile/open mouth (was 0.35, increased to avoid false positives from talking)
 */
export const calculateMar = (mouthPoints) => {
  if (!mouthPoints || mouthPoints.length < 8) return 0.0; // Safety check

  // Vertical distance (top to bottom lip center)
  // Using indices 2 (top) and 6 (bottom) from your 8-point array
  const vertical = Math.hypot(mouthPoints[2].x - mouthPoints[6].x, mouthPoints[2].y - mouthPoints[6].y);

  // Horizontal distance (left to right corner)
  // Using indices 0 (left) and 4 (right) from your 8-point array
  const horizontal = Math.hypot(mouthPoints[0].x - mouthPoints[4].x, mouthPoints[0].y - mouthPoints[4].y);

  if (horizontal === 0) return 0.0;

  const mar = vertical / horizontal;
  console.log("MAR:", mar); // Uncomment to debug in console
  return mar;
};

/**
 * Detects Head Pose Yaw (Left/Right)
 * Threshold: ±0.04 (slightly more sensitive than 0.05)
 */
export const detectHeadPose = (landmarks) => {
  if (!landmarks || landmarks.length < 263) return "CENTER";

  const noseTip = landmarks[1];
  const leftEyeCorner = landmarks[33];
  const rightEyeCorner = landmarks[263];

  const eyeCenter = {
    x: (leftEyeCorner.x + rightEyeCorner.x) / 2,
    y: (leftEyeCorner.y + rightEyeCorner.y) / 2
  };

  const yaw = noseTip.x - eyeCenter.x;

  console.log("Yaw:", yaw); // Uncomment to debug

  if (yaw < -0.04) return "TURN_RIGHT"; // Nose is left of center -> Turn Right
  if (yaw > 0.04) return "TURN_LEFT";   // Nose is right of center -> Turn Left
  return "CENTER";
};

/**
 * Liveness Manager
 */
export class LivenessSession {
  constructor() {
    const availableChallenges = ["BLINK", "TURN_LEFT", "TURN_RIGHT", "SMILE"];
    this.challenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];

    this.startTime = Date.now();
    this.CHALLENGE_TIMEOUT = 5000; // Increased to 5s to give user more time
    this.isCompleted = false;
    this.isFailed = false;

    console.log("🎯 Liveness Challenge Started:", this.challenge);
  }

  getChallenge() {
    return this.challenge;
  }

  checkProgress(landmarks, eyePoints, mouthPoints) {
    if (this.isCompleted || this.isFailed) return null;

    // Timeout Check
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
        if (currentValue < 0.20) success = true;
        break;
      case "SMILE":
        currentValue = calculateMar(mouthPoints);
        if (currentValue > 0.45) success = true;
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

    // Optional: Log progress every second to avoid spam
    if (Math.floor((Date.now() - this.startTime) / 1000) > Math.floor((Date.now() - this.startTime - 100) / 1000)) {
       console.log(`Waiting for ${this.challenge}... Current:`, currentValue);
    }

    return "PENDING";
  }
}
