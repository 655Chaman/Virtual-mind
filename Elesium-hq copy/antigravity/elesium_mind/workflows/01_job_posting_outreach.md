# 🔧 Workflow 01: Pain Sniffing — Job Posting Outreach

**Platform:** n8n.io
**Purpose:** When a company is hiring for a role you can solve, reach out before they fill it
**Flow:** Google Sheets → Hunter.io → Claude 3.7 Sonnet (x2) → Set Variable → Instantly.ai

> ⚠️ **n8n adaptation:** Swap Hunter.io → mails.so (verify), Claude → ChatGPT, Instantly → PlusVibe

---

## Google Sheet Columns

| Column | Data |
|--------|------|
| A | URL (Company Domain) |
| B | Company Short Description |
| C | Founder Name |
| D | Company Latest Achievement |
| E | Competitor Name |
| F | Company Name |
| G | Marketing Roles |

---

## Final "Dream Email" Template

```
Hey {first_name}—

{AI: Targeted Job Outreach Message}
{AI: Achievement-Based Outreach Message}

Instead of hiring, how about I connect you with top-tier marketing agencies 
that have already helped companies like {Competitor Name}?
No interviews, no guesswork— just experts ready to execute.

Is this worth a 10min chat this week?

Thanks,
Saad, myoProcess
```

---

## AI Steps

| Step | Prompt Template | Purpose |
|------|----------------|---------|
| 1 | #23 (Targeted Job Outreach) | Saw you're hiring for [title] → you need [goals] |
| 2 | #22 (Achievement-Based Outreach) | Noticed [company] working on [initiative] |

---

## Related Prompts

- See [prompt_templates.md](../prompt_templates.md) — Templates #22 and #23
