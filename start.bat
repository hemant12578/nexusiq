@echo off
title NexusIQ Production Launcher
echo ========================================================
echo   NexusIQ — Multi-Modal Compliance Intelligence Platform
echo ========================================================
echo.
echo Launching Backend FastAPI Server (Port 8000)...
start "NexusIQ Backend API" cmd /k "cd backend && py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Launching Frontend Development Server (Port 5173)...
start "NexusIQ Frontend Workspace" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   NexusIQ Services Active:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:8000
echo ========================================================
