# import numpy as np
# import cv2
# import logging
# from datetime import datetime
# from collections import defaultdict

# import backend.services.face_service as face_service
# from backend.services.face_service import (
#     model,
#     decode_image,
#     apply_clahe,
#     load_faiss_index,
# )
# from backend.db import has_marked_attendance_today, save_attendance_log

# logger = logging.getLogger("attendance")


# class AttendanceService:

#     @staticmethod
#     def process_attendance(images: list):

#         logger.info("====================================")
#         logger.info("[REQUEST] Attendance triggered")
#         logger.info(f"Incoming frames: {len(images)}")

#         # =============================
#         # INIT FAISS
#         # =============================
#         if face_service.faiss_index is None:
#             logger.info("[INIT] Loading FAISS index...")
#             load_faiss_index()
#             logger.info("[INIT] FAISS index loaded")

#         votes = defaultdict(float)
#         frame_count = 0

#         # Track how many frames each user appears in (Consistency Check)
#         frame_appearances = defaultdict(int)

#         timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

#         # =============================
#         # CONFIG
#         # =============================
#         K = 10
#         # RAISED THRESHOLD: 0.65 ensures only strong matches count
#         THRESHOLD = 0.65
#         HARD_THRESHOLD = 0.65

#         logger.info(f"[CONFIG] K={K}, THRESHOLD={THRESHOLD}")

#         # =============================
#         # FRAME PROCESSING
#         # =============================
#         for i, img_str in enumerate(images):

#             logger.info(f"--- Processing frame {i+1}/{len(images)} ---")

#             img = decode_image(img_str)
#             if img is None:
#                 logger.warning(f"[FRAME {i}] decode failed")
#                 continue

#             gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#             brightness = np.mean(gray)

#             logger.info(f"[FRAME {i}] brightness={brightness:.2f}")

#             if brightness < 80:
#                 logger.info(f"[FRAME {i}] low light → CLAHE applied")
#                 img = apply_clahe(img)

#             emb = model.predict(img).reshape(1, -1)
#             scores, indices = face_service.faiss_index.search(emb, K)

#             logger.info(f"[FRAME {i}] FAISS top-{K} retrieved")

#             frame_votes = defaultdict(float)
#             frame_best_regno = None
#             frame_best_score = -1.0

#             # =============================
#             # TEMPORAL WEIGHT
#             # =============================
#             weight = 0.6 + (i / len(images))

#             # =============================
#             # K-VOTING
#             # =============================
#             for score, idx in zip(scores[0], indices[0]):

#                 if idx == -1:
#                     continue

#                 # Strict Threshold Check
#                 if score < THRESHOLD:
#                     continue

#                 user = face_service.id_map[idx]
#                 regno = user["regno"]

#                 # Track appearances for consistency check
#                 frame_appearances[regno] += 1

#                 # Track who won this specific frame
#                 if score > frame_best_score:
#                     frame_best_score = score
#                     frame_best_regno = regno

#                 vote_value = score - THRESHOLD
#                 votes[regno] += vote_value * weight
#                 frame_votes[regno] += vote_value * weight

#             logger.info(f"[FRAME {i}] frame votes: {dict(frame_votes)}")
#             if frame_best_regno:
#                 logger.info(f"[FRAME {i}] Frame Winner: {frame_best_regno} ({frame_best_score:.4f})")

#             frame_count += 1

#         # =============================
#         # NO FACE CASE
#         # =============================
#         if frame_count == 0 or not votes:
#             logger.warning("[RESULT] No valid faces detected")
#             return {
#                 "regno": "Unknown",
#                 "name": "Unknown",
#                 "itype": "",
#                 "attendance_status": "no_face",
#                 "confidence": 0.0,
#                 "margin": 0.0,
#                 "date": timestamp,
#             }

#         # =============================
#         # SORT VOTES
#         # =============================
#         sorted_votes = sorted(votes.items(), key=lambda x: x[1], reverse=True)

#         logger.info("==== FINAL VOTE SUMMARY ====")
#         for i, (regno, score) in enumerate(sorted_votes):
#             logger.info(f"[{i+1}] {regno} → {score:.4f} (Appeared in {frame_appearances[regno]} frames)")

#         best_regno, best_score = sorted_votes[0]
#         second_score = sorted_votes[1][1] if len(sorted_votes) > 1 else 0.0

