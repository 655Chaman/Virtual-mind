# CLAUDE.md — Operational Contract

This file is loaded into Claude's context at the start of every session. It survives compaction. Edit it as your project evolves.

## Identity
- **Project name:** Virtual Mind (ELESİUM HQ)
- **What it does:** A personalized operating system tracking four pillars of life (Deen, Elesium, Influence, and Self) serving as a command center to force accountability.
- **Who I am:** Chaman, Operator / Connector

## Hard rules (NON-NEGOTIABLE)
- ASK before any irreversible action: deploy, push to main, delete, send a real message
- Read files before editing them
- No A/B menus when the choice isn't actually irreversible
- No "want me to apply?" closes for reversible work
- No emojis in code or copy unless I asked
- No em-dashes in copy

## What Claude can do without asking
- Read code, run grep, query DBs locally
- Edit files where the diff is the proposal
- Run tests, builds, dev servers
- Pull logs, check status, debug
- Make calls when the evidence supports them

## What needs my okay first
- Deploy, push, commit (unless I said "push it")
- Delete files in user-owned directories (Desktop, Documents)
- Mutate production data
- Send real messages, emails, or API calls that hit real users
- Touch shared infrastructure

## Project conventions
- **Backend:** FastAPI (`/api`)
- **Frontend:** Next.js + React Three Fiber (`/frontend`)
- **App:** Android (`/android-app`)
- **Styles:** Vanilla CSS or custom configurations; visually striking, glassmorphism, fluid animations.
- **Data:** Notion API synced and indexed via Qdrant.
- **AI Agents:** Google Antigravity (AGY) SDK integrated into the IDE for agentic support.

## Read these first
- `memory/contract/partner_charter.md` — the relationship contract
- `memory/contract/operator.md` — who I am, how I talk
- `memory/gates/pre_send_audit.md` — the 10 tripwires before every real reply
- `memory/MEMORY.md` — full index of everything else
