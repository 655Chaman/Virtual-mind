# 🧠 Elesium-hq — Unified Outreach & Automation System

> **Saad's all-in-one system**: outreach knowledge, AI skills, Make.com/n8n automations, Google Sheets MCP, and Modal cloud deployment — all in one place.

---

## 📂 System Map

| Directory | What's Inside | Quick Link |
|-----------|---------------|------------|
| **antigravity/** | Outreach knowledge base — 31 prompt templates, pain sniffing method, LinkedIn queries, AI settings, 4 workflow playbooks | [→ README](./antigravity/README.md) |
| **skills/** | 26 AI skills — lead gen, email campaigns, proposals, video editing, YouTube, research, and more | [→ Browse](./skills/) |
| **agents/** | 4 subagents — code reviewer, QA, research, email classifier | [→ Browse](./agents/) |
| **execution/** | Shared scripts — Modal webhooks, local server, video effects, cron config | [→ Browse](./execution/) |
| **modal/** | Modal app template for n8n API endpoints (Claude-powered) | [→ modal_app.py](./modal/modal_app.py) |
| **google-sheets-mcp/** | Google Sheets MCP server + 4 Make.com blueprints + n8n ice-breaker workflow | [→ README](./google-sheets-mcp/README.md) |

---

## 🚀 Available Skills (26)

### Lead Generation & Enrichment
| Skill | Purpose |
|-------|---------|
| `scrape-leads` | Scrape leads via Apify with verification |
| `gmaps-leads` | Google Maps lead scraping with deep enrichment |
| `classify-leads` | LLM-based lead classification |
| `casualize-names` | Convert formal names to casual versions |

### Email & Campaigns
| Skill | Purpose |
|-------|---------|
| `instantly-campaigns` | Create cold email campaigns in Instantly/PlusVibe |
| `instantly-autoreply` | Auto-reply to incoming emails |
| `welcome-email` | Send welcome sequence to new clients |
| `gmail-inbox` | Manage emails across Gmail accounts |
| `gmail-label` | Label and organize Gmail |

### Sales & Proposals
| Skill | Purpose |
|-------|---------|
| `create-proposal` | Generate PandaDoc proposals |
| `deep-research-pitch` | Research leads and generate pitch decks |
| `upwork-apply` | Scrape Upwork and generate proposals |

### Content & Video
| Skill | Purpose |
|-------|---------|
| `video-edit` | Remove silences, add 3D transitions |
| `pan-3d-transition` | Create 3D swivel effects |
| `recreate-thumbnails` | Face-swap YouTube thumbnails |
| `cross-niche-outliers` | Find viral videos from adjacent niches |
| `youtube-outliers` | Monitor your niche for outliers |
| `title-variants` | Generate YouTube title variations |

### Community & Research
| Skill | Purpose |
|-------|---------|
| `skool-monitor` | Monitor and interact with Skool communities |
| `skool-rag` | Query Skool content via RAG pipeline |
| `literature-research` | Search academic databases |

### Infrastructure & Deployment
| Skill | Purpose |
|-------|---------|
| `add-webhook` | Add new Modal webhooks |
| `modal-deploy` | Deploy to Modal cloud |
| `local-server` | Run orchestrator locally |
| `onboarding-kickoff` | Full post-kickoff automation |
| `design-website` | Design websites |
| `generate-report` | Generate reports |

---

## 🤖 Subagents (4)

| Agent | Purpose |
|-------|---------|
| `code-reviewer` | Unbiased code review, returns issues by severity |
| `qa` | Generates tests, runs them, reports pass/fail |
| `research` | Deep research via web search and exploration |
| `email-classifier` | Classifies Gmail into Action Required / Waiting On / Reference |

---

## 📧 Make.com Blueprints (4)

Located in `google-sheets-mcp/make-blueprints/`:

1. **Lead Enrichment** — New row → AI ICP analysis → Sheet update
2. **Cold Outreach** — New lead → AI email + subject → Gmail sends → Status update
3. **Daily Report** — 9 AM → All leads → AI analytics → Slack + Email
4. **Follow-Up Sequence** — 10 AM → Leads 3+ days old → AI follow-up → Gmail sends

---

## 🔧 n8n Workflows

Located in `google-sheets-mcp/n8n-workflows/`:

1. **Ice-Breaker Workflow** — Fetch leads → scrape website → AI icebreaker → update sheet

---

## 📋 Outreach Playbooks (4)

Located in `antigravity/workflows/`:

1. **Job Posting Outreach** — Pain sniffing via job posts → personalized email
2. **E2E Campaign** — 3-email drip: scrape → enrich → AI personalize → PlusVibe
3. **Lead Reply Handler** — Auto-reply to interested leads + Slack + CRM
4. **High Ticket Sales** — Form → LinkedIn scrape → enrich → campaign

---

## ⚙️ Setup

1. Copy `.env.example` to `.env` and fill in your API keys
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   npm install
   ```
3. For Google Sheets MCP: follow [google-sheets-mcp/README.md](./google-sheets-mcp/README.md)
4. For Modal deployment: see `.agent/workflows/deploy-modal.md`

---

## 🧰 Tool Preferences

| Category | Tool |
|----------|------|
| Automation | n8n.io |
| AI Model | ChatGPT (GPT-4o / GPT-4o-mini) |
| Email Outreach | PlusVibe |
| Email Verification | mails.so |
| CRM / Data | Google Sheets |
| Cloud Deploy | Modal |
