---
description: How to deploy a Modal app for n8n API endpoints
---

# Deploying a Modal App

1. Ensure Modal CLI is installed and authenticated:
   ```bash
   pip install modal
   modal token new
   ```

2. **Main webhook system** (from `execution/`):
   ```bash
   modal deploy execution/modal_webhook.py
   ```

3. **Simple template app** (from `modal/`):
   ```bash
   modal deploy modal/modal_app.py
   ```

4. Set required Modal secrets before deploying:
   ```bash
   modal secret create anthropic-api-key ANTHROPIC_API_KEY=<your-key>
   modal secret create api-auth-token API_AUTH_TOKEN=<your-token>
   ```

5. After deployment, note the endpoint URLs printed by Modal. Use these in n8n HTTP Request nodes.
