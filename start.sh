#!/usr/bin/env bash

# Start both API and Frontend in parallel
echo "Starting Virtual Mind 2.0 (API + Frontend)..."

# Start backend
./start_api.sh &
API_PID=$!

# Start frontend
./start_frontend.sh &
FRONTEND_PID=$!

# Handle shutdown smoothly
trap "kill $API_PID $FRONTEND_PID" EXIT

# Wait for processes
wait
