# 🔧 Workflow 04: High Ticket Sales System (Form Intake → Scrape → Enrich → Outreach)

> **2-scenario system:** Part 1 captures a Tally form submission → launches Apify scraper.
> Part 2 triggers when scraper finishes → finds CEO emails → AI personalizes → Google Sheets → campaign.

**Platform:** n8n.io (originally Make.com blueprint — to be recreated in n8n)
**Purpose:** Self-serve lead generation: client fills form → system scrapes LinkedIn companies → finds decision-maker emails → AI personalizes → auto-adds to campaign
**Trigger:** Tally form submission (webhook)

> ⚠️ **n8n adaptation:** Anymailfinder has NO equivalent — source emails manually + verify with mails.so. Swap Instantly → PlusVibe.

---

## Part 1: "Get Form Responses ~ Launch System"

### Flow
```
Tally Webhook (Form Submission)
    └── Apify: Run LinkedIn Company Search Scraper (async)
```

### Steps

| Step | Node | Tool | Purpose |
|------|------|------|---------|
| 1 | Watch High Ticket SS | **Tally** | Webhook triggers on new form response — captures `industry`, `headcount`, `location`, `maxItems` |
| 2 | Run Scraper | **Apify** | Launches "LinkedIn Company Search ✅ No Cookies" actor (async, does NOT wait for results) |

### Tally Form Fields

| Field | Variable |
|-------|----------|
| What industry you want to go for? | `{{fields.What industry you want to go for?}}` |
| What's the companies' headcount? | `{{fieldsById.question_K1N2jM}}` |
| What's the location? | `{{fieldsById.question_Lpqx2G}}` |
| Max items to scrape | `{{fieldsById.question_1VgQJM}}` |

### Apify Actor Input
```json
{
    "companySize": ["{{headcount}}"],
    "locations": ["{{location}}"],
    "maxItems": {{maxItems}},
    "scraperMode": "full",
    "searchQuery": "{{industry}}"
}
```

---

## Part 2: "Get Data, Enrich & Finish Flow"

### Flow
```
Apify Webhook (Scraper Finished)
    └── Fetch Scraped Dataset (JSON)
            └── Anymailfinder: Find CEO/Owner Email (by domain)
                    └── [FILTER: email exists?]
                            └── GPT-4o: Clean Company Name
                                    └── GPT-4o: Generate 1:1 Personalization Line
                                            └── Google Sheets: Add Prospect Row
                                                    └── PlusVibe: Add Lead to Campaign
```

### Steps

| Step | Node | Tool | Purpose |
|------|------|------|---------|
| 1 | Watch Scraper | **Apify** | Webhook triggers when LinkedIn Company Search actor run finishes |
| 2 | Get Scraped Data | **Apify** | Fetch dataset items (clean JSON) using `{{defaultDatasetId}}` |
| 3 | Find Top Men | **Anymailfinder** | Search by `{{website}}` domain for CEO/Owner/Founder email (verified only) |
| — | FILTER | **Filter** | Only continue if `{{email}}` exists (not empty) |
| 4 | Clean Companies | **GPT-4o** | Strip LLC/LTD/Inc from company name → casual abbreviation |
| 5 | 1:1 Copy | **GPT-4o** | Generate conversational, personalized icebreaker line |
| 6 | Add Prospects | **Google Sheets** | Add row with all enriched data (12 columns) |
| 7 | Add to Campaign | **PlusVibe** | Create lead with email, name, company, personalization, phone, website |

---

## AI Prompt — GPT-4o: Clean Company Name

```
You must return the cleaned company name from {{company_name}}, 
strip away LLC, LTD, or any long naming conventions the company uses, 
output the finalized clean company name, an employee might use within the company.

myoProcess, Inc → myoProcess
Esanda Recruitment → Esanda

Output the finalized result with no additional text.
```

---

## AI Prompt — GPT-4o: 1:1 Personalization Line

```
Return ONLY this format:
Saw [company_name]'s been in [industry/niche] since [year] — clearly [conversational_inference].

How to fill each part:

[industry/niche]
Use the simplest, real-world description of what they actually do.
Not "solutions," not "services," not "innovative tech platform."
Think: "technical recruitment," "manufacturing staffing," "eGaming hiring," "healthcare software," etc.

[year]
Just the founding year.

[conversational_inference]
Must sound like something you'd say talking to a friend, NOT something you'd write on LinkedIn.
Keep it short, human, obvious.

Examples of perfect tone:
"know how to find the right engineers."
"must be doing something right with tough roles."
"clearly good at landing repeat clients."
"seems like people trust you with the hard stuff."
"must be solid at the roles most firms skip."
"clearly figured out how to keep clients around."

Hard rules:
One sentence. No buzzwords. No corporate adjectives. No fancy language.
Keep it sounding like spoken English.

Data to use:
company name: {{4.result}}
founded year: {{2.foundedOn.year}}
employee count: {{2.employeeCount}}
description: {{2.description}}

Perfect examples your output should mimic:
"Saw Langham's been in technical recruitment since 2018 — clearly know how to find the right engineers."
"Saw Esanda's been in eGaming since 2006 — clearly good at keeping clients around."
```

