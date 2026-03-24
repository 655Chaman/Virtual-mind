# ✉️ Prompt Templates

All 31 prompt templates used across outreach workflows. Each template has a number, name, use case, and the actual prompt.

---

## 1. Recruitment Fulfilment Prompt

**Use Case:** When targeting companies with open job postings

```
Generate a short, friendly outreach message in two parts using the following format:

Opener (max 8 words):
Start with:
"Noticed [Company] is hiring for a [PositionName] —"
Then add a casual, non-obvious note about the role (like seniority, urgency, project scale). Keep it natural — something a recruiter or peer might say in a quick message. Do not use formal phrasing or generic buzzwords.

Follow-up (1–2 lines):
Explain why that kind of role is hard to fill locally — mention something specific (e.g., "10+ years on federal jobs," "certified for QA/QC," etc.). Sound like a peer who knows the market, not a sales pitch.

Instructions:
- Strip suffixes like "LLC," "LTD," "Inc.," "Construction," "Builders," or "Group." Use short internal names employees would actually say — e.g., "BCR" instead of "Baker Concrete Construction," "Turner" instead of "Turner Construction Company."
- No formal tone. Keep it human and conversational.
- Do not include "role to fill," "rare," or other clichés.
- Do not restate the job title — use that space to add insight.
- Only output the final message — no labels, no explanation.
```

---

## 2. Insider-Style Message

**Use Case:** LinkedIn-style warm connection

```
Create one casual, insider-style message that feels personal and credible. The tone should be like a fellow founder/operator making a warm connection without high energy.

Formula:
"Hey [First Name], [specific achievement] ([add a brief industry insight])"

Keep it short 3 lines max, genuine. The message should feel like a casual LinkedIn message between peers, not a formal business outreach. NO EMOJIS. NO CTAS Output the result only with no additional text.
```

---

## 3. Clutch Prompts (3-Part Sequence)

### First Touch
```
Given the following input, generate a brief statement similar to this:

Came across [Company Name] — saw your recent work and thought it made a lot of sense for the kind of [startups/scale-ups/etc.] I talk to. A lot of them are hiring for [React/web/mobile/etc.] devs, but honestly, they'd move way faster partnering with a team like yours.

Example:
Came across AppVerticals — saw your recent work and thought it made a lot of sense for the kind of startups I talk to. A lot of them are hiring for React or mobile devs, but honestly, they'd move way faster partnering with a team like yours.

Variables:
- Company name: {{1.summary.name}}
- Title: {{1.summary.title}}
- Description: {{1.summary.description}}
- Focus: {{1.focus}}
- Services provided: {{1.serviceProvided}}
```

### Follow-up
```
Checking in to see if connecting with companies looking for [AI talent / mobile devs / React developers / web developers / etc.] might be of interest. Happy to make a few introductions if it's a fit.
```

### Last Follow-up
```
Quick recap — we scrape job boards to find companies hiring for [AI talent / mobile devs / React developers / web developers / etc.]. These companies are already dedicating budget to the problem your team solves.
```

---

## 4. Founder Image Compliment

**Use Case:** When you have access to founder's profile photo

```
Create a casual, insider-style complimentary message for a cybersecurity founder based on their profile photo.

Rules:
- 3 lines max.
- Focus on their presentation style (e.g., clean, minimal, sharp), and subtly connect it to how they might approach building secure products.
- The tone should be like a fellow founder/operator making a warm connection not a LinkedIn or cold outreach.

Keep it short and genuine. The message should feel like a casual note between two operators—not formal, not salesy

Output the result only with no additional text
```

---

## 5. Company Size Filtering

```
Normalize to these formats: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001+.
Clean this list, don't put any additional text
{{ $json['Company Size'] }}
```

---

## 6. "Looks Like" Mention Prompt

**Use Case:** Job posting-based opener

```
Given the following input, generate a brief statement similar to this:

Saw the open [job title] role, [seems like you're working on [main initiative or focus] to [desired outcome or impact].

Perfect output:
Saw the open BDR role, seems like you're growing global partnerships to help more patients get treated

Max: 8-10 words
Job title: {{1.jobTitle}} (Make sure it's an abbreviation like CMO, SDR, BDR)
Job description: {{1.jobDescription}}
Sector: {{1.sector}}
```

---

## 7. Recruitment Growth Prompt

```
Looked at your job board and saw you're hiring for [X job title]. Imagine you need help finding great people faster so you can [X benefit].

Example:
Looked at your job board and saw you're hiring for an HR Talent Acquisition Specialist. Imagine you need help finding great people faster so you can clients' urgent staffing needs without burning out the current team.
```

---

## 8. PR Announcement Prompt

```
Given the following input, generate a brief statement in correct JSON with no ```json

Saw the news on [NEWS_SOURCE] about [COMPANY_NAME] launching on [LAUNCH_DATE] — Not many companies actually follow through on entering the [INDUSTRY_TYPE] market despite all the talk

