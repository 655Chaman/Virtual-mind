import re
from typing import Dict, Any, Optional

class SheetParser:
    """
    Parses raw text sheets into structured log data.
    """
    
    @staticmethod
    def parse_sheet(text: str) -> Dict[str, Any]:
        """
        Extracts Work Done and Lessons Learned from raw text.
        """
        data = {
            "work_done": "",
            "lessons_learned": "",
            "pillars": []
        }
        
        # Simple keyword extraction
        work_match = re.search(r"(?i)(?:work done|what i did|tasks|achievements):?\s*(.*?)(?:\n\n|\n[A-Z]|\Z)", text, re.DOTALL)
        lessons_match = re.search(r"(?i)(?:lessons learned|what i learned|insights|lessons):?\s*(.*?)(?:\n\n|\n[A-Z]|\Z)", text, re.DOTALL)
        
        if work_match:
            data["work_done"] = work_match.group(1).strip()
        
        if lessons_match:
            data["lessons_learned"] = lessons_match.group(1).strip()
            
        # Pillar detection (hashtags or direct mention)
        for pillar in ["DEEN", "ELESIUM", "INFLUENCE", "SELF"]:
            if pillar.upper() in text.upper():
                data["pillars"].append(pillar)
                
        return data
