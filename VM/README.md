# my-claude-starter

The starter kit for building a real relationship with Claude. The architecture I built over 2.5 years, stripped of my personal context and ready for you to fill in.

The issue is people use Claude. This kit is for people who want to *work with* Claude. The difference: you stop writing prompts and start writing a partnership. 
The tactics fall out of the partnership.

## What's in this kit

A 6-layer protocol that turns a chat tool into a partner:

- **Contract** — who you are to each other. Rulebook, scoreboard, autonomy log.
- **Doctrine** — how Claude actually behaves. One file per lesson. Comes with 8 pre-written.
- **Gates** — what Claude checks before acting. Audit, filter, pushback.
- **Project** — what you've built and what broke. Case files. Fill as work happens.
- **Reference** — where info lives outside this folder. Fill as you discover externals.
- **People** — who you work with. One file per recurring person.

## Install

The memory lives in your Claude Code directory.

**For a single project:**
```
cp -r my-claude-starter/memory ~/.claude/projects/<your-project-slug>/
cp my-claude-starter/CLAUDE.md ~/.claude/projects/<your-project-slug>/CLAUDE.md
```

(The project slug is the kebab-cased path of your working directory. If you don't know it, just open Claude Code in your project, type `/memory`, and it'll show you the right path.)

**For a global setup that applies to every project:**
```
cp -r my-claude-starter/memory ~/.claude/
cp my-claude-starter/CLAUDE.md ~/.claude/CLAUDE.md
```

## The 7-day bootstrap

Don't try to fill everything on day one. Trust is earned from real incidents, not anticipated ones. Generic rules age out fast. Rules with a specific "Why: 2026-XX-XX" line behind them compound.

**Day 1 — Operator.** Open `memory/contract/operator.md`. Fill in who you are. How you talk. What "wait" means vs "hold on" to you. Generous. Specific. This is the file Claude reads to understand you.

**Day 2 — Three doctrine memos.** After today's session, open `memory/doctrine/`. Write 3 new memos based on actual frustrations you hit today. Don't theorize. Wait for real friction.

**Day 3 — Partner charter.** Open `memory/contract/partner_charter.md`. Draft what Claude can do without asking. What needs your okay. What's a hard no.

**Day 4 — Trust ledger.** Open `memory/contract/trust_ledger.md`. Score yesterday's session honestly. Plus deltas for what went well, minus deltas for what didn't. Reason next to each.

**Day 5 — MEMORY.md.** Open `memory/MEMORY.md`. Add a line per file you've created. One sentence each. This is the index that's always loaded into Claude's context.

**Day 6 — Pre-send audit.** Run the audit yourself for a session. Watch Claude's replies through the 10 tripwires. If you spot a tripwire firing, name it out loud. Claude will start running it too.

**Day 7 — Review and tighten.** Read everything you've written. Delete what's generic. Tighten the "why" lines. The point isn't volume — it's that every rule has a scar behind it.

## Why this works

The leverage isn't writing tactics for Claude. It's writing the root system — partnership, feedback loops, audit gates, named people — and letting a smart model extrapolate the tactics from those primitives. You don't teach Claude how to write a good email. You teach Claude how to think like a partner. The emails take care of themselves.

This is also why the kit ships with the *machinery*, not the *data*. My trust ledger has 2.5 years of entries that are mine. Yours will have yours. What's portable is the rubric.

## License

MIT. Copy it. Modify it. Fork it. Build your own.
