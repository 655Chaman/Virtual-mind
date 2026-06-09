from fastapi import APIRouter, UploadFile, File
import shutil
from pathlib import Path
import uuid

router = APIRouter()
MEDIA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = MEDIA_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/media/{filename}"}
