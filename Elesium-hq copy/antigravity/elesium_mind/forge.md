# 🔧 FORGE — Tools, Settings & Build Rules

> **This file is your workbench.** Before building or configuring any workflow, check here first. It tells you what tools to use, what settings to apply, and what pitfalls to avoid.

---

## 🛠️ Tool Stack

| Category | Tool | Notes |
|----------|------|-------|
| **Automation** | **n8n.io** (self-hosted / cloud) | NEVER Make.com |
| **AI (Primary)** | **ChatGPT** (GPT-4o / GPT-4o-mini) | All workflow AI steps |
| **AI (Secondary)** | Claude 3.7 Sonnet, Gemini 1.5 Pro | Only when ChatGPT can't |
| **Email Outreach** | **PlusVibe** | NEVER Instantly.ai |
| **Email Verification** | **mails.so** | NEVER Hunter.io or Anymailfinder |
| **Email Finder** | ❌ None yet | Budget constraint — can verify, can't find |
| **CRM / Data** | **Google Sheets** | Primary database for all prospect data |
| **Lead Scraping** | **Apify** | n8n has a native node |
| **LinkedIn Scraping** | **Exa AI** | Via HTTP Request node |
| **Project Management** | **ClickUp** | CRM task creation for interested leads |
| **Notifications** | **Slack** | Rich Block Kit messages with action buttons |
| **Cloud Deploy** | **Modal** | Webhooks and serverless functions |
| **Forms** | **Tally** (or n8n form trigger) | Client intake forms |

---

## 🔄 Tool Swap Table

When recreating workflows from Make.com / Saad's blueprints, **always swap**:

| Blueprint Uses | You Use | Notes |
|----------------|---------|-------|
| Make.com | **n8n.io** | Rebuild all automations |
| Instantly.ai | **PlusVibe** | Use PlusVibe API calls |
| Hunter.io / Anymailfinder | **mails.so** (verify only) | Can't *find* emails — only verify |
| Claude / Gemini (in workflows) | **ChatGPT** (GPT-4o) | Primary for all AI nodes |
| Instantly (webhooks) | **PlusVibe** (webhooks) | Match webhook event names |
| Google Sheets | **Google Sheets** | ✅ Same |
| Apify | **Apify** | ✅ n8n native node |
| Exa AI | **Exa AI** | ✅ HTTP Request node |
| ClickUp | **ClickUp** | ✅ n8n native node |
| Slack | **Slack** | ✅ n8n native node |

---

## 🌡️ AI Settings — Temperature Guide

**Wrong temperature = bad output.** Match the task type:

| Task Type | Temperature | Why |
|-----------|-------------|-----|
| JSON extraction / parsing | **0.0** | Must be exact structured output |
| Company name cleaning | **0.2** | Deterministic — one correct answer |
| Case study extraction | **0.3–0.5** | Factual but needs flexibility |
| Personalization lines | **0.5–0.7** | Creative but controlled |
| Full email generation | **0.5–0.7** | Natural tone, stay on-rails |
| Subject lines | **0.6–0.8** | Needs creativity, within bounds |

> **NEVER use temperature 1.0.** It's in almost every default config and it causes chaotic outputs.

---

## 📏 AI Settings — Max Tokens Guide

**Wasting tokens = slow + expensive.** Match the output size:

| Output Type | Max Tokens | Why |
|-------------|------------|-----|
| One-liner (PS, subject, congrats) | **100–150** | Output is 1 sentence |
| Personalization line | **150–200** | Output is 1–2 sentences |
| Short email reply | **300–500** | A few paragraphs |
| Case study extraction | **500–800** | Structured but concise |
| Full email body | **500–800** | Complete email |

> **NEVER use 2048–4090** unless generating full documents. Most outreach outputs are 1–3 lines.

---

## 🎭 Default System Prompt

Every AI node in every workflow **must** have a system prompt. If one is missing, use this:

```
You are Chaman's outreach assistant at Elesium. You write casual, human, 
non-salesy messages for B2B cold outreach. Keep it conversational — like 
a peer talking to another founder. No buzzwords, no corporate language, 
no emojis. Output only the final result with no additional text.
```

