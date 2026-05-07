from fastapi import APIRouter
import logging
from datetime import datetime
import numpy as np

from backend.schemas import AttendanceRequest, LiveRecognitionResponse
from backend.services.face_service import (
    model, faiss_index, id_map, decode_image, apply_clahe, cv2
)
from backend.db import save_attendance_log

logger = logging.getLogger("attendance")
router = APIRouter()


@router.post("/attendance", response_model=LiveRecognitionResponse)
async def attendance(data: AttendanceRequest):
    try:
        logger.info("[REQUEST] Multi-frame Attendance triggered")

        embeddings = []

        # ================= PROCESS MULTI IMAGES =================
        for img_str in data.images:
            img = decode_image(img_str)

            if img is None:
                continue

            # CLAHE enhancement
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            if np.mean(gray) < 80:
                img = apply_clahe(img)

            emb = model.predict(img)  # (512,)
            embeddings.append(emb)

        if len(embeddings) == 0:
            return {
                "regno": "",
                "name": "",
                "itype": "",
                "attendance_status": "error",
                "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
            }

        # ================= AGGREGATE EMBEDDINGS =================
        query_emb = np.mean(embeddings, axis=0)

        # normalize again (IMPORTANT for cosine / FAISS IP)
        query_emb = query_emb / np.linalg.norm(query_emb)
        query_emb = query_emb.reshape(1, -1)

        # ================= FAISS SEARCH =================
        top_k = 4
        scores, indices = faiss_index.search(query_emb, top_k)

        logger.info("\n===== TOP MATCHES =====")
        for i, (score, idx) in enumerate(zip(scores[0], indices[0]), 1):
            if idx == -1:
                continue
            u = id_map[idx]
            logger.info(f"#{i} {u['name']} ({u['regno']}) → {score:.4f}")
        logger.info("========================\n")

        best_idx = indices[0][0]
        best_score = scores[0][0]

        # ================= UNKNOWN =================
        if best_idx == -1 or best_score < 0.40:
            return {
                "regno": "",
                "name": "",
                "itype": "",
                "attendance_status": "unknown",
                "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
            }

        # ================= MATCH =================
        user = id_map[best_idx]

        save_attendance_log(
            user=user,
            metric="cosine",
            status="PRESENT",
            score=float(best_score),
        )

        return {
            "regno": user["regno"],
            "name": user["name"],
            "itype": user["itype"],
            "attendance_status": "present",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
        }

    except Exception as e:
        logger.error(str(e), exc_info=True)
        return {
            "regno": "Unknown",
            "name": "Unknown",
            "itype": "",
            "attendance_status": "error",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
        }


# @router.post("/attendance", response_model=LiveRecognitionResponse)
# async def attendance(data: AttendanceRequest):
#     try:
#         logger.info("[REQUEST] Attendance triggered")

#         img = decode_image(data.image)
#         if img is None:
#             return {
#                 "regno": "", "name": "", "itype": "",
#                 "attendance_status": "error",
#                 "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
#             }

#         # ================= CLAHE =================
#         gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#         if np.mean(gray) < 80:
#             img = apply_clahe(img)

#         # ================= EMBEDDING =================
#         query_emb = model.predict(img).reshape(1, -1)

#         # ================= FAISS SEARCH =================
#         top_k = 4
#         scores, indices = faiss_index.search(query_emb, top_k)

#         # ================= LOG TOP MATCHES =================
#         logger.info("\n===== TOP 4 MATCHES =====")
#         for i, (score, idx) in enumerate(zip(scores[0], indices[0]), 1):
#             if idx == -1:
#                 continue
#             u = id_map[idx]
#             logger.info(f"#{i} {u['name']} ({u['regno']}) → {score:.4f}")
#         logger.info("========================\n")

#         best_idx = indices[0][0]
#         best_score = scores[0][0]

#         # ⚠️ IMPORTANT: define your metric
#         metric = "cosine"  # change if you're using L2 or IP

#         # ================= UNKNOWN =================
#         if best_idx == -1 or best_score < 0.40:

#             return {
#                 "regno": "", "name": "", "itype": "",
#                 "attendance_status": "unknown",
#                 "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
#             }

#         # ================= MATCH FOUND =================
#         user = id_map[best_idx]

#         save_attendance_log(
#             user=user,
#             metric=metric,
#             status="PRESENT",
#             score=best_score,
#         )

#         return {
#             "regno": user["regno"],
#             "name": user["name"],
#             "itype": user["itype"],
#             "attendance_status": "present",
#             "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
#         }

#     except Exception as e:
#         logger.error(str(e), exc_info=True)
#         return {
#             "regno": "Unknown", "name": "Unknown", "itype": "",
#             "attendance_status": "error",
#             "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
#         }
