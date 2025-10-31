# Quick Start Guide - Phase 3.3 Deployment

**Date:** 2025-11-01
**Status:** ⚠️ Requires Docker Desktop to be running

---

## Current Situation

✅ **Phase 3.3 code is 100% complete:**
- Backend services (USA PTO automation + analytics)
- Frontend components (widgets + pages)
- Database schema ready
- Seed scripts ready
- Documentation complete

⏸️ **Blocked by:** Docker Desktop not running

---

## What You Need to Do

### Step 1: Start Docker Desktop

1. **Open Docker Desktop** application on Windows
2. **Wait** for Docker to fully start (whale icon should be steady in system tray)
3. **Verify** Docker is running:
   ```bash
   docker ps
   ```
   Should show: `CONTAINER ID   IMAGE ...` (empty list is ok)

### Step 2: Start MySQL Container

Once Docker is running:

```bash
# Start MySQL and Redis containers
docker-compose up -d mysql redis
```

**Expected Output:**
```
✔ Container lms-mysql   Started
✔ Container lms-redis   Started
```

**Verify containers are running:**
```bash
docker ps
```

Should show `lms-mysql` and `lms-redis` containers.

### Step 3: Apply Database Migrations

```bash
cd backend

# Apply Phase 3.3 migrations (creates 7 new tables)
npx prisma migrate dev --name add_usa_pto_and_analytics
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ The following migration(s) have been applied:

migrations/
  └─ 20251101_add_usa_pto_and_analytics/
      └─ migration.sql

✔ Database schema is in sync
```

### Step 4: Seed USA PTO Policies

```bash
# Still in backend directory
npx tsx src/scripts/seed-usa-pto-policies.ts
```

**Expected Output:**
```
[USA PTO] Seed started...
[USA PTO] Created policy for VP: 25 days
[USA PTO] Created policy for AVP: 20 days
[USA PTO] Created policy for SENIOR_MANAGER: 18 days
[USA PTO] Created policy for MANAGER: 15 days
[USA PTO] Created policy for SENIOR_ENGINEER: 15 days
[USA PTO] Created policy for ENGINEER: 12 days
[USA PTO] Created policy for JUNIOR_ENGINEER: 10 days
[USA PTO] Seed completed successfully!
[USA PTO] Created 7 PTO policies
```

### Step 5: Verify Database

```bash
# Open Prisma Studio to view data
npx prisma studio
```

**What to Check:**
1. Browser opens at `http://localhost:5555`
2. Verify 7 new tables exist:
   - `usa_pto_policies` (should have 7 records)
   - `usa_pto_accruals` (empty)
   - `usa_pto_carry_forwards` (empty)
   - `leave_analytics` (empty)
   - `department_leave_stats` (empty)
   - `leave_pattern_analysis` (empty)
   - `team_availability_forecasts` (empty)

### Step 6: Start Backend Server

```bash
# Still in backend directory
npm run dev
```

**Expected Output:**
```
[USA PTO] Scheduler initialized
[USA PTO] Annual accrual job scheduled: 0 0 1 1 *
[USA PTO] Carry-forward job scheduled: 59 23 31 12 *
[USA PTO] Q1 expiry job scheduled: 0 0 1 4 *
Server running on port 3001
```

### Step 7: Test API Endpoints

In a new terminal:

```bash
# Test PTO policies endpoint
curl http://localhost:3001/api/v1/usa-pto/policies
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "designation": "VP",
      "annualPtoDays": 25,
      "maxCarryForward": 5,
      "carryForwardExpiry": 90,
      "proRataCalculation": true,
      "isActive": true
    }
    // ... 6 more policies
  ]
}
```

---

## Database Configuration

✅ **Already configured** in `backend/.env`:

```env
DATABASE_URL="mysql://lms_user:password123@localhost:3306/leave_management_db"
```

These credentials match the Docker Compose configuration:
- **User:** lms_user
- **Password:** password123
- **Database:** leave_management_db
- **Port:** 3306

---

## What Phase 3.3 Adds

### New Database Tables (7)

#### USA PTO System (3 tables)
1. **usa_pto_policies** - Designation-based PTO allocations
   - VP: 25 days, AVP: 20 days, Manager: 15 days, etc.
2. **usa_pto_accruals** - Annual PTO accrual tracking
   - Handles pro-rata calculations for mid-year joiners
3. **usa_pto_carry_forwards** - Year-end carry-forward management
   - Max 5 days, expires March 31st (Q1)

#### Analytics System (4 tables)
4. **leave_analytics** - Comprehensive leave statistics
5. **department_leave_stats** - Department-level aggregations
6. **leave_pattern_analysis** - Pattern detection and trends
7. **team_availability_forecasts** - Predictive availability

### Automated Cron Jobs (3)

1. **Annual Accrual** - January 1st at 12:00 AM
   - Assigns annual PTO to all USA employees
   - Pro-rates for mid-year joiners

2. **Carry-Forward** - December 31st at 11:59 PM
   - Moves unused PTO to next year (max 5 days)
   - Creates carry-forward records

3. **Expiry Check** - April 1st at 12:00 AM
   - Expires carry-forward balances after Q1
   - Sends expiry notifications

### API Endpoints Added

