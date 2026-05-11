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

#         logger.info("[REQUEST] Attendance triggered")

#         if face_service.faiss_index is None:
#             load_faiss_index()

#         votes = defaultdict(float)
#         frame_count = 0

#         timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

#         # =============================
#         # FRAME PROCESSING
#         # =============================
#         for i, img_str in enumerate(images):

#             img = decode_image(img_str)
#             if img is None:
#                 continue

#             gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

#             if np.mean(gray) < 80:
#                 img = apply_clahe(img)

#             emb = model.predict(img).reshape(1, -1)

#             scores, indices = face_service.faiss_index.search(emb, 5)

#             for score, idx in zip(scores[0], indices[0]):
#                 if idx == -1:
#                     continue


#                 user = face_service.id_map[idx]
#                 regno = user["regno"]

#                 votes[regno] += float(score)

#             frame_count += 1

#         # =============================
#         # NO FACE CASE
#         # =============================
#         if frame_count == 0 or not votes:
#             return {
#                 "regno": "Unknown",
#                 "name": "Unknown",
#                 "itype": "",
#                 "attendance_status": "no_face",
#                 "confidence": 0.0,
#                 "margin": 0.0,
#                 "date": timestamp
#             }

#         # TOP VOTE + MARGIN DEBUG
#         # =============================
#         sorted_votes = sorted(votes.items(), key=lambda x: x[1], reverse=True)

#         best_regno, best_score = sorted_votes[0]
#         second_score = sorted_votes[1][1] if len(sorted_votes) > 1 else 0.0

#         confidence = best_score / frame_count
#         margin = best_score - second_score

#         # -----------------------------
#         # 🔍 DEBUG: show ALL margins
#         # -----------------------------
#         logger.info("---- Vote Breakdown ----")

#         for i, (regno, score) in enumerate(sorted_votes):
#             next_score = sorted_votes[i + 1][1] if i + 1 < len(sorted_votes) else 0.0
#             candidate_margin = score - next_score

#             logger.info(
#                 f"[{i+1}] {regno} | score={score:.3f} | margin={candidate_margin:.3f}"
#             )

#         logger.info(
#             f"Decision: {best_regno} | conf={confidence:.3f} | margin={margin:.3f}"
#         )


#         # =============================
#         # UNKNOWN DETECTION
#         # =============================
#         if confidence < 3.0 or margin < 6.0:
#             return {
#                 "regno": "Unknown",
#                 "name": "Unknown",
#                 "itype": "",
#                 "attendance_status": "unknown",
#                 "confidence": float(confidence),
#                 "margin": float(margin),
#                 "date": timestamp
#             }

#         # =============================
#         # SAFE USER LOOKUP (FIXED)
#         # =============================
#         user = None
#         for u in face_service.id_map:
#             if u["regno"] == best_regno:
#                 user = u
#                 break

#         if not user:
#             return {
#                 "regno": "Unknown",
#                 "name": "Unknown",
#                 "itype": "",
#                 "attendance_status": "error",
#                 "confidence": float(confidence),
#                 "margin": float(margin),
#                 "date": timestamp
#             }

#         # =============================
#         # DUPLICATE CHECK
#         # =============================
#         if has_marked_attendance_today(user["regno"]):
#             return {
#                 "regno": user["regno"],
#                 "name": user["name"],
#                 "itype": user.get("itype", "SIWES"),
#                 "attendance_status": "already_marked",
#                 "confidence": float(confidence),
#                 "margin": float(margin),
#                 "date": timestamp
#             }

#         # =============================
#         # SAVE ATTENDANCE (FIXED)
#         # =============================
#         save_attendance_log(
#             user={
#                 "regno": user["regno"],
#                 "name": user["name"],
#                 "itype": user.get("itype", "SIWES"),
#             },
#             metric="facenet512_topk_voting",
#             status="PRESENT",
#             score=float(confidence)
#         )

#         logger.info(f"Attendance marked: {user['regno']}")

#         # =============================
#         # SUCCESS RESPONSE (ALWAYS VALID)
#         # =============================
#         return {
#             "regno": user["regno"],
#             "name": user["name"],
#             "itype": user.get("itype", "SIWES"),
#             "attendance_status": "present",
#             "confidence": float(confidence),
#             "margin": float(margin),
#             "date": timestamp
#         }



import numpy as np
import cv2
import logging

from datetime import datetime
from collections import Counter

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


