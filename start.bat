@echo off
title Maintena AI Launcher
echo ========================================================
echo   Starting Maintena AI - Predictive Maintenance System
echo ========================================================
echo.

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000...
start "FastAPI Backend - Port 8000" cmd /k "python -m uvicorn main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Development Server on http://localhost:5173...
start "Frontend Dev Server - Port 5173" cmd /k "npm run dev"

echo.
echo ========================================================
echo  Both servers have been launched in separate windows!
echo  Open your browser at: http://localhost:5173
echo ========================================================
echo.
pause
