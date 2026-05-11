# import numpy as np
# import logging
# from fastapi import APIRouter

# from backend.schemas import EnrollmentRequest
# from backend.db import save_to_csv
# from backend.services.face_service import (
#     model, decode_image, apply_clahe, cv2, load_faiss_index
# )

# logger = logging.getLogger("enrollment")
# router = APIRouter()


# @router.post("/enroll")
# async def enroll(data: EnrollmentRequest):
#     try:
#         logger.info(f"[ENROLL START] regno={data.user.regno}")

#         embeddings = []

#         # ================= EMBEDDINGS =================
#         for img_b64 in data.images:
#             img = decode_image(img_b64)
#             if img is None:
#                 continue

#             gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#             if np.mean(gray) < 80:
#                 img = apply_clahe(img)

#             emb = model.predict(img)
#             embeddings.append(emb)

#         if len(embeddings) < 8:
#             return {"status": "error", "message": "Not enough valid face samples"}

#         embeddings = np.array(embeddings, dtype=np.float32)

#         # ================= SAFE SPLIT =================
#         frontal = embeddings[0:3]    # "Look straight" - 3 images
#         left_side = embeddings[3:6]  # "Turn head LEFT" - 3 images
#         right_side = embeddings[6:9] # "Turn head RIGHT" - 3 images
#         up = embeddings[9:10]        # "Look slightly UP" - 1 image


#         # ================= GROUP MEANS =================
#         frontal_emb = np.mean(frontal, axis=0)
#         left_side_emb = np.mean(left_side, axis=0)
#         right_side_emb = np.mean(right_side, axis=0)
#         up_emb = np.mean(up, axis=0)


#         # ================= WEIGHTED FUSION =================
#         avg_embedding = (0.4 * frontal_emb + 0.25 * left_side_emb + 0.25 * right_side_emb + 0.1 * up_emb)

#         # ================= NORMALIZE =================
#         avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)

#         logger.info(f"[ENROLL DONE] regno={data.user.regno} samples={len(embeddings)}")

#         # ================= SAVE =================
#         save_to_csv(data.user.model_dump(), avg_embedding)

#         load_faiss_index()

#         return {
#             "status": "success",
#             "regno": data.user.regno,
#             "samples": len(embeddings),
#         }

#     except Exception as e:
#         logger.error(f"[ENROLL ERROR] {str(e)}", exc_info=True)
#         return {"status": "error", "message": str(e)}


import logging
from fastapi import APIRouter

from backend.schemas import EnrollmentRequest
from backend.services.enrollment_service import EnrollmentService

logger = logging.getLogger("enrollment")
router = APIRouter()


@router.post("/enroll")
async def enroll(data: EnrollmentRequest):
    try:
        logger.info(f"[ENROLL START] regno={data.user.regno}")

        result = EnrollmentService.process_enrollment(
            data.user,
            data.images
        )

        return result

    except Exception as e:
        logger.error(f"[ENROLL ERROR] {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}