For specific tasks, layer on top:
- **JSON extraction:** Add "Output valid JSON only. No markdown, no explanation."
- **Case study analysis:** Add "You are an expert business analyst. Focus on challenges, solutions, and measurable results."
- **Email generation:** Add "Write like you're texting a friend who runs a business. Keep it under 5 lines."

---

## 🐛 Common Bugs & Fixes

Issues found across existing workflows — check before building:

| Issue | Where It Happens | Fix |
|-------|-------------------|-----|
| Temperature = 1.0 | Almost every AI node | Lower based on temperature guide above |
| Max tokens = 2048–4090 | GPT-4o nodes | Lower to 100–800 based on output type |
| No system prompt | Many Claude/GPT steps | Add the default system prompt above |
| Email filter = "exists only" | Anymailfinder / mails.so | Add confidence ≥ 80% filter |
| `skip_if_in_workspace` not set | PlusVibe campaign adds | Set to `true` to avoid duplicates |
| Company name has LLC/Inc | Personalization lines | Always run through name cleaner first |
| Slack message parsing fails | Lead reply handler | Use few-shot prompting with example JSON |

---

## 📂 File Organization Rules

| Type | Location | Rule |
|------|----------|------|
| **Deliverables** | Google Sheets, Slides, cloud | Always cloud — never local |
| **Intermediates** | `.tmp/` | Processing only, never commit |
| **Skills** | `skills/` | Each = SKILL.md + scripts/ folder |
| **Agents** | `agents/` | Subagent definitions (read-only reporters) |
| **Shared scripts** | `execution/` | Modal webhooks, auth, video effects |
| **Knowledge** | `antigravity/` | This folder — the Elesium Mind |
| **Workflows** | `.agent/workflows/` | Quick-reference workflow guides |

---

## 🚀 Build Loop — Design & Ship Workflow

When building or modifying scripts:

```
1. WRITE    → Make your changes
2. REVIEW   → Spawn code-reviewer subagent (read-only)
3. QA       → Spawn qa subagent (generates + runs tests)
4. FIX      → YOU read reports and apply fixes
5. SHIP     → Only after review passes + tests pass
```

> **Subagents are reporters, not fixers.** They tell you what's wrong — you fix it.

---

## 🤖 Subagent Registry

Subagents are lightweight AI agents (Sonnet 4.5) with isolated contexts. They run in the background, report findings, and **never make code changes themselves**.

| Subagent | Purpose | When to Spawn |
|----------|---------|---------------|
| **code-reviewer** | Unbiased code review with zero parent context. Returns issues by severity (critical → low) with a PASS/FAIL verdict. | After writing/editing any script. |
| **research** | Deep research via web search, file reads, and codebase exploration. Returns concise sourced findings. | Before tackling unfamiliar topics or when you need external context. |
| **qa** | Generates tests for a code snippet, runs them, reports pass/fail. | After code-reviewer passes. Run in parallel with reviewer when files are independent. |
| **email-classifier** | Classifies Gmail emails into Action Required, Waiting On, Reference. | When processing inbox via gmail-inbox skill. |

### Subagent Rules
1. **Parallel when independent** — Review + QA on separate files can run simultaneously
2. **Sequential when dependent** — QA should follow successful review on the same file
3. **Never give subagents edit access** — They report, you fix
4. **Use `run_in_background: true`** for parallel execution

---

## 🌐 Modal Webhook Endpoints

Deploy: `modal deploy execution/modal_webhook.py`

| Endpoint | Purpose |
|----------|---------|
| `https://{user}--claude-orchestrator-list-webhooks.modal.run` | List all webhooks |
| `https://{user}--claude-orchestrator-directive.modal.run?slug={slug}` | Execute a webhook |
| `https://{user}--claude-orchestrator-test-email.modal.run` | Test email send |

### Available Webhook Tools
| Tool | What It Does |
|------|-------------|
| `send_email` | Send email via Gmail (requires OAuth token) |
| `read_sheet` | Read data from a Google Sheets range |
| `update_sheet` | Write/update data to a Google Sheets range |

### Webhook Execution
```
GET https://{user}--claude-orchestrator-directive.modal.run?slug={slug}

Slugs are registered in execution/modal_webhook.py.
Each slug maps to a directive (sequence of tool calls).
Response: JSON with status, results, and execution time.
```
