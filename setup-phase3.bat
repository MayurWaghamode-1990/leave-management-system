@echo off
REM Phase 3.3 Automated Setup Script (Windows)
REM This script automates the deployment of Phase 3.3 (USA PTO + Analytics)

setlocal enabledelayedexpansion

echo ==================================================
echo   Phase 3.3 Setup Script
echo   USA PTO Automation + Advanced Analytics
echo ==================================================
echo.

REM Step 1: Check Docker
echo [Step 1] Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running or not accessible
    echo [WARNING] Please start Docker Desktop and try again
    pause
    exit /b 1
)
echo [SUCCESS] Docker is running
echo.

REM Step 2: Start containers
echo [Step 2] Starting MySQL and Redis containers...
echo This may take 30-60 seconds for first-time setup...
docker-compose up -d mysql redis
if errorlevel 1 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)

REM Wait for MySQL to be ready
echo Waiting for MySQL to initialize...
set RETRY=0
:wait_mysql
docker exec lms-mysql mysqladmin ping -h localhost --silent >nul 2>&1
if errorlevel 1 (
    set /a RETRY+=1
    if !RETRY! GEQ 30 (
        echo [ERROR] MySQL failed to start after 30 attempts
        pause
        exit /b 1
    )
    echo ...waiting (attempt !RETRY!/30)
    timeout /t 2 /nobreak >nul
    goto wait_mysql
)
echo [SUCCESS] MySQL is ready
echo.

REM Step 3: Generate Prisma Client
echo [Step 3] Generating Prisma Client...
cd backend
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] Failed to generate Prisma Client
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] Prisma Client generated
echo.

REM Step 4: Apply migrations
echo [Step 4] Applying database migrations...
echo Creating 7 new tables for Phase 3.3...
call npx prisma migrate dev --name add_usa_pto_and_analytics --skip-generate
if errorlevel 1 (
    echo [ERROR] Failed to apply migrations
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] Migrations applied successfully
echo.

REM Step 5: Seed USA PTO policies
echo [Step 5] Seeding USA PTO policies...
call npx tsx src/scripts/seed-usa-pto-policies.ts
if errorlevel 1 (
    echo [ERROR] Failed to seed PTO policies
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] USA PTO policies seeded
echo.

REM Step 6: Verify database
echo [Step 6] Verifying database...
docker exec lms-mysql mysql -u lms_user -ppassword123 leave_management_db -se "SELECT COUNT(*) FROM usa_pto_policies;" > temp_count.txt
set /p POLICY_COUNT=<temp_count.txt
del temp_count.txt
echo [SUCCESS] Found %POLICY_COUNT% PTO policies in database
echo.

cd ..

echo ==================================================
echo [SUCCESS] Phase 3.3 Setup Complete!
echo ==================================================
echo.
echo Summary:
echo   - MySQL and Redis containers running
echo   - 7 new database tables created
echo   - %POLICY_COUNT% USA PTO policies seeded
echo   - Prisma Client generated
echo.
echo Next Steps:
echo   1. Start backend server:
echo      cd backend ^&^& npm run dev
echo.
echo   2. Test API endpoint:
echo      curl http://localhost:3001/api/v1/usa-pto/policies
echo.
echo   3. Open Prisma Studio to view data:
echo      cd backend ^&^& npx prisma studio
echo.
echo   4. View frontend:
echo      - Employee: Visit /pto-report (USA employees only)
echo      - Admin: Visit /admin/usa-pto-management
echo.
echo Documentation:
echo   - Quick Start: QUICK_START_PHASE_3.md
echo   - Full Guide: PHASE_3_DEPLOYMENT_GUIDE.md
echo   - Implementation: PHASE_3.3_IMPLEMENTATION_COMPLETE.md
echo.
echo [SUCCESS] Phase 3.3 is ready to use!
echo.
pause
