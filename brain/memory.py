"""
VIRTUAL MIND: MEMORY SYSTEM
VERSION: 2.0 — THE SUPREME UPGRADE

Features:
- Temporal decay weighting (recent memories matter more)
- Emotional tagging (conviction weight 1-10)
- Deduplication via cosine similarity check (>0.92 = duplicate)
- Expanded memory types: reflection, accountability_log, philosophical_insight, lesson_learned
- Enhanced query with similarity scores and top-5 retrieval
"""

import os
import time
import threading
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
)

# Use Gemini for embeddings to save RAM
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

class GeminiEncoder:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            genai.configure(api_key=self.api_key)
            
    def encode(self, text):
        import numpy as np
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            return np.zeros(768)
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text
            )
            return np.array(result['embedding'])
        except Exception as e:
            print(f"[MEMORY] Embedding error: {e}")
            return np.zeros(768)


# ─── VALID MEMORY TYPES ───────────────────────────────────────────────────────

VALID_TYPES = {
    "ambition",
    "worldview",
    "memory",
    "journal",
    "conversation_history",
    "reflection",
    "accountability_log",
    "philosophical_insight",
    "lesson_learned",
}

# How many days until a memory starts decaying in relevance
TEMPORAL_DECAY_HALF_LIFE_DAYS = 30
DEDUP_SIMILARITY_THRESHOLD = 0.92


