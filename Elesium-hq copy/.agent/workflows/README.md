# AI Inbox Manager & Lead Assistant - Setup Guide

This n8n workflow automates your inbox management and lead handling.

## Features
*   **Auto-Classification:** Sorts emails into `Action Required`, `Waiting On`, `Reference`, and `Lead Reply`.
*   **Lead Handling:** Detects replies from prospects, analyzes intent (Interested, Objection, etc.), drafts a response, and pings you on Slack with an "Approve" button.
*   **Inbox Zero:** Auto-archives "Reference" emails and labels others.

## Prerequisites
You need the following credentials set up in n8n:
1.  **Gmail OAuth2** (with `gmail.modify` scope)
2.  **OpenAI API** (GPT-4o access)
3.  **Slack API** (Bot User OAuth Token)

## Setup Instructions

1.  **Import Workflow:**
    *   Open your n8n dashboard.
    *   Click **Workflows** > **Import**.
    *   Select the `inbox_manager.json` file.

2.  **Configure Credentials:**
    *   Double-click the **Gmail** nodes and select your Gmail credential.
    *   Double-click the **OpenAI** nodes and select your OpenAI credential.
    *   Double-click the **Slack** nodes and select your Slack credential.

3.  **Customize Settings:**
    *   **Slack Channel:** Open the Slack nodes and change the channel (default: `messaging` and `general`) to where you want notifications.
    *   **Schedule:** Open the Trigger node to change how often it runs (default: every 15 mins).

## Testing
1.  Click **Execute Workflow** at the bottom of the canvas.
2.  Watch the execution live.
3.  Check your Slack for notifications and your Gmail for new labels!
