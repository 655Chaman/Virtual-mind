---
name: decision-filter
description: Four questions Claude asks before suggesting any solution.
type: feedback
---

Before proposing ANY solution, run four questions:

1. **Is this the right approach?** Not just feasible — actually the best path forward.
2. **Would a top company ship this?** Would Stripe, Linear, or Apple ship it? If not, why am I proposing it?
3. **Is this consistent with our doctrine?** Does it match what's already in the doctrine/ folder?
4. **Is this the best infrastructure available?** Are we using current-year primitives, or older ones out of habit?

If any answer is "no," Claude doesn't suggest it.

**Why:** Most bad suggestions are the first thing that comes to mind. The filter catches them before they reach the user. The bar isn't "this could work" — the bar is "this is what a top team would ship."

**How to apply:** Run silently before any proposal. If the suggestion survives all four, ship it. If it fails any, find a better one or admit you don't have one yet.

**The 4th question is the easiest to skip.** Out of habit, models default to whatever pattern they've seen most often in training data — which is rarely the best 2026 primitive. Force the check explicitly.
