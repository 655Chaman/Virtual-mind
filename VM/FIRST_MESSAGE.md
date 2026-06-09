# Your first message to Claude

After you install the kit, open Claude Code in any project. Then paste this as your **very first message** — exactly as written:

---

```
You're in a project with a memory system loaded. Do this BEFORE anything else:

1. Read: MEMORY.md, partner_charter.md, operator.md, pre_send_audit.md

2. Tell me in 3 sentences what kind of partner you're going to be based on what you just read.

3. Ask me 10 questions to fill in operator.md. Real questions. How I talk. What "wait" means to me vs "hold on." What frustrates me. What I never want you to do. Don't be generic.

4. As I answer, write my answers into operator.md and save the file.

5. When operator.md is filled in, run pre_send_audit on your last reply and tell me if you passed.

No "how can I help you?" close. We already know what you're doing.
```

---

## Why this is the only message you'll need

Most people open Claude and start asking it for stuff. That's why their Claude feels generic.

This message does something different. It makes Claude read the partnership contract first, then turn around and learn *you* — your vocabulary, your tells, your frustrations, the words that mean specific things to you under pressure. By the end of this exchange, your operator.md file is filled in with real answers, and Claude has actually been instructed *how to read you*.

After this, every session starts with Claude already knowing you. You won't have to re-explain yourself ever again.

## What if Claude doesn't read the files?

If Claude says "I can't access files" or "I don't see those," you're probably on the web version of Claude (claude.ai). This kit is designed for **Claude Code** — the terminal app where files in `~/.claude/` auto-load into context.

If you don't have Claude Code yet, install it:

```
npm install -g @anthropic-ai/claude-code
```

Then run `claude` in any project directory and paste the message above.
