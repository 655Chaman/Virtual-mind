# 📖 PLAYBOOKS — End-to-End Workflow Guides

> **This file contains every workflow you run.** Each playbook is a complete, step-by-step recipe. Follow them in order. Every AI prompt used in these workflows references templates from `arsenal.md`.

---

## 📋 Quick Reference — All 8 Playbooks

| # | Playbook | Purpose | Key Tool |
|---|----------|---------|----------|
| 1 | Job Posting Outreach | Scrape job posts → enrich → personalize → email | n8n + Apify |
| 2 | E2E Campaign | End-to-end cold outreach from scraping to campaign launch | n8n + PlusVibe |
| 3 | Lead Reply Handler | Classify replies → extract case studies → generate responses | n8n + Slack |
| 4 | High Ticket Sales System | Tally intake → scrape → enrich → personalized outreach | n8n + Google Sheets |
| 5 | Google Maps Lead Pipeline | Scrape GMaps → deep website enrichment → contact extraction | Apify + Claude |
| 6 | Upwork Job Pipeline | Scrape Upwork → generate proposals + cover letters → Google Docs | Apify + Claude |
| 7 | Client Onboarding | Post-kickoff: generate leads → create campaigns → setup auto-reply | E2E orchestration |
| 8 | Campaign Creator (PlusVibe) | Client brief → AI generates 3 campaigns × 3-step sequences | GPT-4o + PlusVibe API |

---

## 📖 Playbook 1: Job Posting Outreach

### Purpose
Scrape companies with open job postings → use the posting as a pain signal → send personalized outreach.

### Flow Diagram
```
Tally Form (niche + role)
    ↓
Schedule Trigger (weekly)
    ↓
Apify — Scrape Job Boards
    ↓
Google Sheets — Log Raw Leads
    ↓
GPT-4o — Clean Company Names (temp: 0.2)
    ↓
RapidAPI — Find Decision Maker LinkedIn
    ↓
GPT-4o — Extract Pain from Job Post (temp: 0.3)
    ↓
GPT-4o — Write Personalized Email (temp: 0.6)
    ↓
Google Sheets — Update with Email + Status
    ↓
PlusVibe — Add to Campaign
```

### Google Sheet Schema: Job Post Leads

| Column | Content | Source |
|--------|---------|--------|
| A: Company | Raw company name | Apify |
| B: Clean Name | Cleaned company name | GPT-4o |
| C: Role | Job posting title | Apify |
| D: Platform | Where posted (LinkedIn, Indeed) | Apify |
| E: Decision Maker | Name from LinkedIn | RapidAPI |
| F: Title | Their job title | RapidAPI |
| G: Email | Verified email | mails.so |
| H: Pain Analysis | Extracted pain from job post | GPT-4o |
| I: Personalized Email | Full email body | GPT-4o |
| J: Status | pending / sent / replied | PlusVibe webhook |

### AI Steps Detail

**Step 1: Clean Company Name**
- Model: GPT-4o-mini | Temp: 0.2 | Tokens: 100
- System prompt: `forge.md` default + "Remove LLC, Inc, Ltd. Return the common brand name only."
- Arsenal template: N/A (utility task)

**Step 2: Extract Pain**
- Model: GPT-4o | Temp: 0.3 | Tokens: 300
- Arsenal template: **#16 — Job Post Analysis**

**Step 3: Write Email**
- Model: GPT-4o | Temp: 0.6 | Tokens: 500
- Arsenal template: **#17 — Job Post Email Generator**

### Email Templates

**Initial Email:**
```
Subject: {{clean_name}} is scaling fast

Hey {{first_name}},

saw {{clean_name}} is growing the {{role}} team — that's exciting.

Companies at this stage usually see a gap between hiring speed 
and pipeline speed. We've been connecting companies like yours 
with their dream clients to bridge that gap.

Worth a quick chat?

Chaman
```

**Follow-up (Day 3):** Arsenal template **#18**
**Breakup (Day 7):** Arsenal template **#9**

