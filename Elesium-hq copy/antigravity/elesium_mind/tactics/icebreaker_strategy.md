# Advanced Icebreaker Strategy (Exa.ai + GPT-4o)

This strategy enhances personalization by first summarizing a website's content before generating the icebreaker.

## Prerequisites

-   **Exa.ai API Key**: To fetch website content (`/contents`).
-   **OpenAI/Claude API Key**: For GPT-4o mini (summary) and GPT-4o (icebreaker).

## Process Flow

1.  **Enrichment (Exa.ai)**: Get website text.
2.  **Summary (GPT-4o mini)**: Summarize key points (achievements, metrics, case studies).
3.  **Generation (GPT-4o)**: Create a specific 2-sentence icebreaker from the summary.

## Step 1: Get Website Content (Exa.ai)

**Method**: POST `https://api.exa.ai/contents`

**Headers**:
-   `content-type: application/json`
-   `x-api-key: [YOUR_API_KEY]`

**Body**:
```json
{
    "ids": ["{{companyWebsite}}"],
    "text": true
}
```

## Step 2: Website Summary Prompt

**Model**: GPT-4o mini (capable of handling large context cheaply)

**Prompt**:
```text
Summarize the most important points from the following website text of {{companyWebsite}}

Focus on key achievements, metrics, case studies, and target audience. Structure the output as follows:

- Company Overview: (Brief summary of what the company does, its core focus, and unique approach.)
- Key Achievements & Metrics: (List of specific results the company has achieved, with numbers if available.)
- Case Studies & Success Stories: (Highlight 2-3 major success stories, including company names and results.)
- Target Audience: (Who are the given company targeting for their services? Mention their ICP and which industries and/or the type of companies they serve.)

Ensure the summary is clear, concise, and actionable for crafting a targeted outreach message.

Keep the summary under 250 words and don't refer to clients as "A" or "B" or "C". Make sure the summary is accurate to the given website text. Don't assume anything and stick to the given website text. Stick to the language, keywords and phrases used in the website text. Keep the wording closer to what the website emphasizes.

Website Text:
{{exa_website_text}}
```

## Step 3: Icebreaker Generation Prompt

**Model**: GPT-4o (or Claude 3.5 Sonnet) for high-quality output.

**System Prompt**:
```text
# RULES
- Keep the total word count sub 20
- Refrain from taking the name of the website owner and instead talk in second person using "you"
- Use direct spartan like language and tone. And sub grade 6 language too.
- IF you are using any company name or name in the output, make sure to remove any prefix/suffix like INC, LLC, etc. Normalize it so the output does not come across as automated.
- Cut the fluff and keep the sentence as concise as possible.
- Don't start the sentence with "I"
- Don't use exclamation mark
- IF client name is not available. Don't refer to them as "Client A", just write "your client".
```

**User Prompt**:
```text
Based on the given website summary:

{{company_description_summary}}

Write a two-sentence icebreaker:

1. First sentence: Make an observation about something VERY specific they accomplished (you must use numbers, results, client names). 

2. Second sentence: Ask a question that subtly suggests they might need help getting more clients. Make this question sound natural. 

Keep the sentence under 20 words total. Make it sound like an average person conversing with his friend.

Examples:

1. Saw how you boosted web referrals nearly 50% in a year for your clients. Are you looking to attract even more businesses with your services? 

2. Noticed how Julie Roy booked her coaching program within 30 days of launch. Are you looking to take on more clients in capital raising? 

3. Saw how you helped London's Tax Services grow their clientele with social media. Are you looking to attract more small businesses like them?
```
