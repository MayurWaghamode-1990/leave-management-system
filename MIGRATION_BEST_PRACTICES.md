# Prisma Migration Best Practices for Leave Management System

## Why Prisma is Perfect for This Project

Your Leave Management System is well-architected with Prisma. Here's how to maximize its potential:

## Current Migration Commands

```bash
# Create a new migration
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

## Best Practices to Follow

### 1. **Always Create Named Migrations**
```bash
cd backend
npx prisma migrate dev --name add_employee_status_field
```

### 2. **Review Migration Files Before Applying**
Location: `backend/prisma/migrations/`
- Check the SQL generated
- Ensure no data loss
- Verify indexes are created

### 3. **Production Migration Strategy**
```bash
# Don't use migrate dev in production
# Instead use:
npx prisma migrate deploy
```

### 4. **Backup Before Major Changes**
```bash
# For MySQL
mysqldump -u root -p lms_db > backup_$(date +%Y%m%d).sql

# For SQLite
cp backend/prisma/dev.db backend/prisma/dev_backup_$(date +%Y%m%d).db
```

### 5. **Migration Versioning in Git**
- ✅ Always commit migration files
- ✅ Never modify existing migrations
- ✅ Create new migrations for changes

### 6. **Testing Migrations**
```bash
# Test on development database
npm run db:migrate

# Verify with Prisma Studio
npm run db:studio

# Test with seed data
npm run db:seed
```

## Migration Workflow

### Adding a New Field

1. **Update Prisma Schema**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  // Add new field
  phoneNumber String?
}
```

2. **Create Migration**
```bash
npx prisma migrate dev --name add_phone_number_to_users
```

3. **Generate Client**
```bash
npx prisma generate
```

4. **Update Backend Code**
```typescript
// Now TypeScript knows about phoneNumber
const user = await prisma.user.create({
  data: {
    email: "test@example.com",
    phoneNumber: "+1234567890" // ✅ Type-safe
  }
})
```

## Advantages Over Liquibase

### 1. Type Safety
```typescript
// Prisma - Fully type-safe
const user = await prisma.user.findUnique({
  where: { email: "test@example.com" }
}) // TypeScript knows exact return type

// With Liquibase + raw SQL - No type safety
const user = await db.query("SELECT * FROM users WHERE email = ?", [email])
// Returns 'any' - no type checking
```

### 2. Auto-generated Client
- Prisma generates TypeScript types automatically
- No manual typing required
- Reduces bugs

### 3. Developer Experience
```typescript
// Prisma - Clean and intuitive
await prisma.leaveRequest.create({
  data: {
    employee: { connect: { id: userId } },
    leaveType: "CASUAL",
    startDate: new Date(),
    endDate: new Date()
  }
})

// Raw SQL (Liquibase approach) - Error-prone
await db.query(`
  INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date)
  VALUES (?, ?, ?, ?)
`, [userId, "CASUAL", startDate, endDate])
```

## Monitoring Migrations

### Check Migration Status
```bash
npx prisma migrate status
```

### View Migration History
```bash
# Check migrations folder
ls backend/prisma/migrations/
```

### Rollback (if needed)
```bash
# Prisma doesn't have direct rollback
# Instead: Create a new migration to undo changes
npx prisma migrate dev --name revert_previous_change
```

## Environment-Specific Migrations

### Development
```env
DATABASE_URL="file:./dev.db"
```

### Production
```env
DATABASE_URL="mysql://user:password@host:3306/database"
```

### Migration Commands by Environment

**Development:**
```bash
npx prisma migrate dev
```

**Production:**
```bash
npx prisma migrate deploy  # No prompts, just applies
```

## Common Migration Scenarios

### 1. Adding a Required Field
```prisma
model User {
  id          String   @id
  newField    String   @default("default_value") // Set default
}
```

### 2. Renaming a Field
```bash
# Prisma handles this, but data preserved
npx prisma migrate dev --name rename_field
```

### 3. Adding Relations
```prisma
model LeaveRequest {
  id         String @id
  employee   User   @relation(fields: [employeeId], references: [id])
  employeeId String
}
```

### 4. Adding Indexes
```prisma
model LeaveRequest {
  @@index([status])
  @@index([employeeId, status])
}
```

## When to Create Migrations

✅ **DO create migrations for:**
- Schema changes
- New tables/models
- Field additions/modifications
- Index changes
- Constraint changes

❌ **DON'T create migrations for:**
- Data seeding (use seed scripts)
- Configuration changes
- Environment variables

## Troubleshooting

### Migration Failed
```bash
# Reset development database
npx prisma migrate reset

# This will:
# 1. Drop database
# 2. Recreate database
# 3. Apply all migrations
# 4. Run seed script
```

### Schema Drift Detected
```bash
# Compare schema with database
npx prisma migrate diff

# Create migration to sync
npx prisma migrate dev
```

### Out of Sync
```bash
# Force sync (development only)
npx prisma db push
```

## Conclusion

**Prisma > Liquibase for this project because:**
1. ✅ Type safety with TypeScript
2. ✅ Simpler developer experience
3. ✅ Better Node.js integration
4. ✅ Automatic type generation
5. ✅ Already working perfectly
6. ✅ Modern tooling and community

**Stay with Prisma!** It's the right choice for your Leave Management System.
