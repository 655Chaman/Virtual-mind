import os
import sys
from pathlib import Path

# Add project root to python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
load_dotenv()

from api.services.notifications import dispatch_notification

def main():
    print("==============================================")
    print("VIRTUAL MIND MOBILE NOTIFICATION TEST HARNESS")
    print("==============================================")
    
    provider = os.getenv("NOTIFICATION_PROVIDER", "None")
    print(f"Active Provider: {provider.upper()}")
    
    if provider == "telegram":
        print(f"Telegram Token Length: {len(os.getenv('TELEGRAM_BOT_TOKEN', ''))}")
        print(f"Telegram Chat ID: {os.getenv('TELEGRAM_CHAT_ID', 'None')}")
    elif provider == "discord":
        print(f"Discord Webhook Length: {len(os.getenv('DISCORD_WEBHOOK_URL', ''))}")
        
    print("\nSending test push alert to mobile...")
    success = dispatch_notification(
        "🧠 *VIRTUAL MIND SYSTEM OK*\n"
        "This is a test notification from your Command Center to verify connection. "
        "Frictionless thought channel is online."
    )
    
    if success:
        print("✅ Success! Notification dispatched successfully.")
    else:
        print("❌ Failed. Verify your credentials in the root .env file.")
        print("   If NOTIFICATION_PROVIDER is not set, set it to 'telegram' or 'discord'.")
        
if __name__ == "__main__":
    main()
