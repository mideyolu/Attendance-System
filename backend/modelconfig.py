import os
import cv2
import onnxruntime
import numpy as np
import faiss

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def find_verification_model_target_size(model_name):
    target_sizes = {
        "facenet512": (160, 160),
    }
    return target_sizes[model_name.lower()]


class DeepFace:
    def __init__(self, model_name="facenet512"):
        self.model_name = model_name.lower()
        self.model_path = os.path.join(BASE_DIR, "models", f"{self.model_name}.onnx")

        self.session, self.input_name, self.output_name = self.load_model()

    def load_model(self):
        session = onnxruntime.InferenceSession(self.model_path)
        return session, session.get_inputs()[0].name, session.get_outputs()[0].name

    # ✅ FACE PREPROCESSING (FaceNet standard)
    def preprocess(self, img):
        img = cv2.resize(img, (160, 160))
        img = img.astype(np.float32)

        # FaceNet normalization
        img = (img - 127.5) / 128.0

        img = np.expand_dims(img, axis=0)  # (1,160,160,3)
        return img

    # ✅ EMBEDDING (FAISS READY)
    def predict(self, img):
        img = self.preprocess(img)

        emb = self.session.run([self.output_name], {self.input_name: img})[0]

        # (1,512) → (512,)
        emb = emb.flatten().astype(np.float32)

        # ✅ L2 normalize (REQUIRED for cosine FAISS)
        emb = emb / np.linalg.norm(emb)

        return emb  # shape (512,)

    # ✅ BUILD FAISS INDEX
    def build_index(self, embeddings):
        """
        embeddings: np.array shape (N,512)
        """
        dim = 512

        # cosine similarity → use inner product on normalized vectors
        index = faiss.IndexFlatIP(dim)

        index.add(embeddings.astype(np.float32))

        return index

    # ✅ SEARCH (REPLACES VERIFY)
    def search(self, query_img, index, id_map, top_k=5):
        """
        query_img: raw image
        index: faiss index
        id_map: list mapping index → user info
        """

        query_emb = self.predict(query_img).reshape(1, -1)

        scores, indices = index.search(query_emb, top_k)

        results = []

        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue

            results.append({
                "id": id_map[idx],
                "score": float(score)  # higher = better
            })

        return results
