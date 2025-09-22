# MySQL Database Setup for Leave Management System

## Prerequisites

1. **Install MySQL** (version 8.0 or higher)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or install via package manager:
     ```bash
     # Windows (using Chocolatey)
     choco install mysql

     # macOS (using Homebrew)
     brew install mysql

     # Ubuntu/Debian
     sudo apt update
     sudo apt install mysql-server
     ```

2. **Start MySQL Service**
   ```bash
   # Windows
   net start mysql

   # macOS/Linux
   sudo systemctl start mysql
   # or
   brew services start mysql
   ```

## Database Setup Steps

### 1. Create Database and User

Connect to MySQL as root:
```bash
mysql -u root -p
```

Create database and user:
```sql
-- Create database
CREATE DATABASE leave_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (change password as needed)
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'password123';

-- Grant privileges
GRANT ALL PRIVILEGES ON leave_management_db.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 2. Verify Connection

Test the connection with the new user:
```bash
mysql -u lms_user -p leave_management_db
```

### 3. Update Environment Variables

Make sure your `.env` file in the backend directory has:
```env
DATABASE_URL="mysql://lms_user:password123@localhost:3306/leave_management_db"
```

### 4. Run Database Migration

In the backend directory:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Seed the database with initial data
npm run db:seed
```

### 5. Verify Setup

Check if tables were created:
```bash
mysql -u lms_user -p leave_management_db -e "SHOW TABLES;"
```

You should see tables like:
- users
- leave_requests
- leave_policies
- leave_balances
- approvals
- notifications
- holidays
- departments
- audit_logs

## Troubleshooting

### Common Issues:

1. **Connection refused**
   - Ensure MySQL service is running
   - Check if port 3306 is available

2. **Authentication plugin error**
   ```sql
   ALTER USER 'lms_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password123';
   ```

3. **Permission denied**
   - Make sure the user has proper privileges
   - Re-run the GRANT statement

### Check Database Status:
```bash
# Check MySQL service status
systemctl status mysql

# Check MySQL process
ps aux | grep mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

## Development Commands

```bash
# View database in browser
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name your_migration_name
```

## Production Considerations

1. **Security**:
   - Use strong passwords
   - Limit user privileges
   - Enable SSL connections
   - Configure firewall rules

2. **Performance**:
   - Configure proper MySQL settings
   - Set up connection pooling
   - Monitor query performance

3. **Backup**:
   - Set up automated backups
   - Test restore procedures
   - Configure binary logging

## Connection Pool Configuration

Add to your `.env` file for production:
```env
# Connection pool settings
DATABASE_URL="mysql://lms_user:password123@localhost:3306/leave_management_db?connection_limit=10&pool_timeout=20&socket_timeout=60"
```