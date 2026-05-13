# attendance_service.py
import numpy as np
import cv2
import logging
from datetime import datetime
from collections import defaultdict

import backend.services.face_service as face_service
from backend.services.face_service import (
    model,
    decode_image,
    apply_clahe,
    load_faiss_index,
)

from backend.db import (
    has_marked_attendance_today,
    save_attendance_log,
)

logger = logging.getLogger("attendance")

# Minimum similarity score to accept a face match (0.0 to 1.0)
THRESHOLD = 0.40


class AttendanceService:

    @staticmethod
    def process_attendance(images: list):
        """
        Process multiple frames to recognize a user's face and determine attendance eligibility.

        Uses a voting mechanism across frames to increase accuracy:
        - Each frame that successfully recognizes a face adds votes
        - The user with the highest total vote wins
        - Margin between winner and runner-up indicates confidence

        Args:
            images: List of base64 encoded image frames

        Returns:
            dict: Recognition results including user info and attendance status
        """
        logger.info("=" * 70)
        logger.info("[ATTENDANCE RECOGNITION STARTED]")
        logger.info(f"[INPUT] Frames received: {len(images)}")
        logger.info("=" * 70)

        # Initialize FAISS index if not already loaded
        if face_service.faiss_index is None:
            load_faiss_index()
            logger.info("[INIT] FAISS index loaded")

        # Voting accumulators across all frames
        votes = defaultdict(float)      # Total weighted votes per user
        frame_count = defaultdict(int)  # Number of frames that recognized each user

        now = datetime.now()
        current_date = now.strftime("%Y-%m-%d")

        # Process each frame independently
        for i, img_str in enumerate(images):

            logger.info("-" * 60)
            logger.info(f"[FRAME {i+1}/{len(images)}] START")

            # Convert base64 to OpenCV image
            img = decode_image(img_str)

            if img is None:
                logger.warning(f"[FRAME {i+1}] Decode failed")
                continue

            # Check image quality
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            brightness = float(np.mean(gray))

            logger.info(
                f"[FRAME {i+1}] Brightness = {brightness:.2f}"
            )

            # Apply CLAHE to improve low-light face detection
            if brightness < 80:
                img = apply_clahe(img)
                logger.info(f"[FRAME {i+1}] CLAHE applied")

            # Generate face embedding
            emb = model.predict(img).reshape(1, -1)

            logger.info(
                f"[FRAME {i+1}] Embedding shape = {emb.shape}"
            )

            # Search FAISS index for top 5 closest matches
            scores, indices = face_service.faiss_index.search(emb, 5)

            logger.info(f"[FRAME {i+1}] TOP MATCHES")

            best_score = float(scores[0][0])
            best_idx = int(indices[0][0])

            # Check if we found any match
            if best_idx != -1:

                user = face_service.id_map[best_idx]
                regno = user["regno"]

                logger.info(
                    f"🎯 BEST MATCH → {regno} | score={best_score:.4f}"
                )

                # Only accept if confidence meets threshold
                if best_score >= THRESHOLD:
                    # Weight vote by confidence score
                    votes[regno] += best_score
                    frame_count[regno] += 1

                    logger.info(
                        f"✅ ACCEPTED → {regno}"
                    )
                else:
                    logger.warning(
                        f"❌ REJECTED → {regno} | "
                        f"score={best_score:.4f} < {THRESHOLD}"
                    )

            # Log all candidates for debugging
            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:
                    continue

                user = face_service.id_map[idx]
                logger.info(
                    f"→ candidate: "
                    f"{user['regno']} | score={score:.4f}"
                )

        # No valid faces detected in any frame
        if not votes:
            logger.warning("[RESULT] No valid faces detected")
            return {
                "regno": "Unknown",
                "name": "Unknown",
                "itype": "Unknown",
                "attendance_status": "unknown",
                "date": current_date,
                "confidence": 0.0,
                "margin": 0.0,
            }

        # Determine winner by highest accumulated votes
        sorted_votes = sorted(
            votes.items(),
            key=lambda x: x[1],
            reverse=True,
        )

        best_regno, best_score = sorted_votes[0]

        # Calculate margin over second place (if exists)
        second_score = (
            sorted_votes[1][1]
            if len(sorted_votes) > 1
            else 0.0
        )

        frames_used = frame_count[best_regno]

        # Calculate average confidence across frames
        avg_score = (
            best_score / frames_used
            if frames_used > 0
            else 0
        )

        confidence_percent = round(avg_score, 2)

        # Margin indicates how decisive the win was
        margin_percent = round(
            ((best_score - second_score) / len(images)) * 100,
            2,
        )

        # Fetch full user details
        user_data = next(
            (
                u
                for u in face_service.id_map
                if u["regno"] == best_regno
            ),
            None,
        )

        logger.info("=" * 70)
        logger.info("[FINAL RESULT]")
        logger.info(f"[WINNER] {best_regno}")
        logger.info(f"[CONFIDENCE] {confidence_percent}")
        logger.info(f"[MARGIN] {margin_percent}")
        logger.info("=" * 70)

        # Check if user already marked attendance today
        if has_marked_attendance_today(best_regno):
            logger.warning(
                f"[ALREADY MARKED] {best_regno}"
            )
            return {
                "regno": best_regno,
                "name": user_data.get("name", "Unknown"),
                "itype": user_data.get("itype", "Unknown"),
                "attendance_status": "already_marked",
                "date": current_date,
                "confidence": confidence_percent,
                "margin": margin_percent,
            }

        # User verified and eligible for attendance
        return {
            "regno": best_regno,
            "name": user_data.get("name", "Unknown"),
            "itype": user_data.get("itype", "Unknown"),
            "attendance_status": "verified",
            "date": current_date,
            "confidence": confidence_percent,
            "margin": margin_percent,
        }

    @staticmethod
    def submit_attendance(regno: str, confidence: float =1.0):
        """
        Finalize attendance submission for a verified user.

        Args:
            regno: Student registration number to mark attendance for

        Returns:
            dict: Submission status
        """
        logger.info("=" * 70)
        logger.info("[ATTENDANCE SUBMIT STARTED]")
        logger.info(f"[REGNO] {regno}")
        logger.info("=" * 70)

        current_date = datetime.now().strftime("%Y-%m-%d")

        # Retrieve user information from index
        user_data = next(
            (
                u
                for u in face_service.id_map
                if u["regno"] == regno
            ),
            None,
        )

        if not user_data:
            logger.error(
                f"[SUBMIT FAILED] User not found: {regno}"
            )
            return {
                "status": "unknown",
            }

        # Prevent duplicate submissions
        if has_marked_attendance_today(regno):
            logger.warning(
                f"[SUBMIT SKIPPED] Already marked: {regno}"
            )
            return {
                "status": "already_marked",
            }

        # Persist attendance record to CSV
        save_attendance_log(
            user=user_data,
            metric="faiss_voting_normalized",
            status="PRESENT",
            score=confidence,
            second_score=0.0,
        )

        logger.info(
            f"[SUCCESS] Attendance saved for {regno}"
        )

        return {
            "status": "success",
            "date": current_date,
        }
