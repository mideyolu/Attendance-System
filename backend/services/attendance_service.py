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

THRESHOLD = 0.40


class AttendanceService:

    @staticmethod
    def process_attendance(images: list):

        logger.info("=" * 70)
        logger.info("[ATTENDANCE RECOGNITION STARTED]")
        logger.info(f"[INPUT] Frames received: {len(images)}")
        logger.info("=" * 70)

        if face_service.faiss_index is None:
            load_faiss_index()
            logger.info("[INIT] FAISS index loaded")

        votes = defaultdict(float)
        frame_count = defaultdict(int)

        now = datetime.now()
        current_date = now.strftime("%Y-%m-%d")

        # PROCESS FRAMES
        for i, img_str in enumerate(images):

            logger.info("-" * 60)
            logger.info(f"[FRAME {i+1}/{len(images)}] START")

            img = decode_image(img_str)

            if img is None:
                logger.warning(f"[FRAME {i+1}] Decode failed")
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            brightness = float(np.mean(gray))

            logger.info(
                f"[FRAME {i+1}] Brightness = {brightness:.2f}"
            )

            if brightness < 80:
                img = apply_clahe(img)
                logger.info(f"[FRAME {i+1}] CLAHE applied")

            emb = model.predict(img).reshape(1, -1)

            logger.info(
                f"[FRAME {i+1}] Embedding shape = {emb.shape}"
            )

            scores, indices = face_service.faiss_index.search(emb, 5)

            logger.info(f"[FRAME {i+1}] TOP MATCHES")

            best_score = float(scores[0][0])
            best_idx = int(indices[0][0])

            if best_idx != -1:

                user = face_service.id_map[best_idx]
                regno = user["regno"]

                logger.info(
                    f"🎯 BEST MATCH → {regno} | score={best_score:.4f}"
                )

                if best_score >= THRESHOLD:

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

            # DEBUG ALL CANDIDATES
            for score, idx in zip(scores[0], indices[0]):

                if idx == -1:
                    continue

                user = face_service.id_map[idx]

                logger.info(
                    f"→ candidate: "
                    f"{user['regno']} | score={score:.4f}"
                )

        # NO VALID FACE
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

        # FINAL DECISION
        sorted_votes = sorted(
            votes.items(),
            key=lambda x: x[1],
            reverse=True,
        )

        best_regno, best_score = sorted_votes[0]

        second_score = (
            sorted_votes[1][1]
            if len(sorted_votes) > 1
            else 0.0
        )

        frames_used = frame_count[best_regno]

        avg_score = (
            best_score / frames_used
            if frames_used > 0
            else 0
        )

        confidence_percent = round(avg_score, 2)

        margin_percent = round(
            ((best_score - second_score) / len(images)) * 100,
            2,
        )

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

        # IMPORTANT:
        # NO CSV SAVE HERE ANYMORE

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
    def submit_attendance(regno: str):

        logger.info("=" * 70)
        logger.info("[ATTENDANCE SUBMIT STARTED]")
        logger.info(f"[REGNO] {regno}")
        logger.info("=" * 70)

        current_date = datetime.now().strftime("%Y-%m-%d")

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

        if has_marked_attendance_today(regno):

            logger.warning(
                f"[SUBMIT SKIPPED] Already marked: {regno}"
            )

            return {
                "status": "already_marked",
            }

        # SAVE TO CSV HERE
        save_attendance_log(
            user=user_data,
            metric="faiss_voting_normalized",
            status="PRESENT",
            score=1.0,
            second_score=0.0,
        )

        logger.info(
            f"[SUCCESS] Attendance saved for {regno}"
        )

        return {
            "status": "success",
            "date": current_date,
        }
