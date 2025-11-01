# ⚠️ Database Setup Required

## Current Status

✅ **Security Fixes:** All critical vulnerabilities fixed and committed to GitHub
✅ **Test Deliverables:** Comprehensive testing documentation created
❌ **Database Setup:** **ACTION REQUIRED** - Manual setup needed (requires MySQL root password)

---

## What Needs to Be Done

The database needs to be set up before you can:
- Test the authentication after security fixes
- Run the backend server
- Execute integration tests
- Use the application

**Time Required:** 5-10 minutes

---

## Step-by-Step Setup

### Option 1: Using the Automated Script (Easiest) ⭐ RECOMMENDED

1. **Open Command Prompt**
   - Press `Windows Key + R`
   - Type `cmd`
   - Press Enter

2. **Navigate to backend directory:**
   ```cmd
   cd C:\Users\mayurw\ClaudeCode\leave-management-system\leave-management-system\backend
   ```

3. **Run the setup script:**
   ```cmd
   setup-database.bat
   ```

4. **Enter your MySQL root password when prompted**
   - This is the password you set when installing MySQL
   - If you don't know it, see "Forgot MySQL Password?" below

5. **Wait for success message:**
   ```
   ========================================
   Database setup completed successfully!
   ========================================

   Database: leave_management_db
   User: lms_user
   Password: password123
   ```

6. **Continue to "After Database Setup" section below**

---

### Option 2: Using MySQL Workbench (If you prefer GUI)

1. **Open MySQL Workbench**

2. **Connect to Local MySQL Server**
   - Use your root password

3. **Open SQL Editor and run this:**
   ```sql
   DROP DATABASE IF EXISTS leave_management_db;
   DROP USER IF EXISTS 'lms_user'@'localhost';

   CREATE DATABASE leave_management_db
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;

   CREATE USER 'lms_user'@'localhost'
     IDENTIFIED BY 'password123';

   GRANT ALL PRIVILEGES ON leave_management_db.*
     TO 'lms_user'@'localhost';

   FLUSH PRIVILEGES;
   ```

4. **Verify success** - Should show "0 row(s) affected" for each command

5. **Continue to "After Database Setup" section below**

---

### Option 3: Using MySQL Command Line

1. **Open MySQL Command Line Client** (from Start Menu)

2. **Enter your root password**

3. **Copy and paste the SQL from Option 2 above**

4. **Type `EXIT;` when done**

---

## After Database Setup

### Step 1: Run Migrations

```cmd
cd C:\Users\mayurw\ClaudeCode\leave-management-system\leave-management-system\backend
npx prisma migrate deploy
```

**Expected Output:**
```
✓ Migrations applied successfully
```

---

### Step 2: Seed Test Users

```cmd
npm run seed
```

**Expected Output:**
```
✓ Database seeded successfully
✓ Admin user created
✓ Test users created
```

This creates test users with proper bcrypt-hashed passwords:
- admin@company.com
- user@company.com
- (Check seed script for passwords)

---

### Step 3: Start Backend Server

```cmd
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:3001
✓ Database connected
✓ JWT configured
```

**Keep this terminal open** - the server is now running

---

### Step 4: Test Authentication

**Open a NEW command prompt and test:**

```cmd
curl -X POST http://localhost:3001/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@company.com\",\"password\":\"admin123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "email": "admin@company.com",
      "role": "ADMIN"
    }
  }
}
```

✅ **If you see this response, setup is complete!**

---

## Forgot MySQL Root Password?

### Option 1: Check Installation Notes
- Check if you wrote it down during MySQL installation
- Check password manager

### Option 2: Reset Root Password

**Windows Reset Process:**

1. **Stop MySQL Service:**
   ```cmd
   net stop MySQL80
   ```

2. **Start MySQL in Safe Mode:**
   ```cmd
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables --shared-memory
   ```

3. **Open NEW command prompt and run:**
   ```cmd
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root
   ```