---

## 📖 Playbook 2: E2E Campaign (End-to-End Cold Outreach)

### Purpose
Full cold outreach pipeline: scrape → enrich → verify → personalize → launch campaign.

### Flow Diagram
```
┌──────────────────────────────────────────────────┐
│           E2E COLD OUTREACH PIPELINE             │
│                                                  │
│  PHASE 1: SCRAPE                                 │
│  ├── Exa AI / Apify → companies matching ICP     │
│  ├── Google Sheets → log raw list                │
│  └── Dedup check against existing campaigns      │
│                                                  │
│  PHASE 2: ENRICH                                 │
│  ├── RapidAPI → find DM LinkedIn profiles        │
│  ├── GPT-4o → clean names, extract titles        │
│  ├── Website scrape → company description         │
│  └── GPT-4o → competitor + achievement research  │
│                                                  │
│  PHASE 3: VERIFY                                 │
│  ├── mails.so → verify emails (confidence ≥80%)  │
│  ├── Filter out unverified                       │
│  └── Update sheet with verification status       │
│                                                  │
│  PHASE 4: PERSONALIZE                            │
│  ├── GPT-4o → icebreaker lines (temp: 0.6)       │
│  ├── GPT-4o → PS lines (temp: 0.5)               │
│  ├── GPT-4o → subject line variants (temp: 0.7)  │
│  └── GPT-4o → full email body (temp: 0.6)        │
│                                                  │
│  PHASE 5: LAUNCH                                 │
│  ├── PlusVibe → create campaign                  │
│  ├── PlusVibe → add leads (skip_if_in_workspace) │
│  ├── PlusVibe → set sequence (3 steps)           │
│  └── PlusVibe → activate                         │
│                                                  │
│  PHASE 6: MONITOR                                │
│  ├── PlusVibe webhooks → reply notifications     │
│  ├── Slack → daily stats summary                 │
│  └── Loop to Playbook 3 for replies              │
└──────────────────────────────────────────────────┘
```

### Google Sheet Schema: E2E Campaign

| Column | Content | Source |
|--------|---------|--------|
| A: Company | Raw name | Scraper |
| B: Clean Name | Brand name | GPT-4o |
| C: Website | Company URL | Scraper |
| D: Description | 1-line what they do | GPT-4o |
| E: Decision Maker | Full name | RapidAPI |
| F: Title | Job title | RapidAPI |
| G: LinkedIn | Profile URL | RapidAPI |
| H: Email | Verified email | mails.so |
| I: Email Confidence | Verification score | mails.so |
| J: Achievement | Recent win/funding | GPT-4o |
| K: Competitor | Main competitor | GPT-4o |
| L: Icebreaker | Personalized line | GPT-4o |
| M: PS Line | Post-script | GPT-4o |
| N: Subject | Email subject | GPT-4o |
| O: Email Body | Full email | GPT-4o |
| P: Status | pending / sent / replied / booked | PlusVibe |
| Q: Campaign ID | PlusVibe campaign ref | PlusVibe |

### AI Steps Detail

| Step | Model | Temp | Tokens | Arsenal Template |
|------|-------|------|--------|-----------------|
| Clean company name | GPT-4o-mini | 0.2 | 100 | N/A (utility) |
| Extract description | GPT-4o | 0.3 | 200 | N/A (extraction) |
| Find achievement | GPT-4o | 0.5 | 300 | #21 |
| Find competitor | GPT-4o | 0.5 | 300 | #19 |
| Generate icebreaker | GPT-4o | 0.6 | 150 | #13 |
| Generate PS line | GPT-4o | 0.5 | 100 | #11 |
| Generate subject | GPT-4o | 0.7 | 100 | #12 |
| Write email body | GPT-4o | 0.6 | 500 | #1 (Personalized Opener) |

### 3-Step Email Sequence

