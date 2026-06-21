from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional, List
from brain.elesium_bridge import (
    # Business
    get_elesium_metrics,
    update_elesium_metrics,
    get_elesium_progress,
    log_outreach,
    get_accountability,
    get_live_execution_metrics,
    # Content Creation
    get_content_summary,
    log_content_day,
    get_content_history,
    get_content_log,
)

router = APIRouter()


# ─── BUSINESS MODELS ──────────────────────────────────────────────────────────

class MetricsUpdate(BaseModel):
    emails_sent_total: Optional[int] = None
    emails_sent_today: Optional[int] = None
    replies_received: Optional[int] = None
    positive_replies: Optional[int] = None
    calls_booked: Optional[int] = None
    meetings_booked_month: Optional[int] = None
    clients_closed: Optional[int] = None
    mrr_usd: Optional[float] = None
    mrr_target: Optional[float] = None
    essays_published: Optional[int] = None
    notes: Optional[str] = None


class OutreachLog(BaseModel):
    emails_sent: int
    replies: int
    positive: int


# ─── CONTENT MODELS ───────────────────────────────────────────────────────────

class ContentLogEntry(BaseModel):
    carousels: int = 0
    stories: int = 0
    reels: int = 0
    tweets: int = 0
    threads: int = 0
    long_form: int = 0
    hooks_used: Optional[List[str]] = None
    carousel_types: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    platforms: Optional[List[str]] = None
    best_hook: Optional[str] = None
    notes: str = ""


# ─── BUSINESS ROUTES ──────────────────────────────────────────────────────────

@router.get("/metrics")
def get_metrics():
    return get_elesium_metrics()


@router.patch("/metrics")
def patch_metrics(update: MetricsUpdate):
    return update_elesium_metrics(update.model_dump(exclude_unset=True))


@router.get("/progress")
def get_progress():
    return get_elesium_progress()


@router.post("/log-outreach")
def post_outreach(log_data: OutreachLog):
    return log_outreach(log_data.emails_sent, log_data.replies, log_data.positive)


@router.get("/accountability")
def accountability():
    return get_accountability()


@router.get("/summary")
def get_elesium_summary():
    """
    Returns a dashboard-ready summary of Elesium business metrics.
    Includes 7-day outreach, reply rate, calls booked, and MRR proxy.
    """
    try:
        metrics = get_elesium_metrics()
        progress = get_elesium_progress()

        emails_sent = metrics.get("emails_sent_total", 0) or 0
        emails_7d   = metrics.get("emails_sent_today", 0) or 0
        replies     = metrics.get("replies_received", 0) or 0
        positive    = metrics.get("positive_replies", 0) or 0
        calls       = metrics.get("calls_booked", 0) or 0
        meetings    = metrics.get("meetings_booked_month", 0) or 0
        mrr         = metrics.get("mrr_usd", 0) or 0

        reply_rate   = round((replies / emails_sent * 100), 1) if emails_sent > 0 else None
        live_metrics = get_live_execution_metrics()

        return {
            "outreach_7d": emails_7d or emails_sent,
            "reply_rate": reply_rate,
            "calls_booked": calls,
            "meetings_booked_month": meetings,
            "mrr_proxy": mrr,
            "positive_replies": positive,
            "phase_target_mrr": progress.get("mrr_target", 1000),
            "live": live_metrics
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "outreach_7d": None,
            "reply_rate": None,
            "calls_booked": None,
            "meetings_booked_month": None,
            "mrr_proxy": 0,
            "error": str(e),
        }


# ─── CONTENT CREATION ROUTES ──────────────────────────────────────────────────

@router.get("/content/summary")
def content_summary():
    """
    Returns today's content stats, posting streak, and all-time totals.
    This is the main dashboard card data for the Content Creation arm.
    """
    return get_content_summary()


@router.get("/content/today")
def content_today():
    """Full raw data for today's content log entry."""
    log = get_content_log()
    return log.get("today", {})


@router.post("/content/log")
def post_content_log(entry: ContentLogEntry):
    """
    Log content produced today. Calling multiple times in the same day
    ADDS to today's running totals (additive, not overwrite).

    Body example:
    {
      "carousels": 2,
      "stories": 5,
      "hooks_used": ["Question hook", "Contrast hook"],
      "carousel_types": ["Educational", "Value bomb"],
      "platforms": ["Instagram"],
      "notes": "Best engagement on carousel #2"
    }
    """
    result = log_content_day(
        carousels=entry.carousels,
        stories=entry.stories,
        reels=entry.reels,
        tweets=entry.tweets,
        threads=entry.threads,
        long_form=entry.long_form,
        hooks_used=entry.hooks_used,
        carousel_types=entry.carousel_types,
        topics=entry.topics,
        platforms=entry.platforms,
        best_hook=entry.best_hook,
        notes=entry.notes,
    )
    return result.get("today", {})


@router.get("/content/history")
def content_history(days: int = Query(default=7, ge=1, le=90)):
    """Returns archived daily logs for the past N days (default: 7)."""
    return get_content_history(last_n_days=days)


@router.get("/content/hooks")
def content_hooks():
    """Returns the accumulated hooks library and most-used hook."""
    log = get_content_log()
    totals = log.get("totals", {})
    return {
        "hooks_library": totals.get("hooks_library", []),
        "most_used_hook": totals.get("most_used_hook"),
        "today_hooks": log.get("today", {}).get("hooks_used", []),
    }


@router.get("/content/carousel-types")
def carousel_types_breakdown():
    """Returns breakdown of carousel types used across all time."""
    log = get_content_log()
    totals = log.get("totals", {})
    return {
        "breakdown": totals.get("carousel_types_used", {}),
        "today_types": log.get("today", {}).get("carousel_types", []),
    }


@router.get("/content/streak")
def content_streak():
    """Returns current posting streak and longest streak."""
    log = get_content_log()
    return log.get("streak", {"current_days": 0, "longest_days": 0, "last_post_date": None})
