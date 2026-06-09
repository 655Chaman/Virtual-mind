#!/usr/bin/env python3
"""
VIRTUAL MIND — MEMORY SEED SCRIPT
Seeds the Qdrant vector brain with context from:
  - decision_context.md  → ambitions + phase 0 goals
  - flaws.md             → worldview (self-knowledge)
  - operator_log.md      → reflection + accountability entries

Run once after first install:
  source venv/bin/activate && python scripts/seed_memory.py
"""

import os
import sys
import json

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from brain.memory import memory_system

print("🧠 Virtual Mind — Memory Seeding Initiated")
print(f"   Project root: {PROJECT_ROOT}")
print()


def read_file(filename: str) -> str:
    path = os.path.join(PROJECT_ROOT, filename)
    if not os.path.exists(path):
        print(f"   [SKIP] {filename} — not found")
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# ── 1. DECISION CONTEXT → Ambitions ──────────────────────────────────────────

print("📌 [1/3] Seeding decision_context.md → AMBITIONS")
ctx = read_file("decision_context.md")
if ctx:
    # Split into meaningful chunks by section
    sections = [s.strip() for s in ctx.split("---") if s.strip()]
    added = 0
    for section in sections:
        if len(section) > 50:
            ok = memory_system.add_ambition(section[:800], metadata={"source": "decision_context.md"})
            if ok:
                added += 1
    print(f"   ✓ {added} ambition chunks seeded")

    # Also add as worldview (the philosophy / mindset rules)
    mindset_rules_start = ctx.find("MINDSET RULES")
    if mindset_rules_start > -1:
        mindset = ctx[mindset_rules_start:mindset_rules_start + 1000]
        memory_system.add_worldview(mindset, metadata={"source": "decision_context.md", "section": "mindset_rules"})
        print("   ✓ Mindset rules seeded as worldview")

# ── 2. FLAWS → Worldview (Self-Knowledge) ────────────────────────────────────

print()
print("🪞 [2/3] Seeding flaws.md → WORLDVIEW")
flaws = read_file("flaws.md")
if flaws:
    # Each flaw is a numbered section
    flaw_sections = [s.strip() for s in flaws.split("###") if s.strip() and len(s.strip()) > 30]
    added = 0
    for section in flaw_sections:
        if section[0].isdigit():  # Numbered flaw
            ok = memory_system.add_worldview(section[:600], metadata={"source": "flaws.md", "type": "self_knowledge"})
            if ok:
                added += 1
    print(f"   ✓ {added} flaw entries seeded as worldview")

# ── 3. OPERATOR LOG → Reflections + Accountability ───────────────────────────

print()
print("⚡ [3/3] Seeding operator_log.md → REFLECTIONS")
op_log = read_file("operator_log.md")
if op_log:
    # Extract observed patterns
    if "Observed Patterns" in op_log:
        patterns_start = op_log.find("Observed Patterns")
        patterns = op_log[patterns_start:patterns_start + 2000]
        ok = memory_system.add_reflection(
            patterns,
            metadata={"source": "operator_log.md", "section": "observed_patterns"},
        )
        if ok:
            print("   ✓ Observed patterns seeded as reflection")

    # Commitments and key quotes as accountability entries
    if "Commitments Made" in op_log:
        commit_start = op_log.find("Commitments Made")
        commitments = op_log[commit_start:commit_start + 500]
        memory_system.add_accountability_log(
            commitments,
            metadata={"source": "operator_log.md"},
        )
        print("   ✓ Commitments seeded as accountability log")

    if "Key Quotes" in op_log:
        quotes_start = op_log.find("Key Quotes")
        quotes = op_log[quotes_start:quotes_start + 500]
        memory_system.add_philosophical_insight(
            quotes,
            metadata={"source": "operator_log.md", "section": "key_quotes"},
        )
        print("   ✓ Key quotes seeded as philosophical insights")

# ── Summary ───────────────────────────────────────────────────────────────────

print()
stats = memory_system.get_collection_stats()
print("✅ Seeding complete.")
print(f"   Collection: {stats.get('total_points', '?')} total memory points stored")
print()
print("   The Virtual Mind brain is now initialized.")
print("   Start the system with: ./start.sh")
