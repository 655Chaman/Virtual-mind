"""
VIRTUAL MIND: ELESIUM BRIDGE
VERSION: 3.0 — DUAL DOMAIN

Two arms of Elesium live here:
  - /data/elesium/business/       → SDR pipeline, outreach, MRR, clients
  - /data/elesium/content_creation/ → carousels, stories, hooks, streak, daily output

Lightweight bridge between Virtual Mind and both execution arms.
"""

import os
import json
from datetime import datetime, date
from typing import Optional, List

# ─── PATHS ────────────────────────────────────────────────────────────────────

_ROOT = os.path.dirname(os.path.dirname(__file__))  # Virtual-mind/

# Business
BUSINESS_DIR        = os.path.join(_ROOT, "data", "elesium", "business")
METRICS_PATH        = os.path.join(BUSINESS_DIR, "metrics.json")
OUTREACH_LOG_PATH   = os.path.join(BUSINESS_DIR, "outreach_log.jsonl")

# Content Creation
CONTENT_DIR         = os.path.join(_ROOT, "data", "elesium", "content_creation")
CONTENT_LOG_PATH    = os.path.join(CONTENT_DIR, "daily_log.json")
CONTENT_HISTORY_PATH = os.path.join(CONTENT_DIR, "history.jsonl")

# Shared Context (legacy bridge to Elesium-hq sibling project)
SHARED_CONTEXT_PATH = os.path.join(_ROOT, "shared", "context.json")
ELESIUM_HQ_PATH     = os.path.join(os.path.dirname(_ROOT), "Elesium-hq")
ELESIUM_SDR_LOG_PATH   = os.path.join(ELESIUM_HQ_PATH, "sdr-agency-pipeline", "pipeline.log")
ELESIUM_SDR_LEADS_PATH = os.path.join(ELESIUM_HQ_PATH, "sdr-agency-pipeline", "seen_companies.json")


# ─── SHARED CONTEXT (legacy) ──────────────────────────────────────────────────

def _ensure_shared_dir():
    os.makedirs(os.path.dirname(SHARED_CONTEXT_PATH), exist_ok=True)


def load_shared_context() -> dict:
    """Load the shared context between Virtual Mind and Elesium-hq."""
    if os.path.exists(SHARED_CONTEXT_PATH):
        try:
            with open(SHARED_CONTEXT_PATH, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    return {
        "virtual_mind": {
            "current_priorities": [],
            "active_commitments": [],
            "phase0_day": 0,
        },
        "elesium": {
            "campaigns_run": 0,
            "leads_scraped": 0,
            "proposals_sent": 0,
            "revenue_total": 0,
            "last_activity": None,
        },
    }


def save_shared_context(data: dict):
    _ensure_shared_dir()
    with open(SHARED_CONTEXT_PATH, "w") as f:
        json.dump(data, f, indent=2)


def update_virtual_mind_context(priorities: list = None, commitments: list = None, phase0_day: int = None):
    """Update Virtual Mind's side of the shared context."""
    ctx = load_shared_context()
    if priorities is not None:
        ctx["virtual_mind"]["current_priorities"] = priorities
    if commitments is not None:
        ctx["virtual_mind"]["active_commitments"] = commitments
    if phase0_day is not None:
        ctx["virtual_mind"]["phase0_day"] = phase0_day
    ctx["virtual_mind"]["last_updated"] = datetime.now().isoformat()
    save_shared_context(ctx)


# ─── BUSINESS ARM ─────────────────────────────────────────────────────────────

def _ensure_business_dir():
    os.makedirs(BUSINESS_DIR, exist_ok=True)


def _default_business_metrics() -> dict:
    return {
        "last_updated": datetime.now().isoformat(),
        "emails_sent_total": 0,
        "emails_sent_today": 0,
        "replies_received": 0,
        "positive_replies": 0,
        "calls_booked": 0,
        "meetings_booked_month": 0,
        "clients_closed": 0,
        "mrr_usd": 0.0,
        "mrr_target": 1000,
        "essays_published": 0,
        "emails_target_day45": "first paying customer",
        "notes": "",
        "first_email_date": None
    }


def get_elesium_metrics() -> dict:
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return _default_business_metrics()


def update_elesium_metrics(updates: dict) -> dict:
    _ensure_business_dir()
    metrics = get_elesium_metrics()
    for key, value in updates.items():
        metrics[key] = value
    metrics["last_updated"] = datetime.now().isoformat()
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    return metrics


def log_outreach(emails_sent: int, replies: int, positive: int) -> dict:
    _ensure_business_dir()
    metrics = get_elesium_metrics()

    metrics["emails_sent_total"] += emails_sent
    metrics["emails_sent_today"] = emails_sent
    metrics["replies_received"] += replies
    metrics["positive_replies"] += positive

    if metrics["emails_sent_total"] > 0 and not metrics.get("first_email_date"):
        metrics["first_email_date"] = datetime.now().isoformat()

    metrics["last_updated"] = datetime.now().isoformat()
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "emails_sent": emails_sent,
        "replies": replies,
        "positive": positive
    }
    with open(OUTREACH_LOG_PATH, "a") as f:
        f.write(json.dumps(log_entry) + "\n")

    return metrics


