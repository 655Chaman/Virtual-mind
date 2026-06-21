import os
import urllib.request
import json
from typing import Dict, Any, Optional

def send_telegram_notification(token: str, chat_id: str, message: str) -> bool:
    """Dispatches a notification message via the Telegram Bot API."""
    url = f"https://api.telegram.com/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status == 200:
                return True
            else:
                print(f"[NOTIFICATION] Telegram failed with code {response.status}: {response.read().decode()}")
                return False
    except Exception as e:
        print(f"[NOTIFICATION] Telegram error: {e}")
        return False

def send_discord_notification(webhook_url: str, message: str) -> bool:
    """Dispatches a notification message via a Discord Webhook URL."""
    payload = {
        "content": message
    }
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(webhook_url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status in (200, 204):
                return True
            else:
                print(f"[NOTIFICATION] Discord failed with code {response.status}: {response.read().decode()}")
                return False
    except Exception as e:
        print(f"[NOTIFICATION] Discord error: {e}")
        return False

def dispatch_notification(message: str) -> bool:
    """
    Core dispatcher that reads provider settings from .env 
    and sends the notification message.
    """
    provider = os.getenv("NOTIFICATION_PROVIDER", "").lower()
    
    if provider == "telegram":
        token = os.getenv("TELEGRAM_BOT_TOKEN")
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
        if not token or not chat_id:
            print("[NOTIFICATION] Telegram credentials missing in environment.")
            return False
        # Remove markdown stars if they cause telegram API issues or escape them if needed
        # Clean markdown to be safe
        return send_telegram_notification(token, chat_id, message)
        
    elif provider == "discord":
        webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
        if not webhook_url:
            print("[NOTIFICATION] Discord Webhook URL missing in environment.")
            return False
        return send_discord_notification(webhook_url, message)
        
    else:
        print(f"[NOTIFICATION] Provider '{provider}' not configured or active.")
        return False
