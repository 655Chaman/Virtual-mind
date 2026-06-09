try:
    from sentence_transformers import SentenceTransformer
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    print("Warning: 'sentence-transformers' not found. Using mock embeddings.")

class Embeddings:
    def __init__(self):
        if HAS_TRANSFORMERS:
            # Better semantic model — 768 dimensions
            self.model = SentenceTransformer('all-mpnet-base-v2')
        else:
            self.model = None

    def get_embedding(self, text: str):
        """
        Generates a vector embedding for the given text.
        """
        if self.model:
            return self.model.encode(text).tolist()
        else:
            # Mock embedding: deterministic hash-based vector for testing without deps
            # This is just a placeholder to keep the code running if install fails
            import hashlib
            hash_object = hashlib.md5(text.encode())
            # create a pseudo-random vector of size 384 (standard for MiniLM)
            seed = int(hash_object.hexdigest(), 16)
            import random
            random.seed(seed)
            return [random.random() for _ in range(768)]
