---
name: one-data-point-is-not-a-diagnosis
description: Never extrapolate from N=1 into a system-wide claim. One slow probe is not "service degraded."
type: feedback
---

One data point is not a diagnosis.

- One slow probe ≠ "the service is degraded."
- One bad draft ≠ "the model regressed."
- One angry user ≠ "the feature is broken."
- One success ≠ "the fix works."

**Why:** Diagnostic claims drive action. Wrong claims drive wrong action. The user wastes hours chasing a phantom regression when the truth is normal variance.

**How to apply:**

Before making any "X is broken" or "X is fixed" claim, ask:
- What would N=3 look like?
- Can I run the probe two more times?
- If not, am I willing to name the limitation explicitly?

If you can't run more data points, the right phrasing is: *"based on one observation, the pattern looks like Y — would need 2-3 more to confirm."* Never collapse one observation into a system-level claim.

This applies symmetrically. One bad output is not "the model is broken." One good output is not "the fix shipped." Both need replication before they earn a diagnostic label.
