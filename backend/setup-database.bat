@echo off
REM Leave Management System - Database Setup Script for Windows
REM This script sets up the MySQL database and user

echo ========================================
echo Leave Management System - Database Setup
echo ========================================
echo.
echo This script will:
echo 1. Create database: leave_management_db
echo 2. Create user: lms_user
echo 3. Grant necessary privileges
echo.
echo You will be prompted for MySQL root password
echo.
pause

REM Set MySQL path
set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe

REM Check if MySQL is accessible
if not exist "%MYSQL_PATH%" (
    echo ERROR: MySQL not found at %MYSQL_PATH%
    echo Please update MYSQL_PATH in this script with the correct path
    pause
    exit /b 1
)

echo.
echo Running database setup script...
echo Please enter MySQL root password when prompted:
echo.

"%MYSQL_PATH%" -u root -p < setup-database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database setup completed successfully!
    echo ========================================
    echo.
    echo Database: leave_management_db
    echo User: lms_user
    echo Password: password123
    echo.
    echo Next steps:
    echo 1. Run migrations: npx prisma migrate deploy
    echo 2. Seed database: npm run seed
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Database setup failed!
    echo ========================================
    echo.
    echo Please check:
    echo 1. MySQL root password is correct
    echo 2. MySQL service is running
    echo 3. You have root privileges
    echo.
)

pause