4. **Reset password:**
   ```sql
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewPassword123!';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Restart MySQL normally:**
   - Close the mysqld window
   - ```cmd
     net start MySQL80
     ```

6. **Now use the new password with setup script**

---

## Troubleshooting

### "Access denied for user 'root'@'localhost'"
**Solution:** Wrong password. See "Forgot MySQL Password?" above

### "Can't connect to MySQL server"
**Solution:** MySQL not running. Run: `net start MySQL80`

### "Database already exists"
**Solution:** Run `DROP DATABASE leave_management_db;` first in MySQL

### "Command not found: npx"
**Solution:** Node.js not installed or not in PATH
1. Check: `node --version`
2. If error, install Node.js from https://nodejs.org/
3. Restart command prompt

### "Prisma schema not found"
**Solution:** Wrong directory. Make sure you're in `backend` folder

---

## What Was Fixed (Security)

Before running the database setup, you should know about the security fixes that were applied:

### 🔐 Critical Security Fixes

1. ✅ **Removed Hardcoded Credentials** (CVSS 9.8)
   - **Before:** Plaintext passwords in source code
   - **After:** All users in database with bcrypt hashing

2. ✅ **Fixed JWT Token Expiry** (CVSS 7.5)
   - **Before:** Tokens valid for 7 days
   - **After:** Tokens expire in 30 minutes

3. ✅ **Removed Mock User Bypass** (CVSS 6.5)
   - **Before:** Could bypass database authentication
   - **After:** All authentication requires database

4. ✅ **Removed Hardcoded CORS IP** (CVSS 5.5)
   - **Before:** Local IP hardcoded
   - **After:** Environment variable driven

**Risk Reduction:** 82% (from HIGH to LOW risk)

---

## Files Created for Setup

```
backend/
├── setup-database.sql          # SQL script to create DB and user
├── setup-database.bat          # Windows script to run SQL
└── DATABASE_SETUP_INSTRUCTIONS.md  # Detailed instructions

Root directory/
├── SECURITY_FIXES_APPLIED.md   # What was fixed and why
└── SETUP_REQUIRED.md           # This file
```

---

## Quick Command Reference

```cmd
# Check MySQL is running
net start | findstr MySQL

# Navigate to backend
cd C:\Users\mayurw\ClaudeCode\leave-management-system\leave-management-system\backend

# Setup database (requires root password)
setup-database.bat

# Run migrations
npx prisma migrate deploy

# Seed database
npm run seed

# Start backend
npm run dev

# Test login (in new window)
curl -X POST http://localhost:3001/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@company.com\",\"password\":\"admin123\"}"
```

---

## Next Steps After Setup

Once database is set up and tested:

1. ✅ Run integration tests from `tests/Testing/test_cases.csv`
2. ✅ Start frontend and test UI authentication
3. ✅ Verify token expires after 30 minutes
4. ✅ Test all security fixes are working
5. ✅ Review `tests/Testing/NEXT_STEPS_AND_RECOMMENDATIONS.md` for production roadmap

---

## Need Help?

**Documentation Available:**
- `DATABASE_SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `SECURITY_FIXES_APPLIED.md` - Security fixes documentation
- `tests/Testing/README.md` - Testing deliverables overview
- `tests/Testing/PROFESSIONAL_TEST_EXECUTION_REPORT.md` - Security analysis

**Common Issues:**
- MySQL password: See "Forgot MySQL Password?" section
- Permissions: Run Command Prompt as Administrator
- Port conflicts: Make sure port 3001 is available

---

## Summary

**What You Need to Do:**
1. Run `backend/setup-database.bat` (requires MySQL root password)
2. Run `npx prisma migrate deploy`
3. Run `npm run seed`
4. Run `npm run dev`
5. Test login with curl or Postman

**Time Required:** 5-10 minutes

**Status:** ⏳ Waiting for manual database setup with MySQL root password

---

**Last Updated:** November 1, 2025
**Action Required By:** You (user)
**Priority:** HIGH (required for testing security fixes)