class AttendanceService:

    @staticmethod
    def process_attendance(images: list):

        logger.info("[REQUEST] Attendance triggered")

        if face_service.faiss_index is None:
            load_faiss_index()

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

        # =====================================
        # STORE FRAME-LEVEL PREDICTIONS
        # =====================================
        frame_predictions = []

        # =====================================
        # FRAME PROCESSING
        # =====================================
        for i, img_str in enumerate(images):

            img = decode_image(img_str)

            if img is None:
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # CLAHE for low-light frames
            if np.mean(gray) < 80:
                img = apply_clahe(img)

            try:
                emb = model.predict(img).reshape(1, -1)

            except Exception as e:
                logger.error(f"[FRAME {i}] Embedding failed: {e}")
                continue

            # =====================================
            # SEARCH TOP-1 ONLY
            # =====================================
            scores, indices = face_service.faiss_index.search(emb, 1)

            best_score = float(scores[0][0])
            best_idx = int(indices[0][0])

            if best_idx == -1:
                logger.info(f"[FRAME {i}] No match found")
                continue

            user = face_service.id_map[best_idx]

            frame_predictions.append({
                "regno": user["regno"],
                "score": best_score
            })

            logger.info(
                f"[FRAME {i}] "
                f"{user['regno']} | similarity={best_score:.3f}"
            )

        # =====================================
        # NO FACE / NO PREDICTIONS
        # =====================================
        if not frame_predictions:

            logger.info("[RESULT] No recognizable face")

            return {
                "regno": "Unknown",
                "name": "Unknown",
                "itype": "",
                "attendance_status": "no_face",
                "confidence": 0.0,
                "margin": 0.0,
                "date": timestamp
            }

        # =====================================
        # MAJORITY VOTING
        # =====================================
        regnos = [p["regno"] for p in frame_predictions]

        vote_counts = Counter(regnos)

        logger.info("---- Vote Breakdown ----")

        for regno, count in vote_counts.items():

            logger.info(
                f"{regno} | votes={count}"
            )

        best_regno, win_count = vote_counts.most_common(1)[0]

        # =====================================
        # CONFIDENCE
        # =====================================
        total_frames = len(frame_predictions)

        confidence = win_count / total_frames

        # =====================================
        # MARGIN
        # =====================================
        second_count = (
            vote_counts.most_common(2)[1][1]
            if len(vote_counts) > 1
            else 0
        )

        margin = win_count - second_count

        # =====================================
        # AVERAGE SIMILARITY
        # =====================================
        winner_scores = [
            p["score"]
            for p in frame_predictions
            if p["regno"] == best_regno
        ]

        avg_similarity = float(np.mean(winner_scores))

        logger.info(
            f"Decision: {best_regno} | "
            f"confidence={confidence:.3f} | "
            f"margin={margin:.3f} | "
            f"avg_similarity={avg_similarity:.3f}"
        )

        # =====================================
        # UNKNOWN DETECTION
        # =====================================
        if (
            confidence < 0.80
            or margin < 2
            or avg_similarity < 0.65
        ):

            logger.info("[RESULT] Unknown face")

            return {
                "regno": "Unknown",
                "name": "Unknown",
                "itype": "",
                "attendance_status": "unknown",
                "confidence": float(confidence),
                "margin": float(margin),
                "date": timestamp
            }

        # =====================================
        # SAFE USER LOOKUP
        # =====================================
        user = None

        for u in face_service.id_map:

            if u["regno"] == best_regno:
                user = u
                break

        if not user:

            logger.error("[ERROR] User not found in id_map")

            return {
                "regno": "Unknown",
                "name": "Unknown",
                "itype": "",
                "attendance_status": "error",
                "confidence": float(confidence),
                "margin": float(margin),
                "date": timestamp
            }

        # =====================================
        # DUPLICATE CHECK
        # =====================================
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

        # =====================================
        # SAVE ATTENDANCE
        # =====================================
        save_attendance_log(
            user={
                "regno": user["regno"],
                "name": user["name"],
                "itype": user.get("itype", "SIWES"),
            },
            metric="facenet512_frame_consensus",
            status="PRESENT",
            score=float(confidence)
        )

        logger.info(f"Attendance marked: {user['regno']}")

        # =====================================
        # SUCCESS RESPONSE
        # =====================================
        return {
            "regno": user["regno"],
            "name": user["name"],
            "itype": user.get("itype", "SIWES"),
            "attendance_status": "present",
            "confidence": float(confidence),
            "margin": float(margin),
            "date": timestamp
        }