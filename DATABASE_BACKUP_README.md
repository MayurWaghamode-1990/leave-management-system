# Database Backup Instructions

## Current Database: MySQL
- **Database Name**: `leave_management_system`
- **User**: root
- **Port**: 3306

## Database Schema
The database schema is defined in `backend/prisma/schema.prisma` and is version controlled in Git.

## How to Export Database

### Option 1: Using the Export Script (Windows)
```bash
cd backend/scripts
export-database.bat
```

### Option 2: Manual Export with mysqldump
```bash
"C:\Program Files\MySQL\MySQL Server 9.1\bin\mysqldump.exe" -u root -pMayur@123 leave_management_system > backup.sql
```

### Option 3: Using Prisma
```bash
cd backend
npx prisma db pull  # Update schema from database
npx prisma db push  # Push schema to new database
```

## How to Restore Database

### From SQL Backup
```bash
mysql -u root -pMayur@123 leave_management_system < backup.sql
```

### Using Prisma (Fresh Setup)
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed  # If seed script exists
```

## Database Structure

The database includes the following main tables:
- `users` - Employee and user information
- `leave_requests` - Leave applications
- `leave_balances` - Leave balance tracking
- `leave_policies` - Leave policies and rules
- `holidays` - Public holidays
- `approvals` - Leave approval workflow
- `comp_off_requests` - Compensatory off requests
- `notifications` - System notifications
- `audit_logs` - System audit trail

## Current Database State
- Database is actively used by the application
- Schema version: As defined in Prisma schema
- Last updated: 2025-10-27
