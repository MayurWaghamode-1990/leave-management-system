# MySQL Integration Setup Guide

## 📋 Prerequisites

1. **MySQL Installation** (Choose one option):

### Option 1: MySQL Server Community Edition
- Download from: https://dev.mysql.com/downloads/mysql/
- Install MySQL Server 8.0 or later
- During installation, set root password (use: `password` to match current config)

### Option 2: XAMPP (Recommended for Development)
- Download from: https://www.apachefriends.org/
- Install XAMPP which includes MySQL
- Start MySQL service from XAMPP Control Panel

### Option 3: Docker (Advanced Users)
```bash
docker run --name mysql-lms -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 -d mysql:8.0
```

## 🛠️ Database Setup

### Step 1: Create Database
Connect to MySQL and create the database:

```sql
CREATE DATABASE leave_management_system;
```

### Step 2: Update Environment Configuration
Your `.env` file is already configured for MySQL:
```env
DATABASE_URL="mysql://root:password@localhost:3306/leave_management_system"
```

**Note**: Update the connection string if you use different credentials:
- `root` - MySQL username
- `password` - MySQL password
- `localhost:3306` - MySQL host and port
- `leave_management_system` - Database name

## 🚀 Migration Steps

### Step 1: Stop Running Services
Make sure no Node.js processes are using Prisma:
```bash
# Stop any running npm processes
# Close VS Code or any other applications using the project
```

### Step 2: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 3: Reset Database and Migrate
```bash
# Create the database schema
npx prisma db push

# Or use migrations (recommended for production)
npx prisma migrate dev --name init
```

### Step 4: Seed Database
```bash
npx prisma db seed
```

### Step 5: Start Services
```bash
# Start backend
npm run dev

# In another terminal, start frontend
cd ../frontend
npm run dev
```

## 🔄 Key Changes Made

### 1. Schema Updates
- **Provider**: Changed from `sqlite` to `mysql`
- **Enums**: Added proper MySQL enums for roles and status
- **Data Types**:
  - `Decimal` for precise financial calculations
  - `Json` for complex data structures
  - `@db.Text` for long text fields

### 2. Enhanced Data Types
```prisma
enum UserRole {
  EMPLOYEE
  MANAGER
  HR_ADMIN
  PAYROLL_OFFICER
  IT_ADMIN
}

model LeaveRequest {
  totalDays    Decimal    @db.Decimal(5,2)  // Precise decimal storage
  attachments  Json?                        // Native JSON support
  reason       String     @db.Text          // Long text storage
}
```

## 🧪 Testing the Migration

### Verify Database Connection
```bash
cd backend
npx prisma studio
```

### Test API Endpoints
1. Login: `POST http://localhost:3001/api/v1/auth/login`
   ```json
   {
     "email": "admin@company.com",
     "password": "password123"
   }
   ```

2. Get Users: `GET http://localhost:3001/api/v1/users`

### Check Frontend Integration
- Visit: http://localhost:5173
- Login with seeded credentials
- Test leave request functionality

## 🔍 Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: Start MySQL service
- XAMPP: Start MySQL in control panel
- Windows Service: Start MySQL80 service
- macOS: `brew services start mysql`

#### 2. Access Denied
```
Error: Access denied for user 'root'@'localhost'
```
**Solution**: Check credentials in DATABASE_URL

#### 3. Database Doesn't Exist
```
Error: Unknown database 'leave_management_system'
```
**Solution**: Create database manually:
```sql
CREATE DATABASE leave_management_system;
```

#### 4. Permission Issues with Prisma Generate
**Solution**:
1. Close all applications using the project
2. Run as Administrator (Windows)
3. Clear node_modules and reinstall if needed

## 📊 Performance Benefits

### MySQL vs SQLite
- **Concurrent Users**: MySQL handles multiple users better
- **Data Integrity**: Strong ACID compliance
- **Scalability**: Better for production environments
- **Backup & Recovery**: Enterprise-grade tools
- **JSON Support**: Native JSON field type
- **Decimal Precision**: Accurate financial calculations

## 🔧 Production Considerations

### Security
- Change default passwords
- Use environment-specific credentials
- Enable SSL connections
- Configure firewall rules

### Performance
- Optimize indexes
- Configure MySQL settings
- Use connection pooling
- Monitor query performance

### Backup
- Set up automated backups
- Test restore procedures
- Use replication for high availability

## 📝 Next Steps

1. **Start MySQL Service**
2. **Run Prisma Migration**
3. **Seed Database**
4. **Test Application**
5. **Configure Production Settings**

Your Leave Management System is now configured for MySQL! 🎉