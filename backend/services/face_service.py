# import base64
# import numpy as np
# import cv2
# import os
# import logging
# import faiss
# import pandas as pd
# from backend.modelconfig import DeepFace
# from backend.config import CSV_FILE

# logger = logging.getLogger("face_service")

# # Initialize Model
# model = DeepFace("facenet512")

# # Global State for FAISS
# faiss_index = None
# id_map = []

# def parse_embedding(embedding_str):
#     try:
#         embedding_str = embedding_str.replace("[", "").replace("]", "")
#         values = [float(x) for x in embedding_str.split(",") if x.strip()]
#         return np.array(values, dtype=np.float32)
#     except Exception as e:
#         logger.warning(f"[EMBED PARSE ERROR] {e}")
#         return None

# def load_faiss_index():
#     global faiss_index, id_map
#     if not os.path.exists(CSV_FILE):
#         faiss_index = faiss.IndexFlatIP(512)
#         id_map = []
#         return

#     df = pd.read_csv(CSV_FILE)
#     embeddings = []
#     id_map = []

#     for _, row in df.iterrows():
#         emb = parse_embedding(row["embedding"])
#         if emb is None:
#             continue
#         embeddings.append(emb)
#         id_map.append({
#             "regno": row["regno"],
#             "name": row["name"],
#             "gender": row["gender"],
#             "itype": row["itype"]
#         })

#     if embeddings:
#         embeddings = np.array(embeddings).astype(np.float32)
#         index = faiss.IndexFlatIP(512)
#         index.add(embeddings)
#         faiss_index = index
#     else:
#         faiss_index = faiss.IndexFlatIP(512)

#     logger.info(f"[INIT] Loaded {len(id_map)} users into FAISS")

# def apply_clahe(img):
#     lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
#     l, a, b = cv2.split(lab)
#     clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
#     l = clahe.apply(l)
#     lab = cv2.merge((l, a, b))
#     return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

# def decode_image(img_b64):
#     try:
#         img_data = img_b64.split(",")[1]
#         img_bytes = base64.b64decode(img_data)
#         nparr = np.frombuffer(img_bytes, np.uint8)
#         return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#     except Exception:
#         return None

# # Initial load
# load_faiss_index()


import base64
import numpy as np
import cv2
import os
import logging
import faiss
import pandas as pd
from backend.modelconfig import DeepFace
from backend.config import CSV_FILE

logger = logging.getLogger("face_service")

model = DeepFace("facenet512")

faiss_index = None
id_map = []

def parse_embedding(embedding_str):
    """
    Safely parses an embedding string.
    Returns None if the string is invalid (e.g., a timestamp or empty).
    """
    if not isinstance(embedding_str, str):
        return None

    # Quick check: Embeddings start with '['. Timestamps start with digits.
    if not embedding_str.strip().startswith('['):
        return None

    try:
        # Clean up brackets
        clean_str = embedding_str.replace("[", "").replace("]", "")
        values = [float(x) for x in clean_str.split(",") if x.strip()]

        # FaceNet512 embeddings must have 512 dimensions
        if len(values) != 512:
            return None

        return np.array(values, dtype=np.float32)
    except Exception as e:
        # Log only if it looks like it SHOULD have been an embedding
        if '[' in embedding_str:
            logger.warning(f"[EMBED PARSE ERROR] {e}")
        return None

def load_faiss_index():
    global faiss_index, id_map
    if not os.path.exists(CSV_FILE):
        faiss_index = faiss.IndexFlatIP(512)
        id_map = []
        return

    embeddings = []
    id_map = []

    try:
        # on_bad_lines='skip' prevents crashes on malformed rows
        df = pd.read_csv(CSV_FILE, on_bad_lines='skip')

        # Debug: Log columns to ensure we are reading the right ones
        logger.info(f"[INIT] CSV Columns: {df.columns.tolist()}")

        required_cols = ['regno', 'name', 'gender', 'itype', 'embedding']
        if not all(col in df.columns for col in required_cols):
            logger.error(f"[INIT] CSV missing required columns. Found: {df.columns.tolist()}")
            faiss_index = faiss.IndexFlatIP(512)
            return

        for index, row in df.iterrows():
            # Explicitly get the embedding column
            emb_raw = row.get("embedding")

            emb = parse_embedding(str(emb_raw))

            if emb is None:
                # Skip invalid rows silently (or debug log if needed)
                continue

            embeddings.append(emb)
            id_map.append({
                "regno": str(row["regno"]),
                "name": str(row["name"]),
                "gender": str(row["gender"]),
                "itype": str(row["itype"])
            })

    except Exception as e:
        logger.error(f"[INIT] Failed to load CSV: {e}")
        faiss_index = faiss.IndexFlatIP(512)
        return

    if embeddings:
        embeddings_array = np.array(embeddings).astype(np.float32)

        # Normalize for Cosine Similarity
        faiss.normalize_L2(embeddings_array)

        index = faiss.IndexFlatIP(512)
        index.add(embeddings_array)
        faiss_index = index
        logger.info(f"[INIT] Loaded {len(id_map)} users into FAISS")
    else:
        faiss_index = faiss.IndexFlatIP(512)
        logger.warning("[INIT] No valid embeddings found. FAISS initialized empty.")

def apply_clahe(img):
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

def decode_image(img_b64):
    try:
        img_data = img_b64.split(",")[1]
        img_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception:
        return None

# Initial load
load_faiss_index()
