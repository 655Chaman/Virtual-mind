# ⚙️ Recommended AI Settings

Global settings recommendations that apply across all outreach workflows.

---

## Temperature Guide

| Task Type | Recommended Temp | Why |
|-----------|-----------------|-----|
| Company name cleaning | **0.2** | Deterministic — one correct answer |
| JSON extraction | **0.0** | Must be exact structured output |
| Case study extraction | **0.3–0.5** | Factual but needs some flexibility |
| Personalization lines | **0.5–0.7** | Creative but controlled |
| Full email generation | **0.5–0.7** | Natural tone without going off-rails |
| Subject lines | **0.6–0.8** | Needs creativity but within bounds |

---

## Max Tokens Guide

| Output Type | Recommended | Why |
|-------------|-------------|-----|
| One-liner (PS, subject, congrats) | **100–150** | Output is 1 sentence |
| Personalization line | **150–200** | Output is 1–2 sentences |
| Short email reply | **300–500** | A few paragraphs max |
| Case study extraction | **500–800** | Structured but concise |
| Full email body | **500–800** | Complete email |
| ❌ Don't use 2048–4090 | - | Wasteful for short outputs |

---

## System Prompt (Should Always Be Set)

Every AI step should have a system prompt. If missing, add one:

```
You are Saad's outreach assistant. You write casual, human, non-salesy 
messages for B2B cold outreach. Keep it conversational — like a peer 
talking to another founder. No buzzwords, no corporate language, no emojis.
```

---

## Common Issues Found in Existing Workflows

| Issue | Where Found | Fix |
|-------|-------------|-----|
| Temperature = 1.0 | Almost everywhere | Lower to 0.2–0.7 depending on task |
| Max tokens = 2048–4090 | GPT-4o nodes | Lower to 100–500 depending on output |
| No system prompt | Claude steps in E2E Campaign | Add persona + constraints |
| Email filter = "exists only" | Anymailfinder | Add confidence ≥ 80% |
| skip_if_in_workspace = not set | Instantly/PlusVibe | Set to `true` |
