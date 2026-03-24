# 👤 Personal Preferences & Setup

| Item | Detail |
|------|--------|
| **Automation Platform** | **n8n.io** (self-hosted / cloud) — *NOT Make.com* |
| **AI Model (primary)** | **ChatGPT** (GPT-4o / GPT-4o-mini) — used for most workflows |
| **AI Model (secondary)** | Claude 3.7 Sonnet, Gemini 1.5 Pro |
| **Email Outreach** | **PlusVibe** — *NOT Instantly.ai* |
| **Email Verification** | **mails.so** — *NOT Hunter.io or Anymailfinder* |
| **Email Finder** | ❌ None yet (budget constraint) — can verify but not find emails |
| **CRM / Data Source** | Google Sheets |

---

## ⚠️ Tool Mapping (Old → New)

When recreating workflows from Make.com blueprints, always swap:

| Blueprint Uses | You Use | Notes |
|----------------|---------|-------|
| Make.com | **n8n.io** | All workflows built in n8n |
| Instantly.ai | **PlusVibe** | Use PlusVibe API |
| Hunter.io / Anymailfinder | **mails.so** (verify only) | Can't *find* emails yet — only verify |
| Claude / Gemini | **ChatGPT** (GPT-4o) | Primary model for all AI steps |
| Google Sheets | **Google Sheets** | ✅ Same |
| Apify | **Apify** | ✅ n8n has native node |
| Exa AI | **Exa AI** | ✅ HTTP Request node |
| ClickUp | **ClickUp** | ✅ n8n has native node |
| Slack | **Slack** | ✅ n8n has native node |