**USA PTO:**
- `GET /api/v1/usa-pto/policies` - List all PTO policies
- `GET /api/v1/usa-pto/balance` - Get employee balance
- `GET /api/v1/usa-pto/report` - Detailed employee report
- `POST /api/v1/usa-pto/accrual/trigger` - Manual accrual (Admin)
- `POST /api/v1/usa-pto/carry-forward/trigger` - Manual carry-forward (Admin)
- `POST /api/v1/usa-pto/expiry/trigger` - Manual expiry check (Admin)

**Advanced Analytics:**
- `GET /api/v1/advanced-reporting/department-trends`
- `GET /api/v1/advanced-reporting/absenteeism-rate`
- `GET /api/v1/advanced-reporting/leave-patterns`
- `GET /api/v1/advanced-reporting/team-availability-forecast`

### Frontend Components Added

**Employee View:**
1. **UsaPtoBalanceWidget** - Dashboard widget showing PTO balance
2. **UsaPtoReportPage** - Detailed PTO report with 3 tabs:
   - Accrual Breakdown
   - Carry-Forward Details
   - Leave History

**Admin View:**
3. **UsaPtoManagementPage** - System management dashboard:
   - System status cards
   - Manual trigger controls
   - 3 data tables (Accruals, Carry-Forwards, Policies)

---

## Troubleshooting

### Issue 1: Docker Desktop Not Starting

**Symptoms:**
```
error during connect: ... open //./pipe/docker_engine: The system cannot find the file specified
```

**Solution:**
1. Open Docker Desktop manually
2. Wait for full startup (30-60 seconds)
3. Check system tray for Docker whale icon
4. Retry `docker ps`

### Issue 2: Port 3306 Already in Use

**Symptoms:**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Check what's using port 3306
netstat -ano | findstr :3306

# Stop existing MySQL container or local MySQL service
docker stop lms-mysql
```

### Issue 3: Prisma Migration Fails

**Symptoms:**
```
P1000: Authentication failed
```

**Solution:**
1. Verify Docker containers are running: `docker ps`
2. Check `.env` has correct credentials
3. Wait 10 seconds for MySQL to fully initialize
4. Retry migration

### Issue 4: Seed Script Fails

**Symptoms:**
```
Unique constraint failed on the fields: (`designation`)
```

**Solution:**
Policies already seeded. To reset:
```bash
# Connect to MySQL
docker exec -it lms-mysql mysql -u lms_user -ppassword123 leave_management_db

# Drop and re-seed
DELETE FROM usa_pto_policies;
exit

# Re-run seed
npx tsx src/scripts/seed-usa-pto-policies.ts
```

---

## Quick Command Reference

```bash
# Start Docker services
docker-compose up -d mysql redis

# Check Docker containers
docker ps

# Apply migrations
cd backend
npx prisma migrate dev --name add_usa_pto_and_analytics

# Generate Prisma Client
npx prisma generate

# Seed PTO policies
npx tsx src/scripts/seed-usa-pto-policies.ts

# Open Prisma Studio
npx prisma studio

# Start backend
npm run dev

# Stop Docker services (when done)
docker-compose down

# Stop and remove volumes (full cleanup)
docker-compose down -v
```

---

## Verification Checklist

After completing all steps, verify:

- [ ] Docker Desktop is running
- [ ] MySQL container is running (`docker ps` shows `lms-mysql`)
- [ ] Redis container is running (`docker ps` shows `lms-redis`)
- [ ] Migrations applied successfully (7 new tables created)
- [ ] Seed script ran (7 PTO policies in database)
- [ ] Backend server started (shows scheduler initialization)
- [ ] API endpoint responds (curl test returns JSON)
- [ ] Prisma Studio shows all tables

---

## Next Steps After Setup

Once setup is complete:

1. **Test with USA employee:**
   - Login as user with `country='USA'`
   - Visit dashboard to see USA PTO Balance Widget
   - Visit `/pto-report` to see detailed report

2. **Test Admin features:**
   - Login as HR_ADMIN
   - Visit `/admin/usa-pto-management`
   - Trigger manual accrual for testing

3. **Integration testing:**
   - Create leave request as USA employee
   - Verify PTO balance decreases
   - Check approval workflow
   - Verify calendar sync

4. **Production deployment:**
   - See `PHASE_3_DEPLOYMENT_GUIDE.md` for full production guide
   - Update production `.env` with real credentials
   - Schedule deployment for January 1st (for annual accrual)

---

## Support Documentation

- **Implementation Details:** `PHASE_3.3_IMPLEMENTATION_COMPLETE.md`
- **Frontend Guide:** `USA_PTO_FRONTEND_GUIDE.md`
- **Full Deployment:** `PHASE_3_DEPLOYMENT_GUIDE.md`
- **Integration Verification:** `PHASE_3_INTEGRATION_VERIFICATION.md`

---

## Summary

**Current Status:** ✅ Code Complete, ⏸️ Awaiting Docker

**To Complete Setup:**
1. Start Docker Desktop (← **YOU ARE HERE**)
2. Run 6 commands (takes ~5 minutes)
3. Verify and test

**Total Setup Time:** ~10 minutes (after Docker starts)

**What You'll Have:**
- ✅ USA PTO automation system
- ✅ 7 designation-based PTO policies
- ✅ 3 automated cron jobs (Jan 1, Dec 31, Apr 1)
- ✅ 6+ new API endpoints
- ✅ 4 new React components
- ✅ Complete analytics infrastructure

---

**Last Updated:** 2025-11-01
**Phase:** 3.3
**Status:** Ready for Docker startup