| Step | When | Arsenal Template |
|------|------|-----------------|
| Email 1 | Day 0 | #1 (Personalized Opener) |
| Email 2 | Day 3 | #6 (Short Follow-Up #1) |
| Email 3 | Day 7 | #9 (Breakup Email) |

---

## 📖 Playbook 3: Lead Reply Handler

### Purpose
When a prospect replies to a campaign email → classify it → generate a contextual response → notify on Slack.

### Flow Diagram
```
PlusVibe Webhook → New Reply
    ↓
n8n Webhook Trigger
    ↓
GPT-4o — Classify Reply Intent (temp: 0.0)
    ↓
Router Node (based on classification)
    ├── INTERESTED → Arsenal #26 → book call flow
    ├── OBJECTION → Arsenal #27 → handle objection  
    ├── INFO_REQUEST → Arsenal #28 → provide info
    ├── WRONG_PERSON → Arsenal #29 → ask for referral
    ├── NOT_NOW → Arsenal #10 → soft re-engage (delayed)
    └── UNSUBSCRIBE → update sheet → stop sequence
    ↓
GPT-4o — Generate Reply (temp: 0.6)
    ↓
Google Sheets — Update Status + Log Reply
    ↓
Slack — Send Rich Notification
    ↓
(If INTERESTED) ClickUp — Create CRM Task
```

### Classification Prompt

```
Prompt: "Classify this email reply into ONE of these categories:

INTERESTED — wants to learn more, asks for a call, shows positive intent
OBJECTION — pushes back on timing, price, need, or relevance
INFO_REQUEST — asks for more details, case studies, or how it works
WRONG_PERSON — says they're not the right contact
NOT_NOW — interested but bad timing
UNSUBSCRIBE — asks to be removed

Reply: {{reply_text}}

Output ONLY the category name. Nothing else."

Model: GPT-4o | Temp: 0.0 | Tokens: 50
```

### Part 2: Case Study Extraction (For INFO_REQUEST Replies)

When someone asks "how does it work?" or "show me proof":

```
GPT-4o — Find most relevant case study from knowledge base
    ↓
GPT-4o — Extract key metrics (Arsenal #23)
    ↓
GPT-4o — Write case-study email (Arsenal #24)
    ↓
Send via PlusVibe API
```

