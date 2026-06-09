import requests
import json

def test_ingestion():
    url = "http://localhost:8000/api/logs/ingest-sheet" 
    
    payload = {
        "text": """
        Daily War Report - 2026-03-25
        
        Work Done:
        - Implemented the Notion Sync service skeleton.
        - Fixed the CalendarView crash.
        - Created the SheetParser for automated extraction.
        
        Lessons Learned:
        - LocalStorage vs Server state management requires careful synchronization.
        - Notion API creates data sources via a specific endpoint that might be strict on properties.
        
        #ELESIUM #SELF
        """
    }
    
    try:
        # Assuming the backend is running on 8000
        # Wait, the logs route prefix is usually /api/logs/ or /api/log/
        # Check api/routes/__init__.py or main.py if possible
        response = requests.post("http://localhost:8000/api/log/ingest-sheet", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ingestion()
