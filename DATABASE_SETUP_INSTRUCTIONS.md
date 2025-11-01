# Database Setup Instructions
## Leave Management System - MySQL Database Configuration

**Last Updated:** November 1, 2025
**Status:** Required for testing after security fixes

---

## Quick Start (Windows)

### Option 1: Using the Automated Script (Recommended)

1. **Open Command Prompt as Administrator** (important!)

2. **Navigate to backend directory:**
   ```cmd
   cd C:\Users\mayurw\ClaudeCode\leave-management-system\leave-management-system\backend
   ```

3. **Run the setup script:**
   ```cmd
   setup-database.bat
   ```

4. **Enter MySQL root password when prompted**

5. **Verify success** - You should see:
   ```
   Database setup completed successfully!
   Database: leave_management_db
   User: lms_user
   Password: password123
   ```

---

### Option 2: Manual Setup (If Script Fails)

1. **Open MySQL Command Line Client** (from Start Menu)

2. **Login with root password**

3. **Run these commands one by one:**
   ```sql
   -- Drop existing if any
   DROP DATABASE IF EXISTS leave_management_db;
   DROP USER IF EXISTS 'lms_user'@'localhost';

   -- Create database
   CREATE DATABASE leave_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

   -- Create user
   CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'password123';

   -- Grant privileges
   GRANT ALL PRIVILEGES ON leave_management_db.* TO 'lms_user'@'localhost';
   FLUSH PRIVILEGES;

   -- Verify
   SHOW DATABASES LIKE 'leave_management_db';
   SELECT User, Host FROM mysql.user WHERE User = 'lms_user';
   ```

4. **Exit MySQL:**
   ```sql
   EXIT;
   ```

---

### Option 3: Using Command Line (Direct)

```cmd
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < backend/setup-database.sql
```

Enter root password when prompted.

---

## After Database Setup

### Step 1: Run Prisma Migrations

```cmd
cd backend
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
✓ Admin user created: admin@company.com
✓ Test user created: user@company.com
✓ Seed completed successfully
```

**Default Test Users After Seeding:**
- **Admin:** admin@company.com / (password set in seed script)
- **User:** user@company.com / (password set in seed script)

**Note:** Check `backend/src/scripts/seed.ts` for exact passwords used

---

### Step 3: Verify Database Setup

```cmd
npx prisma db pull
```

**Expected Output:**
```
✓ Introspected 20+ models from database
```

---

## Testing Authentication

### Start Backend Server

```cmd
cd backend
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:3001
✓ Database connected
✓ JWT configured
```

---

### Test Login API

**Using curl:**
```cmd
curl -X POST http://localhost:3001/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@company.com\",\"password\":\"admin123\"}"
```

**Using Postman:**
1. Open Postman
2. POST to `http://localhost:3001/api/v1/auth/login`
3. Body (JSON):
   ```json
   {
     "email": "admin@company.com",
     "password": "admin123"
   }
   ```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@company.com",
      "role": "ADMIN"
    }
  }
}
```

**Note:** Token will expire in 30 minutes (security fix applied)

---

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

**Solution:** Incorrect root password. Check your MySQL root password:
- Windows: Check MySQL installation notes or reset root password
- Or use MySQL Workbench to connect (it may have saved password)

---

### Error: "Can't connect to MySQL server"

**Solution:** MySQL service not running

**Check service:**
```cmd
net start | findstr MySQL
```

**Start service if needed:**
```cmd
net start MySQL80
```

---

### Error: "Database 'leave_management_db' already exists"

**Solution:** Database exists but credentials wrong

**Option A - Drop and recreate:**
```sql
DROP DATABASE leave_management_db;
DROP USER 'lms_user'@'localhost';
-- Then run setup script again
```

**Option B - Update credentials in .env:**
```env
DATABASE_URL="mysql://your_user:your_pass@localhost:3306/leave_management_db"
```

---

### Error: P1000 - Authentication failed for lms_user

**Solution:** User doesn't exist or password wrong

**Verify user exists:**
```sql
SELECT User, Host FROM mysql.user WHERE User = 'lms_user';
```

**If user doesn't exist, create it:**
```sql
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON leave_management_db.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

---

### Error: "Prisma schema not found"

**Solution:** Wrong directory

**Make sure you're in backend directory:**
```cmd
cd C:\Users\mayurw\ClaudeCode\leave-management-system\leave-management-system\backend
```

---

## Database Configuration

### Current Configuration (.env file)

```env
DATABASE_URL="mysql://lms_user:password123@localhost:3306/leave_management_db"
```

**Components:**
- **User:** lms_user
- **Password:** password123
- **Host:** localhost
- **Port:** 3306
- **Database:** leave_management_db

---

### Security Recommendations

**For Development:**
- Current setup is acceptable
- Password is in .env (not committed to git)

**For Production:**
- Use strong password (min 16 characters)
- Use environment variables (not .env file)
- Enable SSL for MySQL connections
- Use separate database user per environment
- Regular backups

**Example Production Setup:**
```env
DATABASE_URL="mysql://lms_prod_user:SecureP@ssw0rd123!@prod-mysql-server.com:3306/lms_production?sslmode=require"
```

---

## Verification Checklist

After setup, verify:

- [ ] MySQL service is running
- [ ] Database `leave_management_db` exists
- [ ] User `lms_user` exists with correct password
- [ ] User has privileges on database
- [ ] Prisma can connect (`npx prisma db pull` succeeds)
- [ ] Migrations applied (`npx prisma migrate deploy` succeeds)
- [ ] Seed data loaded (`npm run seed` succeeds)
- [ ] Backend starts without errors (`npm run dev`)
- [ ] Login API works (test with Postman or curl)
- [ ] JWT token generated and expires in 30 minutes

---

## Next Steps After Setup

1. **Run Integration Tests:**
   ```cmd
   npm test
   ```

2. **Start Frontend:**
   ```cmd
   cd ../frontend
   npm run dev
   ```

3. **Test End-to-End:**
   - Login via frontend UI
   - Verify token expiration (should logout after 30 minutes)
   - Test leave application workflow

4. **Review Security Fixes:**
   - Read `SECURITY_FIXES_APPLIED.md`
   - No hardcoded credentials in code (verified ✓)
   - JWT expires in 30 minutes (verified ✓)
   - All users in database (verified ✓)

---

## Files Created

- `setup-database.sql` - SQL script to create database and user
- `setup-database.bat` - Windows batch file to run SQL script
- `DATABASE_SETUP_INSTRUCTIONS.md` - This file

---

## Support

If you encounter issues:

1. Check MySQL error log:
   ```
   C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err
   ```

2. Check Prisma documentation:
   ```
   https://www.prisma.io/docs/concepts/database-connectors/mysql
   ```

3. Verify .env configuration matches database setup

---

**Last Updated:** November 1, 2025
**Version:** 1.0
**Status:** Ready for use