### Slack Notification Format

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "🔔 New Reply: {{company}}"}
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*From:* {{name}} ({{email}})"},
        {"type": "mrkdwn", "text": "*Category:* {{classification}}"},
        {"type": "mrkdwn", "text": "*Reply:* {{reply_text}}"},
        {"type": "mrkdwn", "text": "*Suggested Response:* {{draft_reply}}"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {"type": "button", "text": {"type": "plain_text", "text": "✅ Send Draft"}, "action_id": "send_reply"},
        {"type": "button", "text": {"type": "plain_text", "text": "✏️ Edit & Send"}, "action_id": "edit_reply"},
        {"type": "button", "text": {"type": "plain_text", "text": "❌ Ignore"}, "action_id": "ignore_reply"}
      ]
    }
  ]
}
```

---

## 📖 Playbook 4: High Ticket Sales System

### Purpose
Full inbound → outbound pipeline for high-value deals. Starts with a client intake form, scrapes target companies, enriches deeply, sends highly personalized outreach.

### Flow Diagram
```
┌─────────────────────────────────────────────────────┐
│          HIGH TICKET SALES PIPELINE                  │
│                                                      │
│  INTAKE                                              │
│  ├── Tally Form → client fills target criteria       │
│  ├── n8n processes form submission                   │
│  └── Google Sheet → create new campaign sheet        │
│                                                      │
│  SCRAPE                                              │
│  ├── Apify → scrape matching companies               │
│  ├── 100–500 companies per batch                     │
│  └── Raw data → Google Sheet                         │
│                                                      │
│  ENRICH (Deep)                                       │
│  ├── GPT-4o-mini → clean company names (temp: 0.2)   │
│  ├── RapidAPI → LinkedIn profiles for DMs            │
│  ├── Website scrape → full company context            │
│  ├── GPT-4o → ICP analysis (temp: 0.5)               │
│  ├── GPT-4o → pain hypothesis (temp: 0.5)            │
│  └── mails.so → verify emails (≥80% confidence)      │
│                                                      │
│  EMAIL FINDING ⚠️                                    │
│  ├── NO automated email finder (budget constraint)   │
│  ├── Options:                                        │
│  │   ├── Manual: find emails via LinkedIn/website     │
│  │   ├── Exa AI: search for contact pages             │
│  │   └── Future: integrate email finder when budget   │
│  └── Verify with mails.so before adding to campaign  │
│                                                      │
│  PERSONALIZE                                         │
│  ├── GPT-4o → icebreaker from website data (A#13)    │
│  ├── GPT-4o → achievement congratulations (A#4)      │
│  ├── GPT-4o → PS lines (A#11)                        │
│  ├── GPT-4o → full personalized email (A#1)          │
│  └── All outputs → Google Sheet                      │
│                                                      │
│  LAUNCH                                              │
│  ├── PlusVibe → create campaign                      │
│  ├── PlusVibe → add leads (skip_if_in_workspace)     │
│  ├── 5-step sequence (longer for high ticket)        │
│  └── Monitor → route replies to Playbook 3           │
└─────────────────────────────────────────────────────┘
```

### Google Sheet Schema: High Ticket

| Column | Content | Source |
|--------|---------|--------|
| A | Company (raw) | Apify |
| B | Company (clean) | GPT-4o-mini |
| C | Website | Apify |
| D | Industry | Apify/GPT |
| E | Employee Count | Apify |
| F | Description | Website scrape + GPT |
| G | DM Name | RapidAPI LinkedIn |
| H | DM Title | RapidAPI LinkedIn |
| I | DM LinkedIn | RapidAPI LinkedIn |
| J | Email | Manual / Exa |
| K | Email Confidence | mails.so |
| L | ICP Score | GPT-4o (1-10 fit) |
| M | Pain Hypothesis | GPT-4o |
| N | Achievement | GPT-4o |
| O | Icebreaker | GPT-4o |
| P | PS Line | GPT-4o |
| Q | Subject | GPT-4o |
| R | Email Body | GPT-4o |
| S | Status | pending/sent/replied/booked |
| T | Campaign ID | PlusVibe |

### 5-Step High Ticket Sequence

| Step | Day | Arsenal Template | Notes |
|------|-----|-----------------|-------|
| 1 | Day 0 | #1 (Personalized Opener) | Heavy personalization |
| 2 | Day 3 | #6 (Short Follow-Up #1) | New angle |
| 3 | Day 6 | #8 (Case Study Follow-Up) | Social proof |
| 4 | Day 10 | #7 (Short Follow-Up #2) | Direct question |
| 5 | Day 14 | #9 (Breakup Email) | Close the loop |

### ⚠️ Known Limitation: Email Finding

Currently no automated email finder in the stack (budget constraint). Workarounds:

1. **Manual sourcing** — Find emails on company websites / LinkedIn profiles
2. **Exa AI search** — Search for "{{company}} contact" or "{{name}} email" pages
3. **Pattern matching** — If you know the email format (first@company.com), generate and verify with mails.so
4. **Future:** When budget allows, integrate an email finder API and update this playbook

---

## 📖 Playbook 5: Google Maps Lead Pipeline

### Purpose
Scrape businesses from Google Maps → enrich with deep website contact extraction → save to Google Sheet.

### Flow Diagram
```
Search Query + Location
    ↓
Apify (compass/crawler-google-places)
    ↓
For Each Business With Website:
    ├── HTTP fetch main page (httpx)
    ├── Find + fetch up to 5 contact pages (/contact, /about, /team, etc.)
    ├── DuckDuckGo search: "{business name}" owner email contact
    └── Combine all content
    ↓
Claude Haiku — Extract structured contacts (temp: 0.0)
    ↓
Google Sheets — Append with dedup (MD5 of name|address)
```

### Contact Page Priority Order
```
/contact, /about, /team, /contact-us, /about-us, /our-team, /staff, 
/people, /meet-the-team, /leadership, /management, /founders, 
/who-we-are, /company, /meet-us, /our-story, /the-team, /employees, 
/directory, /locations, /offices
```

### Claude Extraction Schema
```json
{
  "emails": [], "phone_numbers": [], "addresses": [],
  "social_media": {"facebook": null, "twitter": null, "linkedin": null, "instagram": null},
  "owner_info": {"name": "", "title": "", "email": "", "linkedin": ""},
  "team_members": [{"name": "", "title": "", "email": ""}],
  "business_hours": ""
}
```

### Google Sheet: 36 Columns
`lead_id, scraped_at, search_query, business_name, category, address, city, state, zip_code, country, phone, website, google_maps_url, place_id, rating, review_count, price_level, emails, additional_phones, business_hours, facebook, twitter, linkedin, instagram, youtube, tiktok, owner_name, owner_title, owner_email, owner_phone, owner_linkedin, team_contacts, additional_contact_methods, pages_scraped, search_enriched, enrichment_status`

### Technical Notes
- ~10–15% of sites return 403/503 → save lead with GMaps data only
- Facebook URLs always return 400 → skip in web search
- Use `ThreadPoolExecutor` (3 workers) for parallel enrichment
- Truncate to 50K chars before Claude
- DuckDuckGo HTML search (html.duckduckgo.com/html/) is free
- Cost: ~$0.015–0.025 per lead

### CLI
```bash
python3 execution/gmaps_lead_pipeline.py --search "plumbers in Austin TX" --limit 10
python3 execution/gmaps_lead_pipeline.py --search "roofers in Austin TX" --limit 50 --sheet-url "..."
```

---

## 📖 Playbook 6: Upwork Job Pipeline

### Purpose
Scrape Upwork job listings → generate personalized proposals + cover letters → create Google Docs → output to Google Sheet.

### Flow Diagram
```
Apify (upwork-vibe~upwork-job-scraper)
    ↓
Post-Scrape Filters (budget, experience, verified payment, client spend)
    ↓
Claude Opus 4.5 (extended thinking: 8000 tokens) → Generate Proposals
    ↓
Google Docs — Create proposal document per job (serialized with semaphore)
    ↓
Google Sheet — Title, URL, Budget, Cover Letter, Proposal Doc Link, Apply Link
```

### Cover Letter Format (~35 words, above-the-fold)
```
Hi. I work with [2-4 word paraphrase] daily & just built a [2-5 word thing]. 
Free walkthrough: [DOC_LINK]
```

### Proposal Format (~300 words, first-person)
```
Hey [name if available].

I spent ~15 minutes putting this together for you...

My proposed approach
[4-6 numbered steps with WHY for each, mention tools: n8n, Claude API, etc.]

What you'll get
[2-3 concrete deliverables]

Timeline
[Realistic estimate, conversational]
```

### Technical Notes
- Free Apify tier: only `limit`, `fromDate`, `toDate` filters
- All other filtering is post-scrape
- Google Docs: serialize with `threading.Semaphore(1)` — parallel creates cause SSL errors
- Retry: exponential backoff (1.5s, 3s, 6s, 12s)
- Fallback: embed proposal in sheet if Doc creation fails
- 10 jobs with 5 workers: ~2 min (vs ~20 min sequential)

### CLI
```bash
python3 execution/upwork_apify_scraper.py --limit 50 --days 1 --verified-payment --min-spent 1000 -o .tmp/upwork_jobs.json
python3 execution/upwork_proposal_generator.py --input .tmp/upwork_jobs.json --workers 5 -o .tmp/upwork_proposals.json
```

---

## 📖 Playbook 7: Client Onboarding (Post-Kickoff)

### Purpose
Automated onboarding after kickoff call: generate leads → create campaigns → setup auto-reply.

### Flow Diagram
```
Kickoff Call → Collect Client Info
    ↓
Inputs: client_name, client_email, service_type, target_location, 
        offers (3), target_audience, social_proof
    ↓
STEP 1: Lead Generation
    ├── Apify → scrape matching companies
    ├── Enrich with contacts
    └── Save to new Google Sheet
    ↓
STEP 2: Campaign Creation
    ├── AI generates 3 campaigns (one per offer)
    ├── Each: 3-step sequence with A/B variants
    └── Create in PlusVibe
    ↓
STEP 3: Auto-Reply Setup
    ├── Configure PlusVibe webhook → n8n
    ├── Create knowledge base entry for this client
    └── Route to Playbook 3 (Lead Reply Handler)
    ↓
STEP 4: Welcome Emails
    ├── Nick → welcome + expectations
    ├── Peter → technical setup
    └── Sam → support intro
```

### Inputs Required (from kickoff call)
| Field | Example |
|-------|---------|
| client_name | "Acme Plumbing" |
| client_email | "john@acme.com" |
| service_type | "Residential plumbing" |
| target_location | "Austin, Texas" |
| offers | "Free inspection \| 10% off first job \| Priority scheduling" |
| target_audience | "Homeowners with properties 10+ years old" |
| social_proof | "500+ 5-star reviews, 15 years in business" |

---

## 📖 Playbook 8: Campaign Creator (PlusVibe)

### Purpose
Take a client brief → AI generates 3 campaigns × 3-step email sequences → create in PlusVibe via API.

### Flow Diagram
```
Client Description + Offers (3)
    ↓
GPT-4o — Generate 3 campaigns (one per offer)
    ↓
Each Campaign:
    ├── Step 1: 2 A/B variants (meaningfully different approaches)
    ├── Step 2: Follow-up (1 variant)
    └── Step 3: Breakup (1 variant)
    ↓
Convert plain text → HTML (<p> tags required)
    ↓
PlusVibe API v2 — Create campaigns
```

### Email Structure
Each email must have:
1. **Personalization hook** — use `{{icebreaker}}` or custom opener
2. **Social proof** — credentials, results, experience
3. **Offer** — clear value prop, low barrier
4. **Soft CTA**

### Available Variables
`{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{companyName}}`, `{{casualCompanyName}}`, `{{icebreaker}}`, `{{sendingAccountFirstName}}`

### ⚠️ API Gotchas (Learned the Hard Way)
| Issue | Fix |
|-------|-----|
| PlusVibe strips plain text outside HTML tags | Wrap ALL paragraphs in `<p>` tags |
| Schedule requires `name` field | Add `"name": "Weekday Schedule"` |
| Timezone enum is restrictive | Use `America/Chicago` (not `America/New_York`) |
| Sequences array | Only first element used — put all steps in one sequence |
| Step type | Must be `"email"` always |

### Campaign Settings
```json
{
  "email_gap": 10,
  "daily_limit": 50,
  "stop_on_reply": true,
  "stop_on_auto_reply": true,
  "link_tracking": true,
  "open_tracking": true
}
```

---

## ⚡ Cross-Playbook Rules

1. **Always run company names through the cleaning step** before personalization
2. **Always verify emails** with mails.so (≥80% confidence) before adding to any campaign
3. **Always set `skip_if_in_workspace: true`** in PlusVibe to avoid duplicate sends
4. **Always include a system prompt** in every AI node (see `forge.md`)
5. **Never use temperature 1.0** — follow the temperature guide in `forge.md`
6. **Route all replies** through Playbook 3 — don't handle replies ad-hoc
7. **Log everything** in Google Sheets — it's the single source of truth
8. **Abbreviate company names** in emails like employees do internally
9. **Dedup all scrapes** — use MD5 hash or check existing sheet before adding
10. **HTML-format all email bodies** for PlusVibe — plain text gets stripped
