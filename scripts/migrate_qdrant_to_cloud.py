import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from brain.memory import memory_system

def migrate():
    load_dotenv()
    cloud_url = os.getenv("QDRANT_CLOUD_URL")
    api_key = os.getenv("QDRANT_API_KEY")
    
    if not cloud_url or not api_key or "paste_your" in cloud_url:
        print("Error: QDRANT_CLOUD_URL and QDRANT_API_KEY must be set in .env")
        return
        
    print(f"Connecting to Cloud Qdrant: {cloud_url}")
    cloud_client = QdrantClient(url=cloud_url, api_key=api_key)
    
    # 1. Ensure Cloud Collection exists
    VECTOR_SIZE = 768
    collection_name = memory_system.collection_name
    collections = cloud_client.get_collections()
    existing = [c for c in collections.collections if c.name == collection_name]
    
    if not existing:
        print(f"Creating collection '{collection_name}' in the cloud...")
        cloud_client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
    else:
        print(f"Collection '{collection_name}' already exists in cloud.")

    # 2. Get local client and fetch all points
    # (Qdrant doesn't have a simple 'get all' if it's large, but we can scroll)
    local_client = memory_system.client
    local_info = local_client.get_collection(collection_name)
    print(f"Local collection has {local_info.points_count} points.")
    
    if local_info.points_count == 0:
        print("No points to migrate!")
        return

    print("Fetching points from local database...")
    points, next_page_offset = local_client.scroll(
        collection_name=collection_name,
        limit=10000,
        with_payload=True,
        with_vectors=True
    )
    
    print(f"Fetched {len(points)} points. Converting to PointStructs...")
    point_structs = [
        PointStruct(id=p.id, vector=p.vector, payload=p.payload)
        for p in points
    ]
    
    print("Uploading to cloud...")
    cloud_client.upsert(
        collection_name=collection_name,
        points=point_structs
    )
    
    cloud_info = cloud_client.get_collection(collection_name)
    print(f"Migration complete! Cloud collection now has {cloud_info.points_count} points.")

if __name__ == "__main__":
    migrate()
