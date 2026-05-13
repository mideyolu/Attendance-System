import os
import cv2
import numpy as np
import pandas as pd
from datetime import datetime
from modelconfig import DeepFace

BASE_DIR = "Img/images"
OUTPUT_CSV = "enrollments.csv"

model = DeepFace("facenet512")


def augment_image(img):
    bright = cv2.convertScaleAbs(img, alpha=1.2, beta=30)
    dark = cv2.convertScaleAbs(img, alpha=0.9, beta=-20)
    return [
        ("bright", bright),
        ("dark", dark)
    ]


def l2_normalize(x):
    return x / np.linalg.norm(x)


def run():

    # ✅ FIXED STRUCTURE
    users = {}

    if not os.path.exists(BASE_DIR):
        print("Directory not found")
        return

    folders = [
        f for f in os.listdir(BASE_DIR)
        if os.path.isdir(os.path.join(BASE_DIR, f))
    ]

    for folder_name in folders:

        old_path = os.path.join(BASE_DIR, folder_name)

        # -----------------------------
        # IDENTITY MAPPING
        # -----------------------------
        if folder_name == "ah":
            full_name, regno, itype, gender = "Ahmad El-Hussein", "SIWES-7786", "SIWES", "Male"
        elif folder_name == "is":
            full_name, regno, itype, gender = "Oluwuyi Olumide", "NYSC-1124", "NYSC", "Male"
        elif folder_name == "val":
            full_name, regno, itype, gender = "Valentine Donatus", "NYSC-6724", "NYSC", "Male"
        elif folder_name == "that guy":
            full_name, regno, itype, gender = "Sa'ad Abdul", "NYSC-9780", "NYSC", "Male"
        else:
            full_name, regno, itype, gender = folder_name, f"SIWES-{np.random.randint(1000,9999)}", "SIWES", "Male"

        person_dir = os.path.join(BASE_DIR, full_name)

        if old_path != person_dir and not os.path.exists(person_dir):
            os.rename(old_path, person_dir)

        orig_dir = os.path.join(person_dir, "original")
        aug_dir = os.path.join(person_dir, "augmented")

        os.makedirs(orig_dir, exist_ok=True)
        os.makedirs(aug_dir, exist_ok=True)

        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

        # ✅ INIT USER STRUCTURE
        if regno not in users:
            users[regno] = {
                "name": full_name,
                "gender": gender,
                "itype": itype,
                "created_at": created_at,
                "embeddings": []
            }

        # -----------------------------
        # PROCESS IMAGES
        # -----------------------------
        for file in os.listdir(person_dir):

            file_path = os.path.join(person_dir, file)

            if os.path.isdir(file_path):
                continue

            img = cv2.imread(file_path)
            if img is None:
                continue

            # ORIGINAL EMBEDDING
            emb = model.predict(img).flatten()
            users[regno]["embeddings"].append(emb)

            os.rename(file_path, os.path.join(orig_dir, file))

            # AUGMENTED EMBEDDINGS
            for _, aug_img in augment_image(img):

                emb_aug = model.predict(aug_img).flatten()
                users[regno]["embeddings"].append(emb_aug)

    # -----------------------------
    # BUILD CENTROIDS
    # -----------------------------
    rows = []

    for regno, data in users.items():

        embeddings = np.array(data["embeddings"])

        centroid = np.mean(embeddings, axis=0)
        centroid = l2_normalize(centroid)

        rows.append({
            "regno": regno,
            "name": data["name"],
            "gender": data["gender"],
            "itype": data["itype"],
            "created_at": data["created_at"],
            "embedding": centroid.tolist()
        })

    pd.DataFrame(rows).to_csv(OUTPUT_CSV, index=False)

    print("--- CENTROID ENROLLMENT COMPLETE ---")
    print(f"Saved {len(rows)} users (1 vector per user)")


if __name__ == "__main__":
    run()