#         # =============================
#         # STABLE CONFIDENCE
#         # =============================
#         confidence = best_score / (best_score + second_score + 1e-6)
#         margin = best_score - second_score

#         logger.info(
#             f"[DECISION] best={best_regno}, score={best_score:.4f}, "
#             f"confidence={confidence:.4f}, margin={margin:.4f}"
#         )

#         # =============================
#         # STRICT UNKNOWN DETECTION
#         # =============================

#         # 1. Consistency Check: Must appear in at least 3 frames (60% of 5)
#         min_frames_required = 3
#         if frame_appearances[best_regno] < min_frames_required:
#             logger.warning(f"[DECISION] UNKNOWN: {best_regno} only appeared in {frame_appearances[best_regno]} frames")
#             return {
#                 "regno": "Unknown",
#                 "name": "Unknown",
#                 "itype": "",
#                 "attendance_status": "unknown",
#                 "confidence": float(confidence),
#                 "margin": float(margin),
#                 "date": timestamp,
#             }

#         # 2. Margin Check: Must be clearly ahead of the second candidate
#         # Increased margin requirement to 0.5 to prevent close calls like 1124 vs 6724
#         if margin < 0.5:
#             logger.warning(f"[DECISION] UNKNOWN: Margin too low ({margin:.4f})")
#             return {
#                 "regno": "Unknown",
#                 "name": "Unknown",
#                 "itype": "",
#                 "attendance_status": "unknown",
#                 "confidence": float(confidence),
#                 "margin": float(margin),
#                 "date": timestamp,
#             }

#         # =============================
#         # USER LOOKUP
#         # =============================
#         user = next(
#             (u for u in face_service.id_map if u["regno"] == best_regno),
#             None
#         )

#         if not user:
#             logger.error(f"[ERROR] User not found: {best_regno}")
#             return {
#                 "regno": "Unknown",
#                 "name": "Unknown",
#                 "itype": "",
#                 "attendance_status": "error",
#                 "confidence": float(confidence),
#                 "margin": float(margin),
#                 "date": timestamp,
#             }

#         logger.info(f"[USER FOUND] {user['regno']} - {user['name']}")

#         # =============================
#         # DUPLICATE CHECK
#         # =============================
#         if has_marked_attendance_today(user["regno"]):
#             logger.warning(f"[DUPLICATE] {user['regno']} already marked")
#             return {
#                 "regno": user["regno"],
#                 "name": user["name"],
#                 "itype": user.get("itype", "SIWES"),
#                 "attendance_status": "already_marked",
#                 "confidence": float(confidence),
#                 "margin": float(margin),
#                 "date": timestamp,
#             }

#         # =============================
#         # SAVE ATTENDANCE
#         # =============================
#         save_attendance_log(
#             user={
#                 "regno": user["regno"],
#                 "name": user["name"],
#                 "itype": user.get("itype", "SIWES"),
#             },
#             metric="facenet512_topk_voting_cos0.65_k10_strict",
#             status="PRESENT",
#             score=float(confidence),
#         )

#         logger.info(f"[SUCCESS] Attendance marked → {user['regno']}")