Example:
{"result":"Saw the news on PR Newswire about Elevex launching on Jan 29 — Not many companies actually follow through on entering the equipment financing market despite all the talk"}
```

---

## 9. Competitor Mention Prompt

```
Just saw that [[competitor_name]]'s been doubling down on [[competitor_focus]] through its [[initiative_or_fund_name]]. Interesting to see how they're leaning on more [[traditional_or_alternative_method]]—while [[your_company_name]] seems to be heading in a more [[your_approach]] direction right from the start.

Example:
Just saw that Sallyport's been doubling down on operational growth through its new fund. Interesting to see how they're leaning on more traditional investment methods—while Elevex seems to be heading in a more tech-forward direction right from the start.
```

---

## 10. Non-Surface Level Observation

```
Generate an outreach message similar to:

Happy to see that [company_name] looks a bit different from all the generic/gimmicky [startup_category] startups out there.

Example:
Happy to see that Hypothetical Company looks a bit different from all the generic/gimmicky AI support startups out there.
```

---

## 11. Subject Line Prompt

```
Generate one subject line that feels like they could be the subject lines of an internal email—this helps them feel natural in the inbox. For example, "Quick question", or "Idea for better outbound" are two casual, natural-feeling subject lines. Output the subject line only with no additional text.
```

---

## 12. Product Mention / Congrats Prompt

```
Write a casual and genuine congratulatory message for a startup launching a new product. Acknowledge the excitement and overwhelm that comes with a product launch.

Start with "Congrats on [specific achievement]"
Include a brief mention of their milestone or the impact of the product
Keep it short and personal (3 lines max). Make sure it feels like a LinkedIn message between peers. Avoid emojis.
```

---

## 13. High Quality Follow-Up

```
Since you offer [product/feature], I thought you'd appreciate this insight. A company in a similar space was able to reach more of [ideal clients]—using our sales systems. It helped them [key metric or result].

What's interesting is that [company name] was able to [benefit they saw from your product/service]—a real game-changer for their business.

Given your work with [related problem or challenge they might face], I'd love to discuss how we might be able to help you tackle that as well.

Example:
Since you offer premium relaxation products like the VISTA™ stand, I thought you'd appreciate this insight. A company in a similar space was able to reach more high-intent buyers actively searching for luxury wellness solutions—using our sales systems. It helped them increase direct sales by 42% while reducing their dependence on paid ads.
```

---

## 14. Recruitment Thoughtfulness

```
– finding people who can maintain the company's '[philosophy or approach]' [team function] while scaling must be a real challenge.

Example:
finding people who can maintain the company's 'say yes' underwriting philosophy while scaling must be a real challenge
```

---

## 15. Ad Mention Prompt

```
Saw you're promoting [Product/Offer] [context, e.g., "post-[Event/Launch]"]. Instead of relying on ads, what if you had a way to connect directly with [Ideal Buyer Persona] already looking for [Product Category/Benefit]?

Example:
Saw you're promoting the VISTA™ stand post-Shark Tank. Instead of relying on ads, what if you had a way to connect directly with buyers already looking for premium relaxation products?
```

---

## 16. Mentioning Job Titles

```
Was looking for companies hiring for sales and noticed you're hiring for [exact job title].

Clean this job title by removing unnecessary details and returning only the core job title.
Example: Sales Representative → "Sales Rep", Chief Marketing Officer → "CMO"
```

---

## 17. Mentioning Ideal Clients

```
Given that your ideal clients are [Target Client 1] and [Target Client 2] seeking [Service/Product], I've helped companies in similar spaces connect directly with the decision-makers who matter most. For example, I worked with Vention, a company focused on industrial automation, and helped them add $85K in revenue in just 12 weeks using a targeted outbound sales system.
```

---

## 18. Mentioning Competitors

```
I saw that [Competitor Name] just hit a major milestone—they successfully launched their [Product/Service], reaching [Achievement/Goal]. It's a big deal, especially with everything happening in the [Industry/Field] and [Relevant Sector].

Example:
I saw that Blue Origin just hit a major milestone—they successfully launched their New Glenn rocket, reaching orbit on its maiden flight. It's a big deal, especially with everything happening in the hypersonic and space sectors.
```

---

## 19. DeepThought Smart Personalization

```
I was thinking about the challenges of [industry challenge] and how teams like [Company Name] are navigating them. It seems like [potential pain point], but I don't know exactly how you're approaching it right now.

Example:
I was thinking about the challenges of keeping users engaged across fragmented platforms. It seems like outbound could play a role in accelerating the right connections at scale—but I don't know exactly how you're approaching it right now.

Variables:
- Description: {{1.short_description}}
- Industry: {{1.categories[].value}}
- Company name: {{1.name}}
```

---

## 20. Tech Stack Alternative Line

```
I know you're passionate about creating [Type of Solutions], and I believe this upgrade aligns perfectly with your mission to provide [Specific Innovation or Value Proposition] in the [Industry/Field] space at [Company Name].

