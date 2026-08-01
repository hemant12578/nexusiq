#!/bin/bash
echo "========================================================"
echo "  NexusIQ — Multi-Modal Compliance Intelligence Platform"
echo "========================================================"

cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "NexusIQ Services Launched:"
echo "- Frontend: http://localhost:5173"
echo "- Backend:  http://localhost:8000"

wait $BACKEND_PID $FRONTEND_PID
