# import numpy as np
# import cv2
# import logging

# from backend.services.face_service import (
#     model,
#     decode_image,
#     apply_clahe,
#     load_faiss_index,
# )
# from backend.db import save_to_csv

# logger = logging.getLogger("enrollment")


# class EnrollmentService:

#     @staticmethod
#     def process_enrollment(user, images: list):
#         embeddings = []

#         #  EXTRACT EMBEDDINGS
#         for img_b64 in images:
#             img = decode_image(img_b64)
#             if img is None:
#                 continue

#             gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

#             if np.mean(gray) < 80:
#                 img = apply_clahe(img)

#             emb = model.predict(img)
#             embeddings.append(emb)

#         if len(embeddings) < 8:
#             return {
#                 "status": "error",
#                 "message": "Not enough valid face samples",
#             }

#         embeddings = np.array(embeddings, dtype=np.float32)

#         # GROUPING
#         frontal = embeddings[0:3]
#         left_side = embeddings[3:6]
#         right_side = embeddings[6:9]
#         up = embeddings[9:10]

#         frontal_emb = np.mean(frontal, axis=0)
#         left_emb = np.mean(left_side, axis=0)
#         right_emb = np.mean(right_side, axis=0)
#         up_emb = np.mean(up, axis=0)

#         #  FUSION
#         avg_embedding = (
#             0.4 * frontal_emb +
#             0.25 * left_emb +
#             0.25 * right_emb +
#             0.1 * up_emb
#         )

#         # NORMALIZE
#         avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)

#         logger.info(
#             f"[ENROLL DONE] regno={user.regno} samples={len(embeddings)}"
#         )

#         # SAVE
#         save_to_csv(user.model_dump(), avg_embedding)

#         load_faiss_index()

#         return {
#             "status": "success",
#             "regno": user.regno,
#             "samples": len(embeddings),
#         }



import os
import cv2
import numpy as np
import logging
from datetime import datetime

from backend.services.face_service import (
    model,
    decode_image,
    apply_clahe,
    load_faiss_index,
)
from backend.db import save_to_csv

logger = logging.getLogger("enrollment")

IMAGES_DIR = "data/images"

# -----------------------------
# AUGMENTATION (FaceNet-optimized)
# -----------------------------
def augment_image(img):
    """Returns (suffix, image) tuples for Bright and Dark variations."""
    bright = cv2.convertScaleAbs(img, alpha=1.2, beta=30)
    dark = cv2.convertScaleAbs(img, alpha=0.9, beta=-20)
    return [
        ("orig", img),
        ("bright", bright),
        ("dark", dark)
    ]

class EnrollmentService:

    @staticmethod
    def process_enrollment(user, images: list):
        # Using provided user details directly
        logger.info(f"Enrollment started for: {user.name} ({user.regno})")

        embeddings = []

        # Folder structure setup under the provided user name
        person_dir = os.path.join(IMAGES_DIR, user.name)
        orig_dir = os.path.join(person_dir, "original")
        aug_dir = os.path.join(person_dir, "augmented")

        os.makedirs(orig_dir, exist_ok=True)
        os.makedirs(aug_dir, exist_ok=True)

        idx = 0
        # High-precision timestamp: 2026-05-11 13:46:26.945876
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

        for img_b64 in images:
            img = decode_image(img_b64)
            if img is None:
                logger.warning(f"Invalid image index {idx} skipped")
                continue

            # Pre-processing (CLAHE for low light robustness)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            if np.mean(gray) < 80:
                img = apply_clahe(img)

            # -----------------------------
            # AUGMENT + SAVE + EMBED
            # -----------------------------
            for aug_name, aug_img in augment_image(img):

                # Save path logic: originals go to /original, others to /augmented
                if aug_name == "orig":
                    save_path = os.path.join(orig_dir, f"{idx}_orig.jpg")
                else:
                    save_path = os.path.join(aug_dir, f"{idx}_{aug_name}.jpg")

                cv2.imwrite(save_path, aug_img)

                # Generate Embedding using FaceNet512
                emb = model.predict(aug_img)
                embeddings.append(emb)

                # Persist to CSV/Database
                save_to_csv(
                    {
                        "regno": user.regno,
                        "name": user.name,
                        "itype": getattr(user, 'itype', 'SIWES'), # Fallback if itype not on user object
                        "created_at": created_at
                    },
                    emb
                )

            idx += 1

        if not embeddings:
            logger.error("No valid embeddings generated")
            return {"status": "error", "message": "Zero valid embeddings"}

        # Refresh the FAISS index to make the new user immediately recognizable
        load_faiss_index()

        logger.info(
            f"Enrollment done | {user.name} | total_variants={len(embeddings)}"
        )

        return {
            "status": "success",
            "name": user.name,
            "regno": user.regno,
            "stored_embeddings": len(embeddings)
        }
