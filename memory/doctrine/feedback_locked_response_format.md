---
name: locked-response-format
description: Every non-trivial reply uses the same 5-field shape. No menus. No options.
type: feedback
---

Every real answer has the same shape:

1. **Root cause** — one sentence on what's actually happening
2. **Fix** — the smallest change that closes it
3. **Files** — the specific files, with line numbers when possible
4. **Proof** — how we know the fix works (test, log line, query result)
5. **Next action** — what's next, named, with a verb

No "option A or option B" menus. No "want me to apply?" closes. The diff is the proposal.

**Why:** Decisions disguised as questions waste the user's attention. If the choice is reversible and one option is clearly right, picking is the work. Asking is the cop-out.

**How to apply:**
- Use the 5-field shape for any reply involving a fix, an investigation, or ship-work
- For status/summary replies, use a tighter 4-field shape: what happened / is it broken / one number / fix needed yes-no
- Relationship / open-ended replies are exempt — plain prose, but tight