def get_elesium_progress() -> dict:
    metrics = get_elesium_metrics()
    mrr_prog = (metrics["mrr_usd"] / metrics["mrr_target"]) * 100 if metrics.get("mrr_target") else 0
    essays_prog = min((metrics["essays_published"] / 10.0) * 100, 100)
    return {
        "mrr_progress_pct": min(mrr_prog, 100),
        "essays_progress_pct": essays_prog,
        "has_first_customer": metrics["clients_closed"] > 0,
        "metrics": metrics
    }


def get_accountability() -> dict:
    metrics = get_elesium_metrics()
    if metrics["emails_sent_total"] == 0:
        return {
            "status": "ZERO OUTBOUND",
            "message": "Flaw #1 is active.",
            "days_since_first_email": "NEVER SENT",
            "total_emails_sent": 0
        }
    first_date = metrics.get("first_email_date")
    if first_date:
        d = datetime.fromisoformat(first_date)
        days = (datetime.now() - d).days
    else:
        days = "UNKNOWN"
    return {
        "status": "ACTIVE",
        "message": "Outreach is flowing.",
        "days_since_first_email": days,
        "total_emails_sent": metrics["emails_sent_total"],
        "clients_closed": metrics["clients_closed"]
    }


def get_live_execution_metrics() -> dict:
    """Parses real data from the Elesium-hq sibling project."""
    metrics = {
        "leads_scraped_total": 0,
        "last_activity": None,
        "recent_outreach": False,
        "is_connected": False
    }
    if os.path.exists(ELESIUM_SDR_LEADS_PATH):
        try:
            with open(ELESIUM_SDR_LEADS_PATH, "r") as f:
                leads = json.load(f)
                metrics["leads_scraped_total"] = len(leads)
                metrics["is_connected"] = True
        except Exception:
            pass
    if os.path.exists(ELESIUM_SDR_LOG_PATH):
        metrics["is_connected"] = True
        try:
            with open(ELESIUM_SDR_LOG_PATH, "r") as f:
                lines = f.readlines()
                last_lines = lines[-100:]
            for line in reversed(last_lines):
                if "," in line and "[" in line:
                    parts = line.split("  ")
                    if len(parts) > 1:
                        metrics["last_activity"] = parts[0].strip()
                        break
            for line in last_lines:
                if "Attempting" in line or "Success" in line:
                    metrics["recent_outreach"] = True
                    break
        except Exception:
            pass
    return metrics


def get_business_status() -> str:
    """Returns a formatted business status string for display."""
    ctx = load_shared_context()
    elesium = ctx.get("elesium", {})
    vm = ctx.get("virtual_mind", {})

    lines = [
        "🏢 ELESIUM BUSINESS STATUS",
        "═" * 40,
        f"   Campaigns Run: {elesium.get('campaigns_run', 0)}",
        f"   Leads Scraped: {elesium.get('leads_scraped', 0)}",
        f"   Proposals Sent: {elesium.get('proposals_sent', 0)}",
        f"   Revenue: ${elesium.get('revenue_total', 0):,.2f}",
        f"   Last Activity: {elesium.get('last_activity', 'None')}",
        "",
        "🎯 VIRTUAL MIND PRIORITIES:",
    ]
    priorities = vm.get("current_priorities", [])
    if priorities:
        for p in priorities:
            lines.append(f"   - {p}")
    else:
        lines.append("   No priorities set. Use the bridge to sync.")
    commitments = vm.get("active_commitments", [])
    if commitments:
        lines.append("\n📋 ACTIVE COMMITMENTS:")
        for c in commitments:
            lines.append(f"   - {c}")
    return "\n".join(lines)


