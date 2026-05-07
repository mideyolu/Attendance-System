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

# Initialize Model
model = DeepFace("facenet512")

# Global State for FAISS
faiss_index = None
id_map = []

def parse_embedding(embedding_str):
    try:
        embedding_str = embedding_str.replace("[", "").replace("]", "")
        values = [float(x) for x in embedding_str.split(",") if x.strip()]
        return np.array(values, dtype=np.float32)
    except Exception as e:
        logger.warning(f"[EMBED PARSE ERROR] {e}")
        return None

def load_faiss_index():
    global faiss_index, id_map
    if not os.path.exists(CSV_FILE):
        faiss_index = faiss.IndexFlatIP(512)
        id_map = []
        return

    df = pd.read_csv(CSV_FILE)
    embeddings = []
    id_map = []

    for _, row in df.iterrows():
        emb = parse_embedding(row["embedding"])
        if emb is None:
            continue
        embeddings.append(emb)
        id_map.append({
            "regno": row["regno"],
            "name": row["name"],
            "gender": row["gender"],
            "itype": row["itype"]
        })

    if embeddings:
        embeddings = np.array(embeddings).astype(np.float32)
        index = faiss.IndexFlatIP(512)
        index.add(embeddings)
        faiss_index = index
    else:
        faiss_index = faiss.IndexFlatIP(512)

    logger.info(f"[INIT] Loaded {len(id_map)} users into FAISS")

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