To make it easy, I'm offering a [Offer Type] where you can experience the benefits firsthand with no commitment. I'm confident it will add tremendous value to how you engage with your [Target Audience/Users] and help you achieve [Specific Desired Outcome].
```

---

## 21. Tech Stack Competitor Outreach Line

```
One strategy we use is helping [Competitor Product] alternatives like [Company Name] connect with their ideal clients through AI outbound sales systems. We can identify companies actively looking for a better solution and reach out to them at the perfect moment—helping you convert them into loyal customers.
```

---

## 22. Achievement-Based Outreach

```
Noticed [Company Name] has been working on [Specific Initiative], looks like you're on the right track to improving [Specific Aspect]. It's clear you're putting in the effort to scale, and I can help accelerate that process.

Example:
Noticed Join It has been working on your new referral program, looks like you're on the right track to improving user acquisition and engagement. It's clear you're putting in the effort to scale, and I can help accelerate that process.
```

---

## 23. Targeted Job Outreach

```
Saw you're hiring for a [Job Title] at [Company Name], which tells me you're likely looking to [Goal 1] and [Goal 2] for your [Product/Service].

Example:
Saw you're hiring for a Marketing Manager at Join It, which tells me you're likely looking to boost membership sign-ups and increase platform adoption for your membership management solution.
```

---

## 24. Job Description Smart Personalization

```
Based on the job title description '[{{1.descriptionText}}]', list the key decision-makers this role would typically sell to. Format the response as 'X, Y, and Z—without the usual overhead.' where X, Y, and Z are relevant decision-makers.

Example:
election officials, procurement officers, and key stakeholders—without the usual overhead.
Output only the finalized result with no additional text
```

---

## 25. Non-Pushy Ending Personalization

```
Generate a one liner that starts with "Let me know" and mentions if the company would like to connect with their ideal clients more efficiently, you're always ready to help when the time is right. Keep the tone slightly informal but business-appropriate, and limit the line to 15-20 words.
Only output the one liner.
```

---

## 26. Cross-Referencing Competitors

```
Noticed [Competitor] ramping up their outbound—saw they just [specific action, e.g., hired 15 new SDRs, launched a campaign]. Looks like they're making a serious push to dominate [industry/market] by [specific competitive advantage].

Example:
Noticed Zoho CRM making big moves—saw they just won Best CRM of 2024 by Forbes Advisor. Looks like they're really pushing to take the lead in the CRM market by offering great features, scalability, and integrations that help businesses of all sizes.
```

---

## 27. PS-Line (AI Recruitment)

```
Generate a P.S. line that mentions if the company would like to connect with companies hiring for AI talents more efficiently in the future, you're always ready to help when the time is right. Keep the tone slightly informal but business-appropriate, and limit the line to 15-20 words.
Only output the P.S. line
```

---

## 28. Generate Thoughtful Congrats Line

**Used in:** E2E Campaign workflow (Claude #1)

```
Create a brief, casual congratulatory message that references a specific achievement and adds a personal connection point.

Format: Congrats on [recent achievement] ([brief industry insight that establishes credibility]).

Rules:
- Start with "Congrats on"
- Feel like an authentic note between peers
- Be just one line
- Avoid sounding like marketing copy
- Maintain casual yet polished tone
- Prioritize lowercase usage
- Abbreviate where it makes sense
- Steer clear of complex jargon
```

---

## 29. Non-Surface Observation (Advanced)

**Used in:** E2E Campaign workflow (Claude #2)

```
You are a specialized assistant that creates authentic-sounding professional observations that highlight how a company stands out from competitors.

Output Requirements:
- Each message must start with "Happy to see that [Company Name]"
- Draw a contrast between the company and generic competitors
- Must be a single sentence
- No explanations, suggestions, or additional commentary

Tone: Professional but conversational, genuine, slightly informal but business-appropriate

Example:
"Happy to see that Acme Solutions is building something with actual substance rather than just riding the industry hype train like most of their competitors."
```

---

## 30. Thoughtful Follow-Up Message

**Used in:** E2E Campaign workflow (Claude #3)

```
You are a specialized assistant that creates authentic-sounding professional observations that demonstrate clear understanding of this company's pain points.
- Each message must be a single sentence
- No explanations, suggestions, or additional commentary
- Show genuine interest in helping them find a solution
- Professional but conversational
- Avoid marketing language, buzzwords, and hyperbole
```

---

## 31. PS-Line (General)

**Used in:** E2E Campaign workflow (Claude #4)

```
Generate a P.S. line that mentions if the company would like to connect with their ideal clients more efficiently in the future, you're always ready to help when the time is right. Keep the tone slightly informal but business-appropriate, and limit the line to 15-20 words.
Only output the P.S. line
```
