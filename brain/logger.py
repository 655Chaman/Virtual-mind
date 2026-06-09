
import json
import os
from datetime import datetime
from brain.sheets_db import sheets_db

class SessionLogger:
    """
    Logs user inputs and AI responses to a JSON file for later analysis.
    """
    def __init__(self, log_dir="logs"):
        self.log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), log_dir)
        os.makedirs(self.log_dir, exist_ok=True)
        
        # Master session registry
        self.master_file = os.path.join(self.log_dir, "sessions.json")
        if not os.path.exists(self.master_file):
            with open(self.master_file, "w") as f:
                json.dump([], f)
        
        # Create a new log file for this session based on timestamp
        self.start_time = datetime.now().isoformat()
        self.session_id = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        self.log_file = os.path.join(self.log_dir, f"session_{self.session_id}.json")
        
        # Initialize log file with empty list
        with open(self.log_file, 'w') as f:
            json.dump([], f)

    def log_interaction(self, user_input, ai_response):
        """
        Appends an interaction to the log file.
        """
        entry = {
            "timestamp": datetime.now().isoformat(),
            "user_input": user_input,
            "ai_response": ai_response
        }
        
        # Read existing logs
        try:
            with open(self.log_file, 'r') as f:
                logs = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            logs = []
            
        logs.append(entry)
        
        # Write back to file
        with open(self.log_file, 'w') as f:
            json.dump(logs, f, indent=2)
            
        # Write to Google Sheets
        sheets_db.append_session_log(user_input, ai_response)

    def get_latest_logs(self):
        """
        Returns the content of the current session log.
        """
        try:
            with open(self.log_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []

    def end_session_and_summarize(self, llm_instance):
        """Called on exit to summarize this session"""
        logs = self.get_latest_logs()
        if not logs:
            return
        
        print("\n[VIRTUAL MIND] Generating session memory...")
        try:
            prompt = (
                "You are generating a concise summary of a Virtual Mind session. "
                "The summary will be loaded at the start of the next session to provide context. "
                "Keep it under 3 sentences. Focus on: What was discussed, what commitments were made, "
                "and what the user was feeling/doing.\n\n"
                f"SESSION LOGS:\n{json.dumps(logs, indent=2)}"
            )
            response = llm_instance.model.generate_content(prompt)
            summary = response.text.strip()
            
            with open(self.master_file, 'r') as f:
                registry = json.load(f)
                
            registry.append({
                "session_id": self.session_id,
                "date": self.start_time,
                "summary": summary
            })
            
            with open(self.master_file, 'w') as f:
                json.dump(registry, f, indent=2)
                
        except Exception as e:
            print(f"Failed to summarize session: {e}")

    @classmethod
    def get_last_sessions(cls, num_sessions=3, log_dir="logs") -> list:
        log_dir_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), log_dir)
        master_file = os.path.join(log_dir_path, "sessions.json")
        try:
            with open(master_file, 'r') as f:
                registry = json.load(f)
            return registry[-num_sessions:] if registry else []
        except (FileNotFoundError, json.JSONDecodeError):
            return []
