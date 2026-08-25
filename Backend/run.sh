#!/bin/bash
# Monagrid Backend — Start Script
# Run from: /home/donald-mazole/DON/PG/MONAGRID/Backend/
# Usage: ./run.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UVICORN="$SCRIPT_DIR/Monagrid_backend/bin/uvicorn"

echo "🌞 Starting Monagrid FastAPI Backend..."
echo "   Model: model/best_binary_resnet18.pth"
echo "   Classes: 0 = Healthy | 1 = Faulty"
echo "   Docs: http://localhost:8000/docs"
echo ""

cd "$SCRIPT_DIR"
"$UVICORN" main:app --host 0.0.0.0 --port 8000 --reload