class Memory:
    def __init__(self, persistence_dir=None, collection_name="virtual_mind"):
        if persistence_dir is None:
            persistence_dir = os.path.join(os.getcwd(), "brain", "qdrant_db_preview")

        self.persistence_dir = persistence_dir
        self.collection_name = collection_name
        self.encoder = GeminiEncoder()
        self._client = None
        self._initialized = False

    @property
    def client(self):
        """Lazy client initialization to avoid concurrent access during import."""
        if self._client is None:
            self._client = QdrantClient(path=self.persistence_dir)
            if not self._initialized:
                self._ensure_collection()
                self._initialized = True
        return self._client

    def _ensure_collection(self):
        VECTOR_SIZE = 768
        # Use our own client property from a thread-safe context if possible, 
        # but here we are guaranteed to be in the first initialization.
        client = self._client 
        collections = client.get_collections()
        existing = [c for c in collections.collections if c.name == self.collection_name]
        
        if existing:
            # Check if existing collection has the right dimensions
            try:
                info = self.client.get_collection(self.collection_name)
                current_size = info.config.params.vectors.size
                if current_size != VECTOR_SIZE:
                    print(f"[MEMORY] Migrating vector DB: {current_size}d → {VECTOR_SIZE}d (old data will be cleared)")
                    self.client.delete_collection(self.collection_name)
                    self.client.create_collection(
                        collection_name=self.collection_name,
                        vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                    )
            except Exception:
                pass  # If we can't check, assume it's fine
        else:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )

    # ─── DEDUPLICATION ─────────────────────────────────────────────────────

    def _is_duplicate(self, embedding: list, mem_type: str) -> bool:
        """
        Check if a similar entry already exists in the collection.
        Returns True if cosine similarity > threshold.
        """
        try:
            type_filter = Filter(
                must=[FieldCondition(key="type", match=MatchValue(value=mem_type))]
            )
            hits = self.client.query_points(
                collection_name=self.collection_name,
                query=embedding,
                query_filter=type_filter,
                limit=1,
            ).points

            if hits and hits[0].score > DEDUP_SIMILARITY_THRESHOLD:
                return True
        except Exception:
            pass
        return False

    # ─── CORE ADD METHODS ──────────────────────────────────────────────────

    def _add(self, text: str, metadata: dict, skip_dedup: bool = False):
        """Add a memory entry with optional dedup check."""
        embedding = self.encoder.encode(text).tolist()

        # Dedup check
        mem_type = metadata.get("type", "memory")
        if not skip_dedup and self._is_duplicate(embedding, mem_type):
            return False  # Duplicate detected, skip

        metadata["timestamp"] = time.time()
        point_id = int(time.time() * 1000000)

        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={"text": text, **metadata},
                )
            ],
        )
        return True

    def add_memory(self, text: str, metadata: dict = None):
        """Add a general memory (conversation, event, etc.)."""
        if metadata is None:
            metadata = {}
        metadata["type"] = metadata.get("type", "memory")
        # Conversation history should skip dedup (each interaction is unique-ish)
        skip = metadata["type"] == "conversation_history"
        self._add(text, metadata, skip_dedup=skip)

    def add_ambition(self, text: str, metadata: dict = None):
        """Add an ambition/goal entry."""
        if metadata is None:
            metadata = {}
        metadata["type"] = "ambition"
        self._add(text, metadata)

    def add_worldview(self, text: str, metadata: dict = None):
        """Store worldview content — beliefs, opinions, principles, essays."""
        if metadata is None:
            metadata = {}
        metadata["type"] = "worldview"
        self._add(text, metadata)

    def add_reflection(self, text: str, metadata: dict = None):
        """Store a self-reflection or session analysis."""
        if metadata is None:
            metadata = {}
        metadata["type"] = "reflection"
        metadata["emotional_weight"] = metadata.get("emotional_weight", 7)
        self._add(text, metadata)

    def add_accountability_log(self, text: str, metadata: dict = None):
        """Store accountability events (drift detected, challenges issued)."""
        if metadata is None:
            metadata = {}
        metadata["type"] = "accountability_log"
        self._add(text, metadata, skip_dedup=True)

    def add_philosophical_insight(self, text: str, metadata: dict = None):
        """Store new philosophical insights discovered in conversation."""
        if metadata is None:
            metadata = {}
        metadata["type"] = "philosophical_insight"
        metadata["emotional_weight"] = metadata.get("emotional_weight", 8)
        self._add(text, metadata)

    def add_lesson_learned(self, text: str, metadata: dict = None):
        """Store lessons learned from failures or mistakes."""
        if metadata is None:
            metadata = {}
        metadata["type"] = "lesson_learned"
        metadata["emotional_weight"] = metadata.get("emotional_weight", 9)
        self._add(text, metadata)

    # ─── TEMPORAL DECAY ────────────────────────────────────────────────────

    def _apply_temporal_decay(self, hits: list) -> list:
        """
        Apply temporal decay to search results.
        Recent memories get boosted, older ones get decayed.
        """
        now = time.time()
        half_life_seconds = TEMPORAL_DECAY_HALF_LIFE_DAYS * 86400

        for hit in hits:
            timestamp = hit.payload.get("timestamp", now)
            age_seconds = now - timestamp
            # Exponential decay: score * 2^(-age/half_life)
            decay_factor = 2 ** (-age_seconds / half_life_seconds)
            # Emotional weight boost (1-10 scale, normalized)
            emotional_weight = hit.payload.get("emotional_weight", 5) / 10
            hit.score = hit.score * decay_factor * (0.5 + emotional_weight)

        # Re-sort by adjusted score
        hits.sort(key=lambda h: h.score, reverse=True)
        return hits

    # ─── QUERY ─────────────────────────────────────────────────────────────

    def query_memory(self, query_text: str, n_results: int = 5) -> dict:
        """
        Query memory with temporal decay and emotional weighting.
        Returns top results per category with similarity scores.
        """
        query_vector = self.encoder.encode(query_text).tolist()

        # Query Ambitions (top 3 now, not 1)
        ambition_filter = Filter(
            must=[FieldCondition(key="type", match=MatchValue(value="ambition"))]
        )
        amb_hits = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=ambition_filter,
            limit=3,
        ).points

        # Query Worldview
        worldview_filter = Filter(
            must=[FieldCondition(key="type", match=MatchValue(value="worldview"))]
        )
        wv_hits = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=worldview_filter,
            limit=n_results,
        ).points

        # Query Philosophical Insights
        insight_filter = Filter(
            must=[FieldCondition(key="type", match=MatchValue(value="philosophical_insight"))]
        )
        insight_hits = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=insight_filter,
            limit=3,
        ).points

        # Query general Memories (everything else)
        memory_filter = Filter(
            must_not=[
                FieldCondition(key="type", match=MatchValue(value="ambition")),
                FieldCondition(key="type", match=MatchValue(value="worldview")),
                FieldCondition(key="type", match=MatchValue(value="philosophical_insight")),
            ]
        )
        mem_hits = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=memory_filter,
            limit=n_results,
        ).points

        # Apply temporal decay to memories
        mem_hits = self._apply_temporal_decay(mem_hits)

        results = {
            "ambitions": [hit.payload["text"] for hit in amb_hits],
            "worldview": [hit.payload["text"] for hit in wv_hits],
            "insights": [hit.payload["text"] for hit in insight_hits],
            "memories": [hit.payload["text"] for hit in mem_hits],
        }
        
        # LLM-based reranking for memories (most variable category)
        if mem_hits and len(mem_hits) > 1:
            try:
                results["memories"] = self._llm_rerank(query_text, results["memories"])
            except Exception:
                pass  # Fall back to original ordering
        
        return results

    def _llm_rerank(self, query: str, texts: list) -> list:
        """Use a lightweight LLM call to rerank retrieved memories by relevance."""
        import google.generativeai as genai
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here":
            return texts
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        numbered = "\n".join([f"{i+1}. {t[:200]}" for i, t in enumerate(texts)])
        prompt = (
            f"Given the user's question: \"{query}\"\n\n"
            f"Rank these memories from most to least relevant. "
            f"Return ONLY the numbers in order, separated by commas.\n\n{numbered}"
        )
        response = model.generate_content(prompt)
        order = [int(x.strip()) - 1 for x in response.text.strip().split(",") if x.strip().isdigit()]
        reranked = [texts[i] for i in order if 0 <= i < len(texts)]
        # Add any missed items at the end
        for t in texts:
            if t not in reranked:
                reranked.append(t)
        return reranked

    def get_collection_stats(self) -> dict:
        """Get stats about the memory collection."""
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                "total_points": info.points_count,
                "status": info.status.name if info.status else "unknown",
            }
        except Exception as e:
            return {"error": str(e)}


# Global Memory Instance
memory_system = Memory()