# ─── CONTENT CREATION ARM ─────────────────────────────────────────────────────

def _ensure_content_dir():
    os.makedirs(CONTENT_DIR, exist_ok=True)


def _today_str() -> str:
    return date.today().isoformat()


def _default_content_log() -> dict:
    return {
        "last_updated": None,
        "today": {
            "date": None,
            "content_pieces_total": 0,
            "carousels_posted": 0,
            "stories_posted": 0,
            "reels_posted": 0,
            "tweets_posted": 0,
            "threads_posted": 0,
            "long_form_posted": 0,
            "hooks_used": [],
            "carousel_types": [],
            "topics_covered": [],
            "platforms": [],
            "best_performing_hook": None,
            "notes": ""
        },
        "streak": {
            "current_days": 0,
            "longest_days": 0,
            "last_post_date": None
        },
        "totals": {
            "carousels_all_time": 0,
            "stories_all_time": 0,
            "reels_all_time": 0,
            "content_pieces_all_time": 0,
            "hooks_library": [],
            "carousel_types_used": {},
            "most_used_hook": None
        }
    }


def get_content_log() -> dict:
    if os.path.exists(CONTENT_LOG_PATH):
        try:
            with open(CONTENT_LOG_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return _default_content_log()


def _save_content_log(data: dict):
    _ensure_content_dir()
    data["last_updated"] = datetime.now().isoformat()
    with open(CONTENT_LOG_PATH, "w") as f:
        json.dump(data, f, indent=2)


def _reset_today_if_new_day(log: dict) -> dict:
    """If today's date differs from stored date, archive yesterday and reset."""
    today = _today_str()
    if log["today"].get("date") != today:
        # Archive the previous day if it had content
        if log["today"].get("date") and log["today"].get("content_pieces_total", 0) > 0:
            _archive_day(log["today"])
            _update_streak(log, had_content=True)
        elif log["today"].get("date"):
            _update_streak(log, had_content=False)

        # Reset today
        log["today"] = {
            "date": today,
            "content_pieces_total": 0,
            "carousels_posted": 0,
            "stories_posted": 0,
            "reels_posted": 0,
            "tweets_posted": 0,
            "threads_posted": 0,
            "long_form_posted": 0,
            "hooks_used": [],
            "carousel_types": [],
            "topics_covered": [],
            "platforms": [],
            "best_performing_hook": None,
            "notes": ""
        }
    return log


def _archive_day(today_snapshot: dict):
    """Append a completed day to history.jsonl."""
    _ensure_content_dir()
    with open(CONTENT_HISTORY_PATH, "a") as f:
        f.write(json.dumps(today_snapshot) + "\n")


def _update_streak(log: dict, had_content: bool):
    """Update the posting streak based on whether yesterday had content."""
    streak = log.setdefault("streak", {"current_days": 0, "longest_days": 0, "last_post_date": None})
    if had_content:
        streak["current_days"] += 1
        streak["longest_days"] = max(streak["longest_days"], streak["current_days"])
        streak["last_post_date"] = log["today"].get("date")
    else:
        streak["current_days"] = 0


def _recompute_totals(log: dict):
    """Recalculate totals from today + history."""
    totals = log.setdefault("totals", {
        "carousels_all_time": 0,
        "stories_all_time": 0,
        "reels_all_time": 0,
        "content_pieces_all_time": 0,
        "hooks_library": [],
        "carousel_types_used": {},
        "most_used_hook": None
    })
    today = log["today"]
    totals["carousels_all_time"]      += today.get("carousels_posted", 0)
    totals["stories_all_time"]        += today.get("stories_posted", 0)
    totals["reels_all_time"]          += today.get("reels_posted", 0)
    totals["content_pieces_all_time"] += today.get("content_pieces_total", 0)

    # Accumulate hooks library (deduplicated)
    for hook in today.get("hooks_used", []):
        if hook and hook not in totals["hooks_library"]:
            totals["hooks_library"].append(hook)

    # Accumulate carousel type counts
    for ctype in today.get("carousel_types", []):
        if ctype:
            totals["carousel_types_used"][ctype] = totals["carousel_types_used"].get(ctype, 0) + 1

    # Determine most-used hook
    if totals["hooks_library"]:
        totals["most_used_hook"] = totals["hooks_library"][0]  # Simplified; will improve with history scan


def log_content_day(
    carousels: int = 0,
    stories: int = 0,
    reels: int = 0,
    tweets: int = 0,
    threads: int = 0,
    long_form: int = 0,
    hooks_used: Optional[List[str]] = None,
    carousel_types: Optional[List[str]] = None,
    topics: Optional[List[str]] = None,
    platforms: Optional[List[str]] = None,
    best_hook: Optional[str] = None,
    notes: str = ""
) -> dict:
    """
    Log today's content creation activity.
    Calling multiple times in the same day ADDS to today's totals.
    """
    log = get_content_log()
    log = _reset_today_if_new_day(log)

    today = log["today"]
    today["date"]                  = _today_str()
    today["carousels_posted"]      += carousels
    today["stories_posted"]        += stories
    today["reels_posted"]          += reels
    today["tweets_posted"]         += tweets
    today["threads_posted"]        += threads
    today["long_form_posted"]      += long_form
    today["content_pieces_total"]  = (
        today["carousels_posted"] +
        today["stories_posted"]   +
        today["reels_posted"]     +
        today["tweets_posted"]    +
        today["threads_posted"]   +
        today["long_form_posted"]
    )

    # Merge lists (deduplicate)
    for hook in (hooks_used or []):
        if hook and hook not in today["hooks_used"]:
            today["hooks_used"].append(hook)
    for ctype in (carousel_types or []):
        if ctype and ctype not in today["carousel_types"]:
            today["carousel_types"].append(ctype)
    for topic in (topics or []):
        if topic and topic not in today["topics_covered"]:
            today["topics_covered"].append(topic)
    for platform in (platforms or []):
        if platform and platform not in today["platforms"]:
            today["platforms"].append(platform)

    if best_hook:
        today["best_performing_hook"] = best_hook
    if notes:
        today["notes"] = notes

    _save_content_log(log)
    return log


def get_content_summary() -> dict:
    """Dashboard-ready content creation summary."""
    log = get_content_log()
    log = _reset_today_if_new_day(log)

    today = log["today"]
    streak = log.get("streak", {})
    totals = log.get("totals", {})

    return {
        "today": {
            "date": today.get("date"),
            "content_pieces": today.get("content_pieces_total", 0),
            "carousels": today.get("carousels_posted", 0),
            "stories": today.get("stories_posted", 0),
            "reels": today.get("reels_posted", 0),
            "tweets": today.get("tweets_posted", 0),
            "threads": today.get("threads_posted", 0),
            "long_form": today.get("long_form_posted", 0),
            "hooks_used": today.get("hooks_used", []),
            "carousel_types": today.get("carousel_types", []),
            "topics": today.get("topics_covered", []),
            "platforms": today.get("platforms", []),
            "best_hook": today.get("best_performing_hook"),
            "notes": today.get("notes", ""),
        },
        "streak": {
            "current_days": streak.get("current_days", 0),
            "longest_days": streak.get("longest_days", 0),
            "last_post_date": streak.get("last_post_date"),
        },
        "all_time": {
            "carousels": totals.get("carousels_all_time", 0),
            "stories": totals.get("stories_all_time", 0),
            "reels": totals.get("reels_all_time", 0),
            "total_pieces": totals.get("content_pieces_all_time", 0),
            "hooks_library": totals.get("hooks_library", []),
            "carousel_types_breakdown": totals.get("carousel_types_used", {}),
            "most_used_hook": totals.get("most_used_hook"),
        }
    }


def get_content_history(last_n_days: int = 7) -> list:
    """Returns the last N days of archived content logs."""
    if not os.path.exists(CONTENT_HISTORY_PATH):
        return []
    try:
        with open(CONTENT_HISTORY_PATH, "r") as f:
            lines = f.readlines()
        days = [json.loads(l) for l in lines if l.strip()]
        return days[-last_n_days:]
    except Exception:
        return []
