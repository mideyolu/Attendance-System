import os
import cv2
import numpy as np
import pandas as pd
from datetime import datetime
from modelconfig import DeepFace

# Configuration
BASE_DIR = "image_data/images"
OUTPUT_CSV = "enrollments.csv"

# Initialize model
model = DeepFace("facenet512")

# -----------------------------
# AUGMENTATION (FaceNet-safe)
# -----------------------------
def augment_image(img):
    """Returns (suffix, image) tuples for Bright and Dark variations."""
    bright = cv2.convertScaleAbs(img, alpha=1.2, beta=30)
    dark = cv2.convertScaleAbs(img, alpha=0.9, beta=-20)
    return [
        ("bright", bright),
        ("dark", dark)
    ]

def run():
    rows = []

    if not os.path.exists(BASE_DIR):
        print(f"[ERROR] Directory {BASE_DIR} not found.")
        return

    # Freeze folder list
    folders = [f for f in os.listdir(BASE_DIR) if os.path.isdir(os.path.join(BASE_DIR, f))]

    for folder_name in folders:
        old_path = os.path.join(BASE_DIR, folder_name)

        # Identity Mapping & Gender Assignment
        if folder_name == "ah":
            full_name, regno, itype, gender = "Ahmad El-Hussein", "SIWES-7786", "SIWES", "Male"
        elif folder_name == "is":
            full_name, regno, itype, gender = "Oluwuyi Olumide", "NYSC-1124", "NYSC", "Male"
        elif folder_name == "val":
            full_name, regno, itype, gender = "Valentine Donatus", "NYSC-6724", "NYSC", "Male"
        elif folder_name == "that guy":
            full_name, regno, itype, gender = "Sa'ad Abdul", "NYSC-9780", "NYSC", "Male"
        else:
            full_name, regno, itype, gender = folder_name, f"SIWES-{np.random.randint(1000, 9999)}", "SIWES", "Male"

        # 1. Rename/Setup Main Person Folder
        person_dir = os.path.join(BASE_DIR, full_name)
        if old_path != person_dir and not os.path.exists(person_dir):
            os.rename(old_path, person_dir)

        # 2. Create subfolders: original and augmented
        orig_dir = os.path.join(person_dir, "original")
        aug_dir = os.path.join(person_dir, "augmented")
        os.makedirs(orig_dir, exist_ok=True)
        os.makedirs(aug_dir, exist_ok=True)

        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

        # 3. Process images
        for file in os.listdir(person_dir):
            file_path = os.path.join(person_dir, file)

            if os.path.isdir(file_path):
                continue

            img = cv2.imread(file_path)
            if img is None:
                continue

            # --- Handle Original ---
            emb_orig = model.predict(img)
            rows.append({
                "regno": regno,
                "name": full_name,
                "gender": gender,   # Added gender here
                "itype": itype,
                "created_at": created_at,
                "embedding": emb_orig.tolist()
            })
            os.rename(file_path, os.path.join(orig_dir, file))

            # --- Handle Augmented ---
            for aug_type, aug_img in augment_image(img):
                save_name = f"{aug_type}_{file}"
                cv2.imwrite(os.path.join(aug_dir, save_name), aug_img)

                emb_aug = model.predict(aug_img)
                rows.append({
                    "regno": regno,
                    "name": full_name,
                    "gender": gender,  # Added gender here
                    "itype": itype,
                    "created_at": created_at,
                    "embedding": emb_aug.tolist()
                })

    if rows:
        pd.DataFrame(rows).to_csv(OUTPUT_CSV, index=False)
        print(f"--- Process Complete ---")
        print(f"CSV saved to {OUTPUT_CSV} with gender data.")

if __name__ == "__main__":
    run()
