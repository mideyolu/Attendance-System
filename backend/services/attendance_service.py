import numpy as np
from datetime import datetime
import cv2

from backend.services.face_service import (
    model,
    faiss_index,
    id_map,
    decode_image,
    apply_clahe,
)
from backend.db import has_marked_attendance_today, save_attendance_log


class AttendanceService:

    @staticmethod
    def process_attendance(images: list):
        embeddings = []

        # PROCESS IMAGES
        for img_str in images:
            img = decode_image(img_str)

            if img is None:
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            if np.mean(gray) < 80:
                img = apply_clahe(img)

            emb = model.predict(img)
            embeddings.append(emb)

        if len(embeddings) == 0:
            return {
                "status": "error",
                "message": "No valid face detected",
                "confidence": 0,
            }

        # EMBEDDING
        query_emb = np.mean(embeddings, axis=0)
        query_emb = query_emb / np.linalg.norm(query_emb)
        query_emb = query_emb.reshape(1, -1)

        # SEARCH
        scores, indices = faiss_index.search(query_emb, 4)

        best_idx = indices[0][0]
        best_score = scores[0][0]

        if best_idx == -1 or best_score < 0.40:
            return {
                "regno": "Unknown",
                "name": "Unknown",
                "itype": "",
                "attendance_status": "unknown",
                "confidence": 0.0,
                "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
            }

        user = id_map[best_idx]

        # DUPLICATE CHECK
        if has_marked_attendance_today(user["regno"]):
            return {
                "regno": user["regno"],
                "name": user["name"],
                "itype": user["itype"],
                "attendance_status": "already_marked",
                "confidence": float(best_score),
                "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
            }

        # SAVE
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
            "confidence": float(best_score),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
        }
