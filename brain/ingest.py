"""
VIRTUAL MIND: CONTENT INGESTION ENGINE
VERSION: 2.0 — THE SUPREME UPGRADE

Features:
- Deduplication via content hashing before embedding
- Source tracking (records what's been ingested)
- Auto-classification of content type (ambition, worldview, tactical, spiritual)
- Smart chunking with overlap for context preservation
- PDF support
"""

import os
import hashlib
import json
from brain.memory import memory_system


# ─── SOURCE TRACKING ───────────────────────────────────────────────────────────

INGESTED_SOURCES_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "logs", "ingested_sources.json"
)


def _load_ingested_sources() -> dict:
    """Load the record of what's been ingested."""
    if os.path.exists(INGESTED_SOURCES_PATH):
        try:
            with open(INGESTED_SOURCES_PATH, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    return {}


def _save_ingested_sources(sources: dict):
    """Save the ingested sources record."""
    os.makedirs(os.path.dirname(INGESTED_SOURCES_PATH), exist_ok=True)
    with open(INGESTED_SOURCES_PATH, "w") as f:
        json.dump(sources, f, indent=2)


def _content_hash(text: str) -> str:
    """Generate a hash of text content for dedup tracking."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def _is_already_ingested(file_path: str, content_hash: str) -> bool:
    """Check if a file with this content has already been ingested."""
    sources = _load_ingested_sources()
    if file_path in sources:
        return sources[file_path].get("hash") == content_hash
    return False


def _mark_ingested(file_path: str, content_hash: str, chunk_count: int):
    """Mark a file as ingested."""
    sources = _load_ingested_sources()
    sources[file_path] = {
        "hash": content_hash,
        "chunks": chunk_count,
        "ingested_at": __import__("time").time(),
    }
    _save_ingested_sources(sources)


# ─── CONTENT CLASSIFICATION ───────────────────────────────────────────────────

CLASSIFICATION_KEYWORDS = {
    "ambition": [
        "goal", "mission", "caliphate", "startup", "elesium", "5-year", "10-year",
        "1-year", "non-negotiable", "supreme directive", "objective", "milestone",
        "target", "vision", "achieve", "build",
    ],
    "worldview": [
        "believe", "truth", "society", "human nature", "ego", "power", "philosophy",
        "introspection", "love", "grief", "meaning", "purpose", "motivation",
        "influence", "failure", "change", "generation", "corruption",
    ],
    "spiritual": [
        "allah", "quran", "salah", "prayer", "islam", "prophet", "sunnah",
        "nafs", "iblees", "tawbah", "repent", "sin", "deen", "akhirah",
        "fajr", "dawah", "tawheed", "seerah", "dhikr",
    ],
    "tactical": [
        "code", "build", "deploy", "api", "database", "pricing", "customer",
        "revenue", "marketing", "content", "launch", "mvp", "product",
        "feature", "user", "market", "competitor", "roadmap",
    ],
}


def _llm_classify_content(text: str) -> str:
    """
    Use a lightweight LLM call to classify content type for ingestion.
    Falls back to 'memory' if anything goes wrong.
    """
    try:
        import os
        from openai import OpenAI
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key or "your_gemini_api_key_here" in api_key:
            return "memory"
        
        client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        
        prompt = (
            "Classify the following text into exactly ONE category: "
            "ambition, worldview, spiritual, tactical, philosophical_insight, lesson_learned, memory.\n\n"
            f"Text: \"{text[:500]}\"\n\n"
            "Respond with ONLY the category name."
        )
        
        response = client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=[
                {"role": "system", "content": "You are a classifier. Respond with exactly one category name."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=20,
        )
        category = response.choices[0].message.content.strip().lower()
        valid = {"ambition", "worldview", "spiritual", "tactical", "philosophical_insight", "lesson_learned", "memory"}
        if category in valid:
            return category
    except Exception:
        pass
    return "memory"


def classify_content(text: str) -> str:
    """
    Auto-classify content. Uses keyword matching as fast path,
    falls back to LLM for ambiguous chunks.
    """
    text_lower = text.lower()
    scores = {}

    for category, keywords in CLASSIFICATION_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        scores[category] = score

    top_score = max(scores.values()) if scores else 0
    
    # High confidence keyword match
    if top_score >= 2:
        return max(scores, key=scores.get)

    # Ambiguous — try LLM classification
    if top_score <= 1:
        return _llm_classify_content(text)

    return max(scores, key=scores.get)


# ─── SMART CHUNKING ───────────────────────────────────────────────────────────

def smart_chunk(text: str, chunk_size: int = 500, overlap: int = 100) -> list:
    """
    Chunks text into meaningful segments with overlap for context preservation.
    Tries to break at paragraph boundaries when possible.
    """
    if len(text) <= chunk_size:
        return [text.strip()] if text.strip() else []

    chunks = []
    paragraphs = text.split("\n\n")
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 2 <= chunk_size:
            current_chunk += ("\n\n" if current_chunk else "") + para
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
                # Overlap: keep the last `overlap` characters
                if len(current_chunk) > overlap:
                    current_chunk = current_chunk[-overlap:] + "\n\n" + para
                else:
                    current_chunk = para
            else:
                # Single paragraph exceeds chunk_size — force split
                while len(para) > chunk_size:
                    split_point = para[:chunk_size].rfind(". ")
                    if split_point == -1:
                        split_point = chunk_size
                    else:
                        split_point += 1
                    chunks.append(para[:split_point].strip())
                    para = para[split_point:].strip()
                current_chunk = para

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


# ─── TEXT EXTRACTION ───────────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file."""
    try:
        import PyPDF2
        text = ""
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except ImportError:
        print("⚠️ PyPDF2 not installed. Run: pip install PyPDF2")
        return ""
    except Exception as e:
        print(f"⚠️ Error reading PDF {pdf_path}: {e}")
        return ""


def read_text_file(file_path: str) -> str:
    """Read a text or markdown file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"⚠️ Error reading {file_path}: {e}")
        return ""


# ─── INGESTION PIPELINES ──────────────────────────────────────────────────────

def ingest_file(file_path: str, force: bool = False):
    """
    Ingest a single file with dedup, classification, and source tracking.
    """
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return 0

    # Read content
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        content = extract_text_from_pdf(file_path)
    elif ext in (".md", ".txt"):
        content = read_text_file(file_path)
    else:
        print(f"⚠️ Unsupported file type: {ext}")
        return 0

    if not content.strip():
        print(f"⚠️ Empty content from: {file_path}")
        return 0

    # Dedup check
    content_hash = _content_hash(content)
    if not force and _is_already_ingested(file_path, content_hash):
        print(f"⏭️  Already ingested (unchanged): {os.path.basename(file_path)}")
        return 0

    # Chunk and classify
    chunks = smart_chunk(content)
    ingested_count = 0

    for chunk in chunks:
        content_type = classify_content(chunk)
        metadata = {
            "source": os.path.basename(file_path),
            "source_path": file_path,
        }

        if content_type == "ambition":
            memory_system.add_ambition(chunk, metadata)
        elif content_type == "worldview":
            memory_system.add_worldview(chunk, metadata)
        elif content_type == "spiritual":
            memory_system.add_worldview(chunk, {**metadata, "sub_type": "spiritual"})
        elif content_type == "tactical":
            memory_system.add_memory(chunk, {**metadata, "type": "tactical"})
        else:
            memory_system.add_memory(chunk, metadata)

        ingested_count += 1

    # Mark as ingested
    _mark_ingested(file_path, content_hash, ingested_count)
    print(f"✅ Ingested: {os.path.basename(file_path)} → {ingested_count} chunks [{content_type}]")
    return ingested_count


def ingest_directory(dir_path: str, force: bool = False):
    """Ingest all supported files in a directory (recursive)."""
    if not os.path.isdir(dir_path):
        print(f"❌ Directory not found: {dir_path}")
        return

    total = 0
    supported_ext = {".md", ".txt", ".pdf"}

    for root, dirs, files in os.walk(dir_path):
        for fname in sorted(files):
            if os.path.splitext(fname)[1].lower() in supported_ext:
                file_path = os.path.join(root, fname)
                total += ingest_file(file_path, force=force)

    print(f"\n📊 Total chunks ingested: {total}")


def ingest_ambitions(force: bool = False):
    """Ingest the decision context and core ambitions."""
    base_dir = os.path.dirname(os.path.dirname(__file__))
    files = [
        os.path.join(base_dir, "decision_context.md"),
        os.path.join(base_dir, "inputs", "phase0_action_plan.md"),
        os.path.join(base_dir, "inputs", "minds_to_study.md"),
    ]
    total = 0
    for f in files:
        if os.path.exists(f):
            total += ingest_file(f, force=force)
    print(f"📊 Ambitions: {total} chunks ingested")


def ingest_worldview(force: bool = False):
    """Ingest worldview content from the worldview directory."""
    base_dir = os.path.dirname(os.path.dirname(__file__))
    worldview_dir = os.path.join(base_dir, "inputs", "worldview")
    if os.path.isdir(worldview_dir):
        ingest_directory(worldview_dir, force=force)
    else:
        print(f"⚠️ Worldview directory not found: {worldview_dir}")


def ingest_raw_thoughts(force: bool = False):
    """Ingest raw thoughts and journal entries."""
    base_dir = os.path.dirname(os.path.dirname(__file__))
    thoughts_dir = os.path.join(base_dir, "inputs", "raw_thoughts")
    if os.path.isdir(thoughts_dir):
        ingest_directory(thoughts_dir, force=force)
    else:
        print(f"⚠️ Raw thoughts directory not found: {thoughts_dir}")


def ingest_all(force: bool = False):
    """Run the full ingestion pipeline."""
    print("=" * 50)
    print("🔄 VIRTUAL MIND: FULL INGESTION PIPELINE")
    print("=" * 50)

    print("\n📁 Phase 1: Core Ambitions & Decision Context")
    ingest_ambitions(force=force)

    print("\n📁 Phase 2: Worldview & Philosophy")
    ingest_worldview(force=force)

    print("\n📁 Phase 3: Raw Thoughts & Journals")
    ingest_raw_thoughts(force=force)

    # Stats
    stats = memory_system.get_collection_stats()
    print(f"\n📊 Memory Stats: {stats}")
    print("=" * 50)
    print("✅ Ingestion complete.")


# Allow running directly
if __name__ == "__main__":
    ingest_all()
