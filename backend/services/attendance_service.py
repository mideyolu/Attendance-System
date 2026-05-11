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
from backend.db import has_marked_attendance_today, save_attendance_log

logger = logging.getLogger("attendance")


class AttendanceService:

    @staticmethod
    def process_attendance(images: list):

        logger.info("[REQUEST] Attendance triggered")

        if face_service.faiss_index is None:
            load_faiss_index()

        votes = defaultdict(float)
        frame_count = 0

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

        # =============================
        # FRAME PROCESSING
        # =============================
        for i, img_str in enumerate(images):

            img = decode_image(img_str)
            if img is None:
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            if np.mean(gray) < 80:
                img = apply_clahe(img)

            emb = model.predict(img).reshape(1, -1)

            scores, indices = face_service.faiss_index.search(emb, 5)

            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:
                    continue

                # ✅ FIX: id_map is a LIST
                user = face_service.id_map[idx]
                regno = user["regno"]

                votes[regno] += float(score)

            frame_count += 1

        # =============================
        # NO FACE CASE
        # =============================
        if frame_count == 0 or not votes:
            return {
                "regno": "Unknown",
                "name": "Unknown",
                "itype": "",
                "attendance_status": "no_face",
                "confidence": 0.0,
                "margin": 0.0,
                "date": timestamp
            }

        # TOP VOTE + MARGIN DEBUG
        # =============================
        sorted_votes = sorted(votes.items(), key=lambda x: x[1], reverse=True)

        best_regno, best_score = sorted_votes[0]
        second_score = sorted_votes[1][1] if len(sorted_votes) > 1 else 0.0

        confidence = best_score / frame_count
        margin = best_score - second_score

        # -----------------------------
        # 🔍 DEBUG: show ALL margins
        # -----------------------------
        logger.info("---- Vote Breakdown ----")

        for i, (regno, score) in enumerate(sorted_votes):
            next_score = sorted_votes[i + 1][1] if i + 1 < len(sorted_votes) else 0.0
            candidate_margin = score - next_score

            logger.info(
                f"[{i+1}] {regno} | score={score:.3f} | margin={candidate_margin:.3f}"
            )

        logger.info(
            f"Decision: {best_regno} | conf={confidence:.3f} | margin={margin:.3f}"
        )


        # =============================
        # UNKNOWN DETECTION
        # =============================
        if confidence < 0.70 or margin < 0.4:
            return {
                "regno": "Unknown",
                "name": "Unknown",
                "itype": "",
                "attendance_status": "unknown",
                "confidence": float(confidence),
                "margin": float(margin),
                "date": timestamp
            }

        # =============================
        # SAFE USER LOOKUP (FIXED)
        # =============================
        user = None
        for u in face_service.id_map:
            if u["regno"] == best_regno:
                user = u
                break

        if not user:
            return {
                "regno": "Unknown",
                "name": "Unknown",
                "itype": "",
                "attendance_status": "error",
                "confidence": float(confidence),
                "margin": float(margin),
                "date": timestamp
            }

        # =============================
        # DUPLICATE CHECK
        # =============================
        if has_marked_attendance_today(user["regno"]):
            return {
                "regno": user["regno"],
                "name": user["name"],
                "itype": user.get("itype", "SIWES"),
                "attendance_status": "already_marked",
                "confidence": float(confidence),
                "margin": float(margin),
                "date": timestamp
            }

        # =============================
        # SAVE ATTENDANCE (FIXED)
        # =============================
        save_attendance_log(
            user={
                "regno": user["regno"],
                "name": user["name"],
                "itype": user.get("itype", "SIWES"),
            },
            metric="facenet512_topk_voting",
            status="PRESENT",
            score=float(confidence)
        )

        logger.info(f"Attendance marked: {user['regno']}")

        # =============================
        # SUCCESS RESPONSE (ALWAYS VALID)
        # =============================
        return {
            "regno": user["regno"],
            "name": user["name"],
            "itype": user.get("itype", "SIWES"),
            "attendance_status": "present",
            "confidence": float(confidence),
            "margin": float(margin),
            "date": timestamp
        }
