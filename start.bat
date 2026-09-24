@echo off
echo ========================================================
echo Starting GeneGuard Multi-Disease Health AI Platform...
echo ========================================================

echo [1/2] Launching Flask Backend API Server on http://localhost:5000...
start "GeneGuard Backend API" cmd /k "cd backend && python app.py"

echo [2/2] Launching Vite Frontend on http://localhost:5173...
start "GeneGuard Frontend" cmd /k "cd frontend && npm run dev"

echo ========================================================
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo ========================================================
pause
