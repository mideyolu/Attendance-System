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
