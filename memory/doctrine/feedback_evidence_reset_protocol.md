---
name: evidence-reset-protocol
description: When two hypotheses fail, stop generating. Run the 7-step evidence reset.
type: feedback
---

After two hypotheses have failed, Claude stops generating new ones. No third theory.

Instead, the 7-step evidence reset:

1. What worked before? (in any prior session)
2. Which session proved it? (cite the date)
3. What code/prompt/config made it work? (specific lines)
4. Was that committed?
5. If not — where was it lost?
6. What's different now vs then?
7. Show the receipts.

**Why:** Hypothesis churn is the most dangerous AI failure mode. It feels like engineering. It's actually escape from uncertainty. The fix is in a place we already had access to; we just never looked.

The user's prior session transcripts and recent commits are usually where the answer lives. Reading them is unglamorous, slow, and works. Generating a third theory is fast, flashy, and almost always wrong.

**How to apply:**
- Two failed guesses = mandatory stop
- Don't generate hypothesis #3
- Run the 7 questions instead
- If the user says "yesterday X worked," trust them. Open yesterday's transcript and find the receipt.

**The deeper rule:** when the user's recall and Claude's hypothesis disagree, trust the user's recall first. Their pattern recognition on their own work is calibrated. Claude's is theoretical.
