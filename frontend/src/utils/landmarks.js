// src/utils/landmarks.js

// EYE LANDMARKS
export const LEFT_EYE = [33, 160, 158, 133, 153, 144];
export const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// MOUTH (outer lip points)
export const MOUTH = [61, 81, 13, 311, 291, 308, 14, 178];

// HEAD POSE LANDMARKS (Canonical points for PnP)
export const HEAD_POSE_POINTS = [1, 152, 33, 263, 61, 291];

// Functions to calculate EAR
export const getEyePoints = (landmarks, indices) => {
  return indices.map((i) => landmarks[i]);
};

// Function to calculate MAR
export const getMouthPoints = (landmarks, indices) => {
  return indices.map((i) => landmarks[i]);
};

// Function to extract specific points for pose estimation
export const getHeadPosePoints = (landmarks) => {
  return HEAD_POSE_POINTS.map((i) => landmarks[i]);
};
