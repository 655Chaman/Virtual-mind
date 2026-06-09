#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Virtual Mind 2.0 — Background Server Startup
# Starts both API and Frontend bound to LAN in background,
# so they keep running even when you close the terminal.
# ─────────────────────────────────────────────────────────

# Kill any existing processes on port 3000 or 8001
echo "[BOOT] Clearing old processes on ports 3000 and 8001..."
lsof -ti:3000,8001 | xargs kill -9 2>/dev/null || true

# Detect LAN IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

# Write environment config
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://${LOCAL_IP}:8001
EOF
echo "[BOOT] Frontend .env.local updated → API at http://${LOCAL_IP}:8001"

# Start Backend in background
echo "[BOOT] Starting backend on 0.0.0.0:8001 in background..."
source venv/bin/activate
nohup uvicorn api.main:app --host 0.0.0.0 --port 8001 > api_server.log 2>&1 &
API_PID=$!

# Start Frontend in background
echo "[BOOT] Starting frontend on 0.0.0.0:3000 in background..."
cd frontend
nohup npx next dev --hostname 0.0.0.0 --port 3000 > frontend_server.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      ⚡ VIRTUAL MIND 2.0 — BACKGROUND SERVICES ⚡        ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  Your Mac's LAN IP:  $LOCAL_IP                     ║"
echo "║  Backend running (PID $API_PID) on http://$LOCAL_IP:8001      ║"
echo "║  Frontend running (PID $FRONTEND_PID) on http://$LOCAL_IP:3000   ║"
echo "║                                                           ║"
echo "║  These processes run in the background (detached).        ║"
echo "║  You can close this terminal and they will stay active.  ║"
echo "║                                                           ║"
echo "║  To stop them at any time, run:                           ║"
echo "║  lsof -ti:3000,8001 | xargs kill -9                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
