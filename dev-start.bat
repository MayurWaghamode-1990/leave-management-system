@echo off
echo Starting Leave Management System Development Environment...
echo.

:: Kill any existing processes on our ports
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /PID %%a /F >nul 2>&1

echo.
echo Starting Backend Server (Port 3001)...
start "LMS Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 >nul

echo Starting Frontend Server (Port 5173)...
start "LMS Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===============================================
echo Leave Management System Development Started
echo ===============================================
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:3001/api/v1/docs
echo ===============================================
echo.
echo Press any key to stop all servers...
pause >nul

echo Stopping servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /PID %%a /F >nul 2>&1
echo Servers stopped.