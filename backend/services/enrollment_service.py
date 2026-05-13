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

from backend.db import save_to_csv_batch

logger = logging.getLogger("enrollment")

IMAGES_DIR = "data/images"


def augment_image(img):
    """
    Generate image variations to improve model robustness.

    Returns a list of (suffix, image) tuples containing:
    - Original image
    - Brightened image (for low-light conditions)
    - Darkened image (for overexposed conditions)
    """
    # Increase brightness and contrast
    bright = cv2.convertScaleAbs(
        img,
        alpha=1.2,  # Contrast increase
        beta=30     # Brightness increase
    )

    # Decrease brightness and contrast
    dark = cv2.convertScaleAbs(
        img,
        alpha=0.9,  # Slight contrast reduction
        beta=-20    # Brightness decrease
    )

    return [
        ("orig", img),
        ("bright", bright),
        ("dark", dark),
    ]


class EnrollmentService:

    @staticmethod
    def process_enrollment(user, images: list):
        """
        Process user enrollment by generating embeddings from provided images.

        Args:
            user: User object containing regno, name, gender, itype
            images: List of base64 encoded images

        Returns:
            dict: Status and enrollment details
        """
        # Log enrollment start
        logger.info("=" * 70)
        logger.info("[ENROLLMENT STARTED]")
        logger.info(
            f"[USER] {user.name} ({user.regno})"
        )
        logger.info(
            f"[INPUT IMAGES] {len(images)}"
        )
        logger.info("=" * 70)

        embeddings = []
        rows_to_save = []

        created_at = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S.%f"
        )

        # Process each uploaded image
        for idx, img_b64 in enumerate(images):

            logger.info("-" * 60)
            logger.info(
                f"[IMAGE {idx+1}/{len(images)}]"
            )

            # Decode base64 to OpenCV image
            img = decode_image(img_b64)

            if img is None:
                logger.warning(
                    f"[IMAGE {idx+1}] Decode failed"
                )
                continue

            # Check image brightness for quality
            gray = cv2.cvtColor(
                img,
                cv2.COLOR_BGR2GRAY
            )

            brightness = float(np.mean(gray))

            logger.info(
                f"[IMAGE {idx+1}] Brightness={brightness:.2f}"
            )

            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            # for low-light images to improve feature extraction
            if brightness < 80:
                img = apply_clahe(img)
                logger.info(
                    f"[IMAGE {idx+1}] CLAHE applied"
                )

            # Generate augmented versions of the image
            for aug_name, aug_img in augment_image(img):

                logger.info(
                    f"[AUGMENT] {aug_name}"
                )

                # Generate face embedding using the model
                emb = model.predict(aug_img)

                logger.info(
                    f"[EMBEDDING] Shape={emb.shape}"
                )

                embeddings.append(emb)

                # Prepare data for batch database insertion
                rows_to_save.append({
                    "user": {
                        "regno": user.regno,
                        "name": user.name,
                        "gender": getattr(
                            user,
                            "gender",
                            ""
                        ),
                        "itype": getattr(
                            user,
                            "itype",
                            "SIWES"
                        ),
                    },
                    "embedding": emb,
                })

        # Validate that we generated at least one embedding
        if not embeddings:
            logger.error(
                "[FAILED] No valid embeddings generated"
            )
            return {
                "status": "error",
                "message": "Zero valid embeddings",
            }

        # Save all embeddings to CSV in a single batch operation
        logger.info(
            f"[CSV SAVE] Saving {len(rows_to_save)} embeddings"
        )
        save_to_csv_batch(rows_to_save)
        logger.info(
            "[CSV SAVE] Completed"
        )

        # Reload FAISS index to include newly enrolled user
        logger.info(
            "[FAISS] Reloading index"
        )
        load_faiss_index()
        logger.info(
            "[FAISS] Reload complete"
        )

        # Log successful enrollment
        logger.info("=" * 70)
        logger.info("[ENROLLMENT SUCCESS]")
        logger.info(f"[USER] {user.name}")
        logger.info(f"[REGNO] {user.regno}")
        logger.info(
            f"[TOTAL EMBEDDINGS] {len(embeddings)}"
        )
        logger.info("=" * 70)

        return {
            "status": "success",
            "name": user.name,
            "regno": user.regno,
            "stored_embeddings": len(embeddings),
        }
