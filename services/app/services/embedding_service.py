import numpy as np
import random
from typing import List

class EmbeddingService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(EmbeddingService, cls).__new__(cls, *args, **kwargs)
            cls._instance._model = None
            cls._instance._initialized = False
        return cls._instance

    def initialize(self):
        if self._initialized:
            return
        try:
            from sentence_transformers import SentenceTransformer
            from app.config import settings
            # Load the sentence transformer model
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            self._initialized = True
            print(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
        except Exception as e:
            print(f"Warning: Failed to load embedding model ({str(e)}). Running in fallback mock mode.")
            self._model = None
            self._initialized = True

    def embed_text(self, text: str) -> List[float]:
        self.initialize()
        if self._model:
            try:
                embedding = self._model.encode(text, normalize_embeddings=True)
                return embedding.tolist()
            except Exception as e:
                print(f"Embedding generation error: {str(e)}. Using fallback mock.")
                
        # Fallback Mock: Deterministic vector based on text content hash
        # We need a 384 dimensional list
        import hashlib
        h = hashlib.sha256(text.encode('utf-8')).digest()
        random.seed(int.from_bytes(h[:4], byteorder='big'))
        mock_vec = [random.uniform(-0.1, 0.1) for _ in range(384)]
        # Normalize the mock vector
        norm = np.linalg.norm(mock_vec)
        if norm > 0:
            mock_vec = [v / norm for v in mock_vec]
        return mock_vec

    def embed_resume(self, resume_data: dict) -> List[float]:
        parts = []
        if resume_data.get("skills"):
            parts.append("Skills: " + ", ".join(resume_data["skills"]))
        if resume_data.get("education"):
            parts.append("Education: " + str(resume_data["education"]))
        if resume_data.get("projects"):
            parts.append("Projects: " + str(resume_data["projects"]))
        parts.append(resume_data.get("extracted_text", "")[:1000])
        return self.embed_text("\n".join(parts))

    def embed_job(self, job_data: dict) -> List[float]:
        parts = [
            f"Title: {job_data.get('job_title')}",
            f"Skills: {', '.join(job_data.get('skills_json') or [])}",
            f"Description: {job_data.get('description') or ''}",
            f"Qualifications: {job_data.get('minimum_qualifications') or ''}"
        ]
        return self.embed_text("\n".join(parts))
