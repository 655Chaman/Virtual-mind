# 🔧 Workflow 02: E2E Campaign (3-Email Drip Sequence)

**Platform:** n8n.io (originally Make.com blueprint — to be recreated in n8n)
**Purpose:** Full end-to-end personalized outreach campaign with 3-email drip sequence
**Data Source:** Apify dataset (scraped leads with LinkedIn URLs, emails, org data)

> ⚠️ **n8n adaptation:** Swap Claude → ChatGPT, Instantly → PlusVibe. Gemini can stay or swap to ChatGPT.

---

## Flow Diagram

```
Scrape Apify Dataset
    └── Validate Email (emailvalidation)
            └── [FILTER: deliverable only]
                    └── Normalize Company Name (Gemini 1.5 Pro)
                            └── Parse JSON
                                    └── Scrape LinkedIn Profile (Exa AI)
                                            ├── Claude #1: Thoughtful Congrats Line ──┐
                                            ├── Claude #2: Non-Surface Observation ───┤
                                            │                                         ├── SET: Initial Email
                                            ├── Claude #3: Pain Point Follow-Up ──────┤── SET: Follow-Up Email
                                            ├── Claude #4: P.S. Line ─────────────────┤── SET: Breakup Email
                                            └── Claude #5: Subject Line ──────────────┤
                                                                                      └── PlusVibe (Add Lead + 3-Step Sequence)
```

---

## Step-by-Step Breakdown

| Step | Tool | Purpose |
|------|------|---------|
| 1 | **Apify** | Fetch scraped dataset (leads with `email`, `linkedin_url`, `first_name`, `organization.name`, `headline`) |
| 2 | **Email Validation** | Verify `{{1.email}}` — only proceed if `state = deliverable` |
| 3 | **Gemini 1.5 Pro** | Normalize company name to casual abbreviation (e.g., "Baker Concrete Construction" → "BCR"). Output as JSON `{"result":""}` |
| 4 | **Parse JSON** | Extract the `result` field from Gemini's response |
| 5 | **Exa AI** | Search + scrape LinkedIn profile using `{{1.linkedin_url}}` — returns full text content |
| 6 | **ChatGPT** | Generate **Thoughtful Congrats Line** (Prompt #28) |
| 7 | **ChatGPT** | Generate **Non-Surface Observation** (Prompt #29) |
| 8 | **Set Variable** | Compose **Email #1: Initial Email** |
| 9 | **ChatGPT** | Generate **Thoughtful Pain Point Message** (Prompt #30) |
| 10 | **Set Variable** | Compose **Email #2: Follow-Up Email** |
| 11 | **ChatGPT** | Generate **P.S. Line** (Prompt #31) |
| 12 | **Set Variable** | Compose **Email #3: Breakup Email** |
| 13 | **ChatGPT** | Generate **Subject Line** (Prompt #11) |
| 14 | **PlusVibe** | Add lead to campaign with all 3 emails as sequence steps |

---

## Email #1: Initial Email

```
Hey {{first_name}}—

{{AI: Thoughtful Congrats Line}}
{{AI: Non-Surface Observation}}

I'm Saad, and I'm reaching out because I built a sales system that
have generated $85K for Vention and consistently connects companies
like {{company_name}} with their ideal clients at scale—purely off
performance.

I'd love to show you how I could customize this approach for your
specific market.

Is this aligned with what you're trying to achieve right now?

Thanks for the time,
Saad
```

---

## Email #2: Follow-Up

```
Hey {{first_name}}—Checking in, in case you haven't seen this

TLDR; I'm Saad, and I'm reaching out because I can connect
{{company_name}} with ideal clients at scale—purely off performance
through outbound sales systems.

{{AI: Thoughtful Pain Point Message}}
I'd love to help you expand and reach even more people.

What's holding you back from hopping on a 15-minute call?

Thanks for the time,
Saad
```

---

## Email #3: Breakup

```
Hey {{first_name}}—
I wanted to send one final note to check in. I completely understand
if now isn't the right time.

{{AI: P.S. Line}}

Thanks for the time,
Saad
```

---

## Workflow-Specific Prompts

### Gemini — Company Name Normalizer
> Normalize the company name by focusing on its most distinctive and memorable element, as it may be reflected in the company's domain and the person's bio. The goal is to identify the standout part of the name, typically the first noun, while discarding generic terms. Output a concise, casual abbreviation employees might use, respecting original capitalization and spacing. Provide only the final normalized result in JSON as `{"result":""}`.

### AI Steps → Prompt Template Mapping
| Step | Role | Prompt # |
|------|------|----------|
| Claude #1 | Thoughtful Congrats Line | #28 |
| Claude #2 | Non-Surface Observation | #29 |
| Claude #3 | Pain Point Follow-Up | #30 |
| Claude #4 | P.S. Line | #31 |
| Claude #5 | Subject Line | #11 |

---

## Settings Audit

| Parameter | Current | Recommended |
|-----------|---------|-------------|
| Model | claude-3-7-sonnet-20250219 | ✅ Good (swap to GPT-4o) |
| Temperature | 1.0 | ⚠️ Too high — use 0.5–0.7 |
| Max Tokens | 3060 | ⚠️ Wasteful — use 150–300 |
| System Prompt | None | ❌ Should add persona + constraints |

---

## Key APIs & Services

| Service | Purpose |
|---------|---------|
| **Apify** | Web scraping / dataset sourcing |
| **Email Validation API** | Verify email deliverability |
| **Gemini 1.5 Pro** | Company name normalization |
| **Exa AI** | LinkedIn profile content scraping |
| **ChatGPT** | AI-generated personalization (x5 calls per lead) |
| **PlusVibe** | Email campaign delivery (3-step sequence) |
