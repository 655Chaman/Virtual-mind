# 📡 SIGNALS — How to Find the Right Leads

> **This file is your radar.** Before you scrape, enrich, or personalize anything — you need to know WHERE to look and WHAT signals to track. Every lead you find should have a *reason* behind it.

---

## 🧠 The Pain-Sniffing Method

**Core rule:** Target leads based on the specific business pain you can solve — not their job title.

### ❌ The Wrong Way
- "Target all marketing directors at 500+ employee tech companies"
- "Let's target companies showing signs they need better website copy"

### ✅ The Elesium Way
- A company hiring a Copywriter → they struggle with website conversions → you can connect them with agencies who fix that
- A company posting for an SDR → they need more pipeline → you can connect them with companies already looking for their product
- You won't have perfect data, but the *signal* gets you close enough

---

## 🎯 Three Core Tactics

### Tactic 1: Job Postings ⭐ PRIMARY
When a company is hiring for a specific role, they're broadcasting a pain point:

| They're Hiring... | The Real Pain | Your Opening |
|-------------------|---------------|---------------|
| Copywriter | Poor website conversions | Connect them with copywriting agencies |
| SDR / BDR | Need more leads | Connect them with lead gen solutions |
| Marketing Manager | Need growth | Connect them with marketing partners |
| HR / Recruiter | Can't find talent | Connect them with recruitment firms |
| DevOps Engineer | Infrastructure scaling | Connect them with tech talent firms |

**Move:** Reach out *before* they fill the role. Offer the solution, not the hire.

### Tactic 2: Tech Stack
If a company uses software X, they likely have problems that software Y solves:

- Find businesses using a competitor's tool → offer a better alternative through your network
- Works especially well for SaaS companies
- **Pitch:** "I can connect you with dream clients already using similar software"

### Tactic 3: Funding Announcements
Recently funded companies have budget AND growth pressure:

| Funding Stage | What They Need | Your Move |
|---------------|---------------|-----------|
| Pre-Seed / Seed | Early customers, product-market fit | Connect them with early adopters |
| Series A | Scale sales, hire team | Connect them with growth partners |
| Series B+ | Market dominance, expansion | Connect them with enterprise clients |

---

## 📊 Data Pipeline

Every lead you scrape should produce these 5 data points for maximum personalization:

```
Scrape Companies (EXA / Apify / Google Maps)
    └── Enrich Each Lead With:
            ├── 1. Founder / Decision-Maker Name
            ├── 2. Company Short Description (1 line, what they actually do)
            ├── 3. Company Latest Achievement (funding, launch, award, hire)
            ├── 4. Competitor Name (who they're up against)
            └── 5. Exact Job Title of Open Role (if using Tactic 1)
```

> If you can't get all 5, at minimum get: **Name + Company Description + One of the other three.** That's enough for a solid opener.

---

## 🔍 LinkedIn Search Queries (RapidAPI)

All queries use `google-search74.p.rapidapi.com` to find LinkedIn profiles. Replace `{{variables}}` with actual values.

### Founder / CEO
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22founder%22%20OR%20%22co-founder%22%20OR%20%22ceo%22)%20(%22{{company_name}}%22)&limit=1&related_keywords=true
```

### Clinic Managers / Decision-Makers
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22owner%22%20OR%20%22founder%22%20OR%20%22co-founder%22%20OR%20%22ceo%22%20OR%20%22managing%20director%22%20OR%20%22clinic%20manager%22)%20(%22{{company_name}}%22)&limit=1&related_keywords=true
```

### Hiring Manager / HR
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22hiring%20manager%22%20OR%20%22talent%20acquisition%20manager%22%20OR%20%22recruiter%22%20OR%20%22HR%20manager%22)%20(%22{{company_name}}%22)&limit=1&related_keywords=true
```

### CISO / VP Security / CTO
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22ciso%22%20OR%20%22vp%20security%22%20OR%20%22cto%22)%20(%22{{company_name}}%22)&limit=1&related_keywords=true
```

### VP Sales / Sales Director
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22vp%20sales%22%20OR%20%22vice%20president%20sales%22%20OR%20%22sales%20manager%22%20OR%20%22head%20of%20sales%22%20OR%20%22sales%20director%22)%20(%22{{company_name}}%22)&limit=3&related_keywords=true
```

### Operations (NOT HR) — For Recruitment Fulfilment
```
https://google-search74.p.rapidapi.com/?query=site:linkedin.com/in/ ("founder" OR "co-founder" OR "ceo" OR "owner" OR "vp of construction" OR "project executive" OR "operations manager") "{{company_name}}"&limit=1&related_keywords=true
```

---

## 🧭 Signal Priority Matrix

When you have limited time, prioritize signals in this order:

| Priority | Signal | Why |
|----------|--------|-----|
| 🔴 1 | Job posting for a role you can solve | They're actively spending money on this pain |
| 🟠 2 | Funding announcement (last 90 days) | Fresh budget + growth mandate |
| 🟡 3 | Competitor just made a big move | Creates urgency and FOMO |
| 🟢 4 | Tech stack includes a tool you can replace/augment | Natural conversation starter |
| 🔵 5 | PR / product launch / award | Good for congrats-style openers |
