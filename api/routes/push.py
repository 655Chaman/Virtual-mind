"""
Web Push Notification API Route
Manages VAPID subscriptions and dispatches native push notifications.
No third-party apps required — this is pure browser Web Push API.
"""
import json
import os
from pathlib import Path
from typing import Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Load .env so VAPID keys are available
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")
except ImportError:
    pass


router = APIRouter()

# ─── Subscription Storage ──────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SUBSCRIPTIONS_FILE = PROJECT_ROOT / "data" / "push_subscriptions.json"
SUBSCRIPTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)


def load_subscriptions() -> list:
    if SUBSCRIPTIONS_FILE.exists():
        try:
            return json.loads(SUBSCRIPTIONS_FILE.read_text())
        except Exception:
            return []
    return []


def save_subscriptions(subs: list):
    SUBSCRIPTIONS_FILE.write_text(json.dumps(subs, indent=2))


# ─── VAPID Keys ────────────────────────────────────────────────────────────
# These are loaded from .env — generated once by the setup script
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS_EMAIL = os.getenv("VAPID_CLAIMS_EMAIL", "operator@virtual-mind.local")


def _get_webpush_available() -> bool:
    try:
        from pywebpush import webpush
        return True
    except ImportError:
        return False


# ─── Models ────────────────────────────────────────────────────────────────
class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscription(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
    expirationTime: Any = None


class PushPayload(BaseModel):
    title: str = "⚡ Virtual Mind"
    body: str
    url: str = "/command"
    tag: str = "vm-notification"
    requireInteraction: bool = False


# ─── Routes ────────────────────────────────────────────────────────────────

@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Returns the VAPID public key so the frontend can subscribe."""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(
            status_code=503,
            detail="VAPID keys not configured. Run scripts/generate_vapid_keys.py first."
        )
    return {"publicKey": VAPID_PUBLIC_KEY}


@router.post("/subscribe")
async def subscribe(subscription: PushSubscription):
    """Saves a browser push subscription endpoint from the frontend."""
    subs = load_subscriptions()

    sub_dict = {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.keys.p256dh,
            "auth": subscription.keys.auth,
        },
        "expirationTime": subscription.expirationTime,
    }

    # Check for duplicate endpoint — replace if exists
    existing_endpoints = [s["endpoint"] for s in subs]
    if subscription.endpoint in existing_endpoints:
        subs = [s for s in subs if s["endpoint"] != subscription.endpoint]

    subs.append(sub_dict)
    save_subscriptions(subs)

    print(f"[PUSH] Subscription registered. Total subscribers: {len(subs)}")
    return {"status": "subscribed", "subscribers": len(subs)}


@router.post("/unsubscribe")
async def unsubscribe(subscription: PushSubscription):
    """Removes a browser push subscription."""
    subs = load_subscriptions()
    subs = [s for s in subs if s["endpoint"] != subscription.endpoint]
    save_subscriptions(subs)
    return {"status": "unsubscribed", "subscribers": len(subs)}


@router.post("/send")
async def send_push(payload: PushPayload):
    """
    Dispatches a Web Push notification to ALL registered subscribers.
    Called by the scheduler and manual triggers.
    """
    if not _get_webpush_available():
        raise HTTPException(
            status_code=503,
            detail="pywebpush not installed. Run: pip install pywebpush"
        )

    if not VAPID_PUBLIC_KEY or not VAPID_PRIVATE_KEY:
        raise HTTPException(
            status_code=503,
            detail="VAPID keys missing in environment. Run scripts/generate_vapid_keys.py"
        )

    from pywebpush import webpush, WebPushException

    subs = load_subscriptions()
    if not subs:
        return {"status": "no_subscribers", "sent": 0, "failed": 0}

    message_data = json.dumps({
        "title": payload.title,
        "body": payload.body,
        "url": payload.url,
        "tag": payload.tag,
        "requireInteraction": payload.requireInteraction,
    })

    sent = 0
    failed = 0
    dead_endpoints = []

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": sub["keys"],
                },
                data=message_data,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": f"mailto:{VAPID_CLAIMS_EMAIL}"
                }
            )
            sent += 1
        except WebPushException as e:
            # 410 Gone = subscription expired/unregistered
            if e.response and e.response.status_code in (404, 410):
                dead_endpoints.append(sub["endpoint"])
            print(f"[PUSH] WebPush failed for endpoint: {e}")
            failed += 1
        except Exception as e:
            print(f"[PUSH] Unexpected error: {e}")
            failed += 1

    # Clean up dead subscriptions
    if dead_endpoints:
        remaining = [s for s in subs if s["endpoint"] not in dead_endpoints]
        save_subscriptions(remaining)
        print(f"[PUSH] Cleaned up {len(dead_endpoints)} expired subscriptions.")

    print(f"[PUSH] Dispatched: {sent} sent, {failed} failed.")
    return {"status": "dispatched", "sent": sent, "failed": failed}


@router.get("/status")
async def push_status():
    """Returns current push notification system status."""
    subs = load_subscriptions()
    return {
        "vapid_configured": bool(VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY),
        "pywebpush_available": _get_webpush_available(),
        "active_subscribers": len(subs),
        "ready": bool(VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY and _get_webpush_available()),
    }
