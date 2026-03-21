#!/usr/bin/env bash
# StudyLens — Start server
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      StudyLens · AI Study Assistant  ║"
echo "╚══════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Install dependencies
echo "▶ Installing dependencies…"
pip install -r backend/requirements.txt --break-system-packages -q 2>&1 | tail -5

echo ""
echo "▶ Starting StudyLens server on http://localhost:8000"
echo "   Press Ctrl+C to stop."
echo ""

python3 -m uvicorn backend.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --log-level info
