/**
 * Calculates Eye Aspect Ratio (EAR)
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

    return (v1 + v2) / (2.0 * h);
};

/**
 * Calculates Mouth Aspect Ratio (MAR)
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

    return vertical / horizontal;
};

/**
 * 3D Head Pose Detection (ROBUST VERSION)
 * Uses depth (z) as primary signal + X for stability
 */
export const detectHeadPose = (landmarks) => {
    if (!landmarks || landmarks.length < 263) {
        return {
            pose: "CENTER",
            yaw: 0,
        };
    }

    const noseTip = landmarks[1];

    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    /**
     * Normalize face center
     */
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;

    /**
     * X-based shift (noisy but useful for direction hint)
     */
    const xOffset = noseTip.x - eyeCenterX;

    /**
     * Z-depth difference (MOST IMPORTANT)
     * stable indicator of head rotation
     */
    const zOffset = leftEye.z - rightEye.z;

    /**
     * Final yaw (weighted blend)
     * depth dominates, x stabilizes direction
     */
    const yaw = (zOffset * 0.8) + (xOffset * 0.2);

    let pose = "CENTER";

    /**
     * IMPORTANT:
     * Direction depends on camera mirroring
     * This mapping is corrected for typical MediaPipe webcam setup
     */
    if (yaw > 0.015) {
        pose = "TURN_LEFT";
    } else if (yaw < -0.015) {
        pose = "TURN_RIGHT";
    }

    return {
        pose,
        yaw,
    };
};

/**
 * Liveness Manager
 */
export class LivenessSession {
    constructor() {
        const availableChallenges = [
            "BLINK",
            "TURN_LEFT",
            "TURN_RIGHT",
            "SMILE",
        ];

        this.challenge =
            availableChallenges[
                Math.floor(Math.random() * availableChallenges.length)
            ];

        this.startTime = Date.now();

        this.CHALLENGE_TIMEOUT = 5000;

        this.isCompleted = false;
        this.isFailed = false;

        /**
         * Yaw smoothing
         */
        this.yawHistory = [];
    }

    getChallenge() {
        return this.challenge;
    }

    getSmoothedYaw(yaw) {
        this.yawHistory.push(yaw);

        if (this.yawHistory.length > 5) {
            this.yawHistory.shift();
        }

        return (
            this.yawHistory.reduce((a, b) => a + b, 0) /
            this.yawHistory.length
        );
    }

    checkProgress(landmarks, eyePoints, mouthPoints) {
        if (this.isCompleted || this.isFailed) {
            return { status: null, value: 0 };
        }

        /**
         * Timeout
         */
        if (Date.now() - this.startTime > this.CHALLENGE_TIMEOUT) {
            this.isFailed = true;

            return {
                status: "TIMEOUT",
                value: 0,
            };
        }

        let success = false;
        let currentValue = 0;

        switch (this.challenge) {
            case "BLINK": {
                currentValue = calculateEar(eyePoints);

                if (currentValue < 0.19) {
                    success = true;
                }

                break;
            }

            case "SMILE": {
                currentValue = calculateMar(mouthPoints);

                if (currentValue > 0.30) {
                    success = true;
                }

                break;
            }

            case "TURN_LEFT":
            case "TURN_RIGHT": {
                const { pose, yaw } = detectHeadPose(landmarks);

                /**
                 * Smooth yaw
                 */
                const smoothYaw = this.getSmoothedYaw(yaw);

                currentValue = smoothYaw;

                if (pose === this.challenge) {
                    success = true;
                }

                break;
            }

            default:
                break;
        }

        if (success) {
            this.isCompleted = true;

            return {
                status: "SUCCESS",
                value: currentValue,
            };
        }

        return {
            status: "PENDING",
            value: currentValue,
        };
    }
}
