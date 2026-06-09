import os
import gspread
from datetime import datetime

class GoogleSheetsDB:
    def __init__(self):
        self.scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ]
        
        # User defined OAuth credentials
        self.credentials_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "google_credentials.json")
        
        # We will store the token and sheet id in Virtual-mind root
        self.work_dir = os.path.dirname(os.path.dirname(__file__))
        self.token_file = os.path.join(self.work_dir, "google_token.json")
        self.sheet_id_file = os.path.join(self.work_dir, ".google_sheet_id")
        
        self.client = None
        self.spreadsheet = None
        self._init_client()

    def _init_client(self):
        if not os.path.exists(self.credentials_file):
            print(f"⚠️ Google credentials file not found at {self.credentials_file}")
            return
            
        try:
            # This triggers the OAuth flow using the browser
            # It creates and saves a localized token file automatically
            self.client = gspread.oauth(
                credentials_filename=self.credentials_file,
                authorized_user_filename=self.token_file,
                scopes=self.scopes
            )
            
            # Check if we already created a sheet
            sheet_id = None
            if os.path.exists(self.sheet_id_file):
                with open(self.sheet_id_file, "r") as f:
                    sheet_id = f.read().strip()
                    
            if sheet_id:
                try:
                    self.spreadsheet = self.client.open_by_key(sheet_id)
                except Exception:
                    # Maybe it was deleted, create a new one
                    sheet_id = None
            
            if not sheet_id:
                # Create a new spreadsheet in the user's Google Drive natively
                print("🔄 Creating a new 'Virtual Mind DB' spreadsheet in your Google Drive...")
                self.spreadsheet = self.client.create("Virtual Mind DB")
                sheet_id = self.spreadsheet.id
                with open(self.sheet_id_file, "w") as f:
                    f.write(sheet_id)
                print(f"✅ Created successfully! You can view it here: https://docs.google.com/spreadsheets/d/{sheet_id}")

        except Exception as e:
            print(f"⚠️ Failed to authenticate with Google Sheets: {e}")

    def guarantee_worksheet(self, title, headers=None):
        if not self.spreadsheet:
            return None
            
        try:
            worksheet = self.spreadsheet.worksheet(title)
        except gspread.exceptions.WorksheetNotFound:
            worksheet = self.spreadsheet.add_worksheet(title=title, rows="1000", cols="20")
            if headers:
                worksheet.append_row(headers)
        return worksheet

    def append_session_log(self, user_input, ai_response):
        ws = self.guarantee_worksheet("Session Logs", ["Timestamp", "User Input", "AI Response"])
        if ws:
            try:
                ws.append_row([datetime.now().isoformat(), user_input, ai_response])
            except Exception as e:
                print(f"⚠️ Failed to log to Sheets: {e}")

    def append_tracker_data(self, date_str, data_dict, all_keys):
        ws = self.guarantee_worksheet("Daily Tracker", ["Date"] + all_keys)
        if not ws:
            return
            
        # Find if row for the date already exists
        try:
            dates = ws.col_values(1)
            row_idx = None
            if date_str in dates:
                row_idx = dates.index(date_str) + 1
        except Exception:
            row_idx = None

        row_data = [date_str]
        for key in all_keys:
            row_data.append(str(data_dict.get(key, "")))
            
        try:
            if row_idx:
                # Update existing row
                cell_range = f"A{row_idx}:{gspread.utils.rowcol_to_a1(row_idx, len(row_data))}"
                ws.update(cell_range, [row_data])
            else:
                # Append new row
                ws.append_row(row_data)
        except Exception as e:
                print(f"⚠️ Failed to track to Sheets: {e}")

sheets_db = GoogleSheetsDB()
