# Virtual Mind 2.0

Virtual Mind is a personalized operating system designed to track my four pillars of life: Deen, Elesium, Influence, and Self. It serves as my command center to force accountability and align my daily actions with my broader purpose. "No man runs behind motivation because they are fueled with a greater feeling: Responsibility and Purpose."

## Setup Instructions

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your variables:
   ```bash
   cp .env.example .env
   ```
3. Install backend dependencies (Python):
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r api/requirements.txt
   ```
4. Install frontend dependencies (Node.js):
   ```bash
   cd frontend
   npm install
   ```
5. Start the full system:
   ```bash
   ./start.sh
   # Alternatively: ./start_api.sh or ./start_frontend.sh
   ```

## Architecture

- **Backend**: FastAPI
  - Routes logic for Notion DB syncing, Elesium outreach metrics, flaw/pattern analysis, operator logs.
  - Background scheduler running asynchronously for interval tasks.
- **Frontend**: Next.js + React Three Fiber
  - **Welcome Screen**: 3D visualization HUD.
  - **Command Center**: Main operation board tracking the four pillars.
  - **Lock Screen**: Prevents dashboard access until the daily log is submitted.
- **Data**: Synced via Notion APIs, analyzed and indexed using Qdrant.

## Available Commands
- `./start.sh` - Boots both API and Frontend in parallel.
- `./start_api.sh` - Boots only the FastAPI backend.
- `./start_frontend.sh` - Boots only the Next.js frontend.
