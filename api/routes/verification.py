import os
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from google import genai
from google.genai import types
from PIL import Image, ExifTags
import io

verification_router = APIRouter()

client = None
try:
    client = genai.Client()
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Warning: Could not initialize Gemini Client: {e}")

@verification_router.post("/api/verify-work")
async def verify_proof_of_work(
    task_name: str = Form(...),
    required_gesture: str = Form(...), # e.g. "Hold up 3 fingers"
    wager_start_time: str = Form(...), # ISO format string
    photo: UploadFile = File(...)
):
    """
    Validates a proof-of-work photo completely in-memory using Gemini Vision,
    enforcing strict Anti-Cheat rules (EXIF Timestamps + Hostage Gestures).
    """
    if not client:
        raise HTTPException(status_code=500, detail="Gemini AI is not configured on the server.")

    if not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        # 1. Zero Local Storage: Read directly into RAM
        image_bytes = await photo.read()
        
        # 2. ANTI-CHEAT: EXIF Timestamp Audit
        # Load the image into PIL from RAM to extract EXIF
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            exif_data = pil_img._getexif()
            if exif_data:
                # Find the DateTimeOriginal tag
                datetime_original = None
                for tag_id, value in exif_data.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    if tag == 'DateTimeOriginal':
                        datetime_original = value
                        break
                
                if datetime_original:
                    # EXIF format is 'YYYY:MM:DD HH:MM:SS'
                    photo_time = datetime.strptime(datetime_original, '%Y:%m:%d %H:%M:%S')
                    wager_time = datetime.fromisoformat(wager_start_time.replace('Z', '+00:00'))
                    
                    # Ensure the photo was taken AFTER the wager started
                    if photo_time.timestamp() < wager_time.timestamp():
                        return {
                            "verified": False,
                            "message": "ANTI-CHEAT TRIGGERED: EXIF timestamp shows this is an old photo.",
                            "reason": f"Photo taken at {photo_time}, but wager started at {wager_time}."
                        }
        except Exception as e:
            import traceback
            traceback.print_exc()
            # If EXIF extraction fails, we might still proceed and rely on the AI gesture
            print(f"EXIF Extraction Warning: {e}")

        # 3. Convert to Gemini format
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=photo.content_type
        )
        
        # 4. ANTI-CHEAT: The "Hostage Photo" Gesture Validation
        prompt = f"""
        You are a ruthless accountability judge. 
        The user claimed to have completed the following task: '{task_name}'. 
        They submitted this photo as proof. 
        
        CRITICAL SECURITY REQUIREMENT:
        To prove this is a live photo, the user was instructed to perform this exact gesture in the photo: '{required_gesture}'.
        
        Analyze the photo carefully. 
        If the user IS NOT performing the gesture '{required_gesture}', you MUST return exactly 'FALSE' followed by a space and 'Failed security gesture check.'
        If the photo is fake, irrelevant (e.g. an Xbox controller), or suspicious, return exactly 'FALSE' followed by a 1-sentence reason why.
        If it genuinely depicts the completion of the task AND the gesture is present, return exactly 'TRUE'.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, image_part],
            config=types.GenerateContentConfig(
                temperature=0.0,
            )
        )
        
        result_text = response.text.strip()
        
        # 5. The Erasure (Memory Wipe)
        del image_bytes
        del image_part
        if 'pil_img' in locals():
            pil_img.close()
            del pil_img
        
        # 6. Parse Execution Result
        if result_text.startswith("TRUE"):
            return {
                "verified": True,
                "message": "Task and security gesture verified. XP awarded.",
                "reason": ""
            }
        else:
            reason = result_text.replace("FALSE", "", 1).strip()
            return {
                "verified": False,
                "message": "Task verification failed. Stake has been burned.",
                "reason": reason
            }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await photo.close()
