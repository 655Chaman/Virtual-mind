"""
VIRTUAL MIND: COMMAND CENTER
VERSION: 2.0 — THE SUPREME UPGRADE

Main application entry point with expanded command set:
- ingest     : Run the full ingestion pipeline
- sync_notion: Sync content from Notion
- reflect    : Force self-improvement analysis on latest session
- status     : Show Phase 0 progress and daily checklist
- checkpoint : Run 90-day checkpoint self-assessment
- works      : Display synthesized philosophical core from WORKS
- evolve     : Show the mind's evolution history
- memory     : Show memory system stats
- exit       : End session
"""

import os
import sys
from dotenv import load_dotenv

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from brain.llm import process_input
from brain.logger import SessionLogger
from brain.core_alignment import (
    get_accountability_status,
    get_checkpoint_questions,
    get_daily_checklist,
)
from brain.self_improvement import analyze_and_update_guardrails, get_evolution_history
from brain.memory import memory_system


# ─── WELCOME BANNER ───────────────────────────────────────────────────────────

BANNER = """
╔══════════════════════════════════════════════════════════╗
║                    VIRTUAL MIND 2.0                      ║
║              THE SUPREME UPGRADE — ACTIVE                ║
║                                                          ║
║  "Knowing what you can be and not doing what it takes    ║
║   is a form of Hell." — YOUR WORDS                       ║
╚══════════════════════════════════════════════════════════╝
"""

COMMANDS_HELP = """
📋 AVAILABLE COMMANDS:
   ingest          — Run full content ingestion pipeline
   sync_notion     — Sync content from Notion
   track           — Track a daily item (e.g., track deep_work 4, track salah yes)
   reflect         — Analyze latest session for patterns & growth
   status          — Show Phase 0 progress & daily checklist
   business_status — Show Elesium business metrics
   checkpoint      — Run 90-day checkpoint self-assessment
   works           — Display your synthesized philosophical core
   evolve          — Show the mind's evolution history
   memory          — Show memory system stats
   help            — Show this command list
   exit            — End session
"""


# ─── WORKS DISPLAY ─────────────────────────────────────────────────────────────

def display_works():
    """Read and display the philosophical core document."""
    works_path = os.path.join(
        os.path.dirname(__file__), "inputs", "worldview", "philosophical_core.md"
    )
    if os.path.exists(works_path):
        with open(works_path, "r") as f:
            print(f.read())
    else:
        print("⚠️ Philosophical core not found. Run ingestion first.")


# ─── MAIN LOOP ─────────────────────────────────────────────────────────────────

def main():
    print(BANNER)

    # Show Phase 0 status on startup
    print(get_accountability_status())
    print()

    # Initialize session logger
    logger = SessionLogger()

    # Check yesterday's tracking
    try:
        from brain.tracker import tracker
        from datetime import date, timedelta
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        data = tracker.load_data()
        if yesterday not in data or not data[yesterday]:
            print("⚠️ ACCOUNTABILITY CHECK: You didn't log any tracking data yesterday.")
            print("   Are we building the Caliphate or watching reels?\n")
    except Exception:
        pass

    # Load recent session memory
    last_sessions = SessionLogger.get_last_sessions(3)
    if last_sessions:
        print("🧠 MEMORY RECOVERED: Recently on Virtual Mind...")
        for s in last_sessions:
            print(f"   • [{s['date'].split('T')[0]}] {s['summary']}")
        print()

    print("Type 'help' for available commands.\n")

    while True:
        try:
            user_input = input("🗣️  YOU: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\n⚡ Session ended. Remember: the mission doesn't sleep.")
            try:
                from brain.llm import _get_llm
                logger.end_session_and_summarize(_get_llm())
            except Exception:
                pass
            break

        if not user_input:
            continue

        # ─── COMMAND HANDLING ──────────────────────────────────────────

        cmd = user_input.lower()

        if cmd == "exit":
            print("\n⚡ Session ended. Phase 0 is counting. Every hour matters.")
            try:
                from brain.llm import _get_llm
                logger.end_session_and_summarize(_get_llm())
            except Exception:
                pass
            break

        elif cmd == "help":
            print(COMMANDS_HELP)
            continue

        elif cmd == "ingest":
            print("\n🔄 Starting ingestion pipeline...")
            from brain.ingest import ingest_all
            ingest_all()
            continue

        elif cmd == "sync_notion":
            print("\n🔄 Syncing from Notion...")
            try:
                from brain.notion_sync import sync_from_notion
                sync_from_notion()
            except Exception as e:
                print(f"⚠️ Notion sync failed: {e}")
            continue

        elif cmd.startswith("track "):
            parts = cmd[6:].strip().split(" ", 1)
            if len(parts) == 2:
                item, value = parts
                try:
                    from brain.tracker import tracker
                    print("\n" + tracker.track(item, value))
                except Exception as e:
                    print(f"\n⚠️ Tracking failed: {e}")
            else:
                print("\n⚠️ Invalid format. Use: track <item> <value> (e.g. track deep_work 4)")
            continue

        elif cmd == "reflect":
            analyze_and_update_guardrails()
            continue

        elif cmd == "status":
            print()
            print(get_accountability_status())
            print()
            print(get_daily_checklist())
            print()
            try:
                from brain.tracker import tracker
                print(tracker.get_status_summary())
                print()
            except Exception:
                pass
            stats = memory_system.get_collection_stats()
            print(f"🧠 Memory: {stats.get('total_points', 0)} total entries")
            continue

        elif cmd == "checkpoint":
            print()
            print(get_accountability_status())
            print()
            print(get_checkpoint_questions())
            continue

        elif cmd == "works":
            display_works()
            continue

        elif cmd == "evolve":
            print(get_evolution_history())
            continue

        elif cmd == "memory":
            stats = memory_system.get_collection_stats()
            print(f"\n🧠 MEMORY SYSTEM STATS:")
            print(f"   Total Entries: {stats.get('total_points', 0)}")
            print(f"   Status: {stats.get('status', 'unknown')}")
            continue

        elif cmd == "business_status":
            try:
                from brain.elesium_bridge import get_business_status
                print("\n" + get_business_status())
            except Exception as e:
                print(f"\n⚠️ Elesium bridge failed: {e}")
            continue

        # ─── REGULAR INPUT PROCESSING ──────────────────────────────────

        # Process through the full Virtual Mind pipeline
        response = process_input(user_input)

        # Log the interaction
        logger.log_interaction(user_input, response)

        # Display the response
        print(f"\n🧠 VIRTUAL MIND:\n{response}\n")


if __name__ == "__main__":
    main()
