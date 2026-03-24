# 🔧 Workflow 03: Lead Reply Handler (2-Part System)

> Part 1 triggers when a lead replies → generates a reply draft → logs to CRM → sends Slack notification.
> Part 2 triggers when you click "Reply" in Slack → extracts lead info → sends the AI-drafted reply.

**Platform:** n8n.io (originally Make.com blueprint — to be recreated in n8n)
**Purpose:** Auto-generate intelligent replies to interested leads + CRM logging + Slack alerts
**Trigger:** Instantly.ai webhook (new lead reply event)

> ⚠️ **n8n adaptation:** Swap Instantly → PlusVibe webhooks

---

## Part 1: "New Lead Generated 🚀 & Generate Reply → Send To Slack"

### Flow
```
Instantly Webhook (Lead Reply)
    └── Search Lead in Instantly (get company_domain, lead_data)
            └── HTTP GET: Scrape Lead's Website
                    └── HTML → Text (clean markup)
                            └── GPT-4o: Extract Case Study from website
                                    └── GPT-4: Generate Personalized Reply Email
                                            └── ClickUp: Create CRM Task (status: "interested")
                                                    └── Slack: Send Rich Notification with Reply Button
```

### Step-by-Step Breakdown

| Step | Node | Tool | Purpose |
|------|------|------|---------|
| 1 | Watch Events | **Instantly.ai** | Webhook triggers when a lead replies to an outreach email |
| 7 | Search Lead | **Instantly.ai** | Look up replying lead by email + campaign_id → `company_domain`, `firstName`, `lastName`, `companyName`, `Title` |
| 6 | Scrape Website | **HTTP Request** | GET `http://{{company_domain}}` to fetch company website HTML |
| 8 | Clean HTML | **HTML to Text** | Strip HTML tags, convert to clean text with uppercase headings |
| 4 | Retrieve Case Study | **GPT-4o** | Analyze website text → extract specific case study / success story |
| 5 | Inbox Assistant | **GPT-4** | Generate personalized reply email using case study + lead data |
| 12 | Add to CRM | **ClickUp** | Create task in "Pipeline" list with status "interested", custom fields |
| 9 | Send to Slack | **Slack** | Post rich Block Kit notification to `#central` with Reply button |

### AI Prompt — GPT-4o: Retrieve Case Study

**System:** "You are an expert business analyst specializing in identifying key revenue drivers for companies based on their website content."

**User Prompt:**
```
Analyze the provided company data to identify a specific case study or success 
story that demonstrates how the company helped their customer.

Address the following:
- Which customer pain points were solved?
- Which products or services played a key role in generating revenue?
- What were the measurable results achieved? (efficiency, cost savings, revenue)
- What features or services drove the most value?
- Were there any testimonials or feedback?

Output only the case study, focusing on challenges, solutions, and measurable results.
```

**Input:** `{{8.text}}` (cleaned website content)

### AI Prompt — GPT-4: Inbox Assistant (Reply Generator)

**System:** "You are a helpful intelligent writing assistant."

**User Prompt:**
```
Below are information about a lead that's interested in our services. 
Use this template (filling in the variables with data provided). 
Do not output anything except for the email copy.

Lead case studies mentioned: {{4.result}}
Lead website scraped data: {{4.result}}

Template:
Thanks for getting back to me [{{firstName}}] - saw your team crushed 
[specific achievement from case study, include $ if applicable] 🎯

We can help you target [dream_icp] right when they're talking about [pain_moment].

Working with similar companies in the [industry] space, noticed the best 
way to do that is to mine job boards. You could look for roles that talk about:

[job_board_idea_one]
[job_board_idea_two]
[job_board_idea_three]

It's the perfect excuse to reach out— and it's even crazier when you run 
all this automatically.

Cordialement
- Saad

Sent from iPhone
```

### Slack Notification Format (Block Kit)
- **Section:** "You generated a new lead 🚀" + clickable link to ClickUp task
- **Fields:** Campaign Name, Campaign ID, When (timestamp), Lead Title, Lead Email
- **Action:** "Reply" button (triggers Part 2 webhook)

### Settings Audit

| Node | Model | Temp | Max Tokens | Issue |
|------|-------|------|------------|-------|
| Case Study (Step 4) | gpt-4o | 1.0 | 2048 | ⚠️ Temp too high for factual extraction — use 0.3–0.5 |
| Inbox Assistant (Step 5) | gpt-4 | 0.6 | 4090 | ✅ Temp good; ⚠️ max tokens high for short reply |

---

## Part 2: "Slack Button Pressed → Reply To Lead"

### Flow
```
Slack Webhook (Button Click)
    └── Parse JSON (extract payload)
            └── GPT-4o-mini: Extract lead info from Slack message text
                    └── Parse JSON (firstName, lastName, email)
                            └── [Reply to lead via PlusVibe / Email]
```

### Step-by-Step Breakdown

| Step | Node | Tool | Purpose |
|------|------|------|---------|
| 1 | Custom Webhook | **Webhook** | Receives Slack interactive payload when "Reply" button is clicked |
| 3 | Parse JSON | **JSON** | Extract `payload` from the webhook body |
| 7 | Extract Lead Info | **GPT-4o-mini** | Parse Slack message text → extract `firstName`, `lastName`, `email` as JSON |
| 8 | Parse JSON | **JSON** | Structure GPT output into usable fields |
| — | Send Reply | **PlusVibe / Email** | Uses extracted lead info to send the AI-generated reply |

### AI Prompt — GPT-4o-mini: Extract Lead Info from Slack

Uses **few-shot prompting** with an example:

**User (example):**
```
Retrieve the lead's information from this text and structure it in the 
correct JSON, output the JSON only with no ```json:

{"firstName":"Saad","lastName":"Belcaid","email":"saadb@myoprocess.com"}
```

**User (actual):** `{{3.message.text}}` ← real Slack message content

### Settings Audit

| Node | Model | Temp | Max Tokens | Issue |
|------|-------|------|------------|-------|
| Extract Lead Info | gpt-4o-mini | 1.0 | 2048 | ⚠️ Temp should be 0 for JSON extraction; max tokens → ~100 |

---

## Key APIs & Services (Both Parts)

| Service | Purpose |
|---------|---------|
| **PlusVibe** | Webhook trigger + lead search (was Instantly) |
| **HTTP Request** | Website scraping |
| **GPT-4o** | Case study extraction from website content |
| **GPT-4** | Personalized reply email generation |
| **GPT-4o-mini** | Lead info extraction from Slack messages |
| **ClickUp** | CRM task creation (Pipeline list, "interested" status) |
| **Slack** | Rich notification with interactive Reply button |
