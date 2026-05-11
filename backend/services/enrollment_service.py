import numpy as np
import cv2
import logging

from backend.services.face_service import (
    model,
    decode_image,
    apply_clahe,
    load_faiss_index,
)
from backend.db import save_to_csv

logger = logging.getLogger("enrollment")


class EnrollmentService:

    @staticmethod
    def process_enrollment(user, images: list):
        embeddings = []

        #  EXTRACT EMBEDDINGS 
        for img_b64 in images:
            img = decode_image(img_b64)
            if img is None:
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            if np.mean(gray) < 80:
                img = apply_clahe(img)

            emb = model.predict(img)
            embeddings.append(emb)

        if len(embeddings) < 8:
            return {
                "status": "error",
                "message": "Not enough valid face samples",
            }

        embeddings = np.array(embeddings, dtype=np.float32)

        # GROUPING
        frontal = embeddings[0:3]
        left_side = embeddings[3:6]
        right_side = embeddings[6:9]
        up = embeddings[9:10]

        frontal_emb = np.mean(frontal, axis=0)
        left_emb = np.mean(left_side, axis=0)
        right_emb = np.mean(right_side, axis=0)
        up_emb = np.mean(up, axis=0)

        #  FUSION
        avg_embedding = (
            0.4 * frontal_emb +
            0.25 * left_emb +
            0.25 * right_emb +
            0.1 * up_emb
        )

        # NORMALIZE
        avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)

        logger.info(
            f"[ENROLL DONE] regno={user.regno} samples={len(embeddings)}"
        )

        # SAVE
        save_to_csv(user.model_dump(), avg_embedding)

        load_faiss_index()

        return {
            "status": "success",
            "regno": user.regno,
            "samples": len(embeddings),
        }