#         return {
#             "regno": user["regno"],
#             "name": user["name"],
#             "itype": user.get("itype", "SIWES"),
#             "attendance_status": "present",
#             "confidence": float(confidence),
#             "margin": float(margin),
#             "date": timestamp,
#         }


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

        logger.info("====================================")
        logger.info("[REQUEST] Attendance triggered")
        logger.info(f"Incoming frames: {len(images)}")

        if face_service.faiss_index is None:
            logger.info("[INIT] Loading FAISS index...")
            load_faiss_index()
            logger.info("[INIT] FAISS index loaded")

        votes = defaultdict(float)
        frame_count = 0

        # Track max single-frame similarity for each user
        max_single_similarities = defaultdict(float)
        # Track how many frames each user appears in
        frame_appearances = defaultdict(int)

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

        # =============================
        # CONFIG
        # =============================
        K = 10
        THRESHOLD = 0.60  # Raised from 0.50
        HARD_THRESHOLD = 0.60

        # Minimum confidence for a SINGLE frame to be considered "strong"
        MIN_SINGLE_FRAME_SIMILARITY = 0.85

        logger.info(f"[CONFIG] K={K}, THRESHOLD={THRESHOLD}")

        # =============================
        # FRAME PROCESSING
        # =============================
        for i, img_str in enumerate(images):

            logger.info(f"--- Processing frame {i+1}/{len(images)} ---")

            img = decode_image(img_str)
            if img is None:
                logger.warning(f"[FRAME {i}] decode failed")
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            brightness = np.mean(gray)

            if brightness < 80:
                img = apply_clahe(img)

            emb = model.predict(img).reshape(1, -1)
            scores, indices = face_service.faiss_index.search(emb, K)

            frame_votes = defaultdict(float)
            weight = 0.6 + (i / len(images))

            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:
                    continue

                # Strict Threshold
                if score < THRESHOLD:
                    continue

                user = face_service.id_map[idx]
                regno = user["regno"]

                # Update max similarity seen for this user across all frames
                if score > max_single_similarities[regno]:
                    max_single_similarities[regno] = score

                frame_appearances[regno] += 1

                vote_value = score - THRESHOLD
                votes[regno] += vote_value * weight
                frame_votes[regno] += vote_value * weight

            logger.info(f"[FRAME {i}] frame votes: {dict(frame_votes)}")
            frame_count += 1

        if frame_count == 0 or not votes:
            return {
                "regno": "Unknown", "name": "Unknown", "itype": "",
                "attendance_status": "no_face", "confidence": 0.0, "margin": 0.0, "date": timestamp,
            }

        # =============================
        # SORT VOTES
        # =============================
        sorted_votes = sorted(votes.items(), key=lambda x: x[1], reverse=True)

        logger.info("==== FINAL VOTE SUMMARY ====")
        for i, (regno, score) in enumerate(sorted_votes):
            logger.info(f"[{i+1}] {regno} → TotalVote: {score:.4f} | MaxSim: {max_single_similarities[regno]:.4f} | Frames: {frame_appearances[regno]}")

        best_regno, best_score = sorted_votes[0]
        second_score = sorted_votes[1][1] if len(sorted_votes) > 1 else 0.0

        confidence = best_score / (best_score + second_score + 1e-6)
        margin = best_score - second_score

        logger.info(f"[DECISION] best={best_regno}, score={best_score:.4f}, margin={margin:.4f}")

        # =============================
        # STRICT VALIDATION
        # =============================

        # 1. Max Similarity Check: Did we ever see a REALLY good match?
        # If the best single frame similarity is < 0.85, it's likely a false positive accumulation
        if max_single_similarities[best_regno] < MIN_SINGLE_FRAME_SIMILARITY:
            logger.warning(f"[REJECTED] Max similarity {max_single_similarities[best_regno]:.4f} < {MIN_SINGLE_FRAME_SIMILARITY}")
            return {
                "regno": "Unknown", "name": "Unknown", "itype": "",
                "attendance_status": "unknown", "confidence": float(confidence), "margin": float(margin), "date": timestamp,
            }

        # 2. Margin Check: Must be clearly ahead
        if margin < 0.5:
            logger.warning(f"[REJECTED] Margin too low: {margin:.4f}")
            return {
                "regno": "Unknown", "name": "Unknown", "itype": "",
                "attendance_status": "unknown", "confidence": float(confidence), "margin": float(margin), "date": timestamp,
            }

        # =============================
        # USER LOOKUP & SAVE
        # =============================
        user = next((u for u in face_service.id_map if u["regno"] == best_regno), None)

        if not user:
            return {
                "regno": "Unknown", "name": "Unknown", "itype": "",
                "attendance_status": "error", "confidence": float(confidence), "margin": float(margin), "date": timestamp,
            }

        if has_marked_attendance_today(user["regno"]):
            return {
                "regno": user["regno"], "name": user["name"], "itype": user.get("itype", "SIWES"),
                "attendance_status": "already_marked", "confidence": float(confidence), "margin": float(margin), "date": timestamp,
            }

        save_attendance_log(
            user={"regno": user["regno"], "name": user["name"], "itype": user.get("itype", "SIWES")},
            metric="facenet512_strict_v0.60",
            status="PRESENT",
            score=float(confidence),
        )

        logger.info(f"[SUCCESS] Attendance marked → {user['regno']}")

        return {
            "regno": user["regno"], "name": user["name"], "itype": user.get("itype", "SIWES"),
            "attendance_status": "present", "confidence": float(confidence), "margin": float(margin), "date": timestamp,
        }
