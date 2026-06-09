#!/usr/bin/env bash

# Start API only
echo "Starting Virtual Mind API..."
source venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
