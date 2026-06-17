#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Virtual Mind 2.0 — Mobile Network Startup
# Starts both API and Frontend bound to LAN so your
# Android phone can reach them on the same WiFi network.
# ─────────────────────────────────────────────────────────

set -e

# ── Detect local IP ──
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        ⚡ VIRTUAL MIND 2.0 — MOBILE DEPLOYMENT ⚡        ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  Your Mac's LAN IP:  $LOCAL_IP                     ║"
echo "║                                                           ║"
echo "║  Backend API:    http://$LOCAL_IP:8001              ║"
echo "║  Frontend App:   http://$LOCAL_IP:3000              ║"
echo "║                                                           ║"
echo "║  ── INSTALL ON YOUR ANDROID PHONE ──                      ║"
echo "║                                                           ║"
echo "║  1. Connect phone to the SAME WiFi as this Mac            ║"
echo "║  2. Open Chrome on your phone                             ║"
echo "║  3. Go to:  http://$LOCAL_IP:3000                  ║"
echo "║  4. Tap the Chrome menu (⋮) → 'Install app'              ║"
echo "║     or 'Add to Home screen'                               ║"
echo "║  5. The app now lives on your home screen like            ║"
echo "║     a native app — fullscreen, no URL bar.                ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# ── Write the dynamic .env.local for frontend ──
cat > frontend/.env.local <<EOF
NEXT_PUBLIC_API_URL=http://${LOCAL_IP}:8001
EOF
echo "[BOOT] Frontend .env.local updated → API at http://${LOCAL_IP}:8001"

# ── Dynamically update next.config.ts with current LAN IP ──
# This fixes the "cross origin request" warning that breaks WebView rendering
cat > frontend/next.config.ts <<EOF
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow Android WebView and LAN devices to access Next.js dev server
  // resources without cross-origin blocking (fixes black screen in WebView)
  allowedDevOrigins: [
    '${LOCAL_IP}',
    '*.local',
    'localhost',
  ],
};

export default nextConfig;
EOF
echo "[BOOT] next.config.ts updated → allowedDevOrigins includes ${LOCAL_IP}"

# ── Update MainActivity.kt default URL to current IP ──
MAIN_ACTIVITY="android-app/app/src/main/java/com/example/virtualmind/MainActivity.kt"
if [ -f "\$MAIN_ACTIVITY" ]; then
  sed -i '' "s|val defaultUrl = \"http://[^\"]*:3000\"|val defaultUrl = \"http://\${LOCAL_IP}:3000\"|g" "\$MAIN_ACTIVITY"
  echo "[BOOT] MainActivity.kt defaultUrl updated → http://\${LOCAL_IP}:3000"
fi

# ── Start Backend (bound to 0.0.0.0 so phone can reach it) ──
echo "[BOOT] Starting FastAPI backend on 0.0.0.0:8001..."
source venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload &
API_PID=$!

# ── Start Frontend (bound to 0.0.0.0) ──
echo "[BOOT] Building Next.js for production (this fixes WebView CSS/JS injection bugs)..."
cd frontend
npm run build
echo "[BOOT] Starting Next.js production server on 0.0.0.0:3000..."
HOST=0.0.0.0 PORT=3000 npm run start &
FRONTEND_PID=$!
cd ..

# ── Handle shutdown ──
trap "echo ''; echo '[SHUTDOWN] Killing servers...'; kill \$API_PID \$FRONTEND_PID 2>/dev/null; exit 0" EXIT INT TERM

echo ""
echo "[BOOT] Both servers running. Press Ctrl+C to stop."
echo ""

wait