> **Variable note:** `{{4.result}}` = output of "Clean Companies" step (GPT-4o company name cleaner). `{{2.*}}` = fields from the Apify scraped dataset.

---

## Google Sheets Column Mapping

| Column | Data |
|--------|------|
| A — Full Name | `{{personFullName}}` (from Anymailfinder) |
| B — Email | `{{email}}` (from Anymailfinder) |
| C — Company | `{{cleaned_company_name}}` (from GPT-4o) |
| D — Person LinkedIn | `{{personLinkedinUrl}}` (from Anymailfinder) |
| E — Company LinkedIn | `{{linkedinUrl}}` (from Apify) |
| F — Company Description | `{{description}}` (from Apify) |
| G — Company Website | `{{domain}}` (from Anymailfinder input) |
| H — Job Title | `{{personJobTitle}}` (from Anymailfinder) |
| I — Employee Size | `{{employeeCount}}` (from Apify) |
| J — Year Founded | `{{foundedOn.year}}` (from Apify) |
| K — 1:1 Message | `{{personalization_line}}` (from GPT-4o) |
| L — Status | `✔` (hardcoded) |

---

## PlusVibe Lead Fields

| Field | Value |
|-------|-------|
| Email | `{{email}}` |
| First Name | `split(personFullName, " ")[0]` |
| Last Name | `split(personFullName, " ")[1]` |
| Company Name | `{{cleaned_company_name}}` |
| Website | `{{domain}}` |
| Phone | `{{phone.number}}` |
| Personalization | `{{1:1_line}}` |
| Campaign | `Example High Ticket SS` |

---

## Settings Audit

| Node | Model | Temp | Max Tokens | Issue |
|------|-------|------|------------|-------|
| Clean Companies | gpt-4o | 1.0 | not set | ⚠️ Temp too high for deterministic cleaning — use 0.2 |
| 1:1 Copy | gpt-4o | 1.0 | not set | ⚠️ Temp too high — use 0.5–0.7 for creative-but-controlled |

---

## ⚠️ n8n Adaptation Notes

| Original Tool | Your Tool | Notes |
|---------------|-----------|-------|
| **Tally** | Tally (or n8n Webhook) | Tally has no native n8n node — use webhook URL or n8n form trigger |
| **Apify** | Apify (n8n native node) | ✅ Direct equivalent |
| **Anymailfinder** | ❌ *You don't have this* | Source emails manually + verify with **mails.so** |
| **Instantly** | **PlusVibe** | Swap Instantly node for PlusVibe API calls |
| **Google Sheets** | Google Sheets (n8n native) | ✅ Direct equivalent |
| **GPT-4o** | **ChatGPT** (OpenAI node) | ✅ Direct equivalent |

---

## Key APIs & Services (Both Parts)

| Service | Purpose |
|---------|---------|
| **Tally** | Form intake (industry, headcount, location) |
| **Apify** | LinkedIn Company Search scraper (async launch + webhook on finish) |
| **Anymailfinder** | CEO/decision-maker email finder (by domain) |
| **GPT-4o** | Company name cleaning + 1:1 personalization line |
| **Google Sheets** | Prospect database (12-column enriched row) |
| **PlusVibe** | Email campaign — add lead with personalization |

---

## 🧰 Tech Stack Required

Everything needed to run this system end-to-end:

| Tool | Status |
|------|--------|
| A form (any form — Tally, Typeform, etc.) | ✅ |
| A Google Sheet template (Make a file → copy) | ✅ |
| Apify (starter plan) | ✅ |
| AnyMail Finder (or alternative email finder) | ✅ |
| Your AI model of choice (GPT-4o) | ✅ |
| Instantly / PlusVibe | ✅ |

---

## 💰 Pricing Philosophy: Bundle the Tech Stack

> **Sell it standalone — YOU pay for the tools, client pays YOU a higher price.**

If you sell a "hands-off system" but the client still has to go buy extra tools, it feels annoying to them. It's like selling someone a toy but telling them they need to go buy the batteries somewhere else. Most people don't like that.

**But if you include everything inside your price**, it feels easier and more complete:
- They don't have to think
- They don't have to shop
- They don't have to learn new tech
- It's just done

And because you're covering the tools for them, **you can charge more** — just like a restaurant charges more for a meal because they buy all the ingredients for you. Clients who aren't tech-savvy prefer this because it removes every headache. They pay once, and everything works.

**So the client gets peace of mind, and you get to charge a higher price.**

