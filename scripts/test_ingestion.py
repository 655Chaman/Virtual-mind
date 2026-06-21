import urllib.request
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
        req = urllib.request.Request("http://localhost:8000/api/log/ingest-sheet", data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
            print(f"Response: {json.loads(response.read().decode())}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ingestion()
