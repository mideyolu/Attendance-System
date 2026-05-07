import numpy as np
import logging
from fastapi import APIRouter

from backend.schemas import EnrollmentRequest
from backend.db import save_to_csv
from backend.services.face_service import (
    model, decode_image, apply_clahe, cv2, load_faiss_index
)

logger = logging.getLogger("enrollment")
router = APIRouter()


@router.post("/enroll")
async def enroll(data: EnrollmentRequest):
    try:
        logger.info(f"[ENROLL START] regno={data.user.regno}")

        embeddings = []

        # ================= EMBEDDINGS =================
        for img_b64 in data.images:
            img = decode_image(img_b64)
            if img is None:
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            if np.mean(gray) < 80:
                img = apply_clahe(img)

            emb = model.predict(img)
            embeddings.append(emb)

        if len(embeddings) < 8:
            return {"status": "error", "message": "Not enough valid face samples"}

        embeddings = np.array(embeddings, dtype=np.float32)

        # ================= SAFE SPLIT =================
        frontal = embeddings[0:5]
        side = embeddings[5:8]
        quarter = embeddings[8:10]

        # ================= GROUP MEANS =================
        frontal_emb = np.mean(frontal, axis=0)
        side_emb = np.mean(side, axis=0)
        quarter_emb = np.mean(quarter, axis=0)

        # ================= WEIGHTED FUSION =================
        avg_embedding = 0.5 * frontal_emb + 0.3 * side_emb + 0.2 * quarter_emb

        # ================= NORMALIZE =================
        avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)

        logger.info(f"[ENROLL DONE] regno={data.user.regno} samples={len(embeddings)}")

        # ================= SAVE =================
        save_to_csv(data.user.model_dump(), avg_embedding)

        load_faiss_index()

        return {
            "status": "success",
            "regno": data.user.regno,
            "samples": len(embeddings),
        }

    except Exception as e:
        logger.error(f"[ENROLL ERROR] {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


# @router.post("/enroll")
# async def enroll(data: EnrollmentRequest):
#     try:
#         logger.info(f"[ENROLL START] regno={data.user.regno}")
#         embeddings = []

#         for img_b64 in data.images:
#             img = decode_image(img_b64)
#             if img is None:
#                 logger.warning("[SKIP] invalid image")
#                 continue

#             gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#             if np.mean(gray) < 80:
#                 img = apply_clahe(img)
#                 logger.info("[PREPROCESS] CLAHE applied")

#             emb = model.predict(img)
#             embeddings.append(emb)

#         if len(embeddings) == 0:
#             return {"status": "error", "message": "No valid face images found"}

#         embeddings = np.array(embeddings, dtype=np.float32)
#         avg_embedding = np.mean(embeddings, axis=0)
#         avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)

#         logger.info(f"[ENROLL DONE] regno={data.user.regno} samples={len(embeddings)}")

#         # Save to DB
#         save_to_csv(data.user.model_dump(), avg_embedding)

#         # Refresh the global FAISS index so the new user is instantly recognizable
#         load_faiss_index()

#         return {
#             "status": "success",
#             "regno": data.user.regno,
#             "samples": len(embeddings),
#         }

#     except Exception as e:
#         logger.error(f"[ENROLL ERROR] {str(e)}", exc_info=True)
#         return {"status": "error", "message": str(e)}
