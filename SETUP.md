# Leave Management System - Developer Setup Guide

Complete setup instructions for new developers joining the project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Database Configuration](#database-configuration)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

Install the following software before beginning:

### Required Software

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Database**: MySQL 8.0+ OR SQLite (recommended for development)

### Recommended Tools

- **GitHub CLI** (`gh`) - [Install guide](https://cli.github.com/)
- **VS Code** - [Download](https://code.visualstudio.com/)

### Installation Commands

**Windows:**
```bash
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install GitHub.cli
winget install Oracle.MySQL  # Optional: if using MySQL
```

**macOS:**
```bash
brew install node git gh mysql
```

**Linux:**
```bash
sudo apt update && sudo apt install nodejs npm git mysql-server
```

---

## Initial Setup

### Step 1: SSH Key Configuration

**Check for existing SSH key:**
```bash
ls ~/.ssh/id_ed25519.pub
```

**Create new SSH key (if needed):**
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
# Press Enter 3 times for defaults

# Display your public key
cat ~/.ssh/id_ed25519.pub
```

**Add to GitHub:**
1. Copy the key output
2. Go to [GitHub SSH Settings](https://github.com/settings/keys)
3. Click "New SSH key"
4. Paste and save

**Test connection:**
```bash
ssh -T git@github.com
# Expected: "Hi USERNAME! You've successfully authenticated"
```

### Step 2: Clone Repository

```bash
# Navigate to your projects folder
cd ~/Projects  # or C:\Users\YourName\Projects

# Clone the repository
git clone git@github.com:MayurWaghamode-1990/leave-management-system.git
cd leave-management-system
```

**Alternative (HTTPS):**
```bash
git clone https://github.com/MayurWaghamode-1990/leave-management-system.git
```

### Step 3: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to project root
cd ..
```

This takes 2-3 minutes.

---

## Database Configuration

Choose **SQLite** (easiest) or **MySQL** (production-like).

### Option A: SQLite (Recommended)

```bash
cd backend

# Copy SQLite configuration
cp .env.sqlite .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed test data
node populate-test-data.js
```

**Expected output:**
```
🚀 Starting test data population...
✅ Created 8 users
✅ Created leave balances for all users
🎉 Test data population completed!
```

### Option B: MySQL

```bash
# Create database
mysql -u root -p
```

In MySQL prompt:
```sql
CREATE DATABASE lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON lms_db.* TO 'lms_user'@'localhost';
EXIT;
```

Configure backend:
```bash
cd backend
cp .env.mysql .env

# Edit .env and update DATABASE_URL with your credentials

npx prisma generate
npx prisma migrate deploy
node populate-test-data.js
```

---

## Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Expected output:
```
🚀 Server running on port 3001
📊 Swagger docs: http://localhost:3001/api-docs
✅ Database connected
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.0.8  ready in 1234 ms
  ➜  Local:   http://localhost:5174/
```

---

## Verification

### Test Login

1. Open: **http://localhost:5174**
2. Login with:
   - Email: `admin@glf.com`
   - Password: `password123`

### Test Users

| Email | Role | Description |
|-------|------|-------------|
| admin@glf.com | Admin | Full access |
| manager1@glf.com | Manager | Team lead |
| employee1@glf.com | Employee | Regular user |

All passwords: `password123`

### API Documentation

Visit: http://localhost:3001/api-docs

---

## Troubleshooting

### "Permission denied (publickey)"

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Or use HTTPS:
git remote set-url origin https://github.com/MayurWaghamode-1990/leave-management-system.git
```

### "npm install fails"

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### "Port already in use"

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

### "Prisma Client error"

```bash
cd backend
npx prisma generate
npm run dev
```

### "Database connection error"

Check `backend/.env` file:
```env
# For SQLite:
DATABASE_URL="file:./dev.db"

# For MySQL:
DATABASE_URL="mysql://lms_user:password123@localhost:3306/lms_db"
```

---

## Next Steps

### 1. Read Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Team workflow
- [README.md](./README.md) - Project overview
- [Technology Stack.md](./Technology%20Stack.md) - Tech details

### 2. Setup Git Workflow

```bash
# Create develop branch
git checkout -b develop
git push origin develop

# Use sync script
bash sync-with-team.sh

# Create feature branch
git checkout -b feature/your-first-task
```

### 3. Install VS Code Extensions

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension Prisma.prisma
```

---

## Quick Reference

### Essential Commands

```bash
# Start development
cd backend && npm run dev      # Terminal 1
cd frontend && npm run dev     # Terminal 2

# Database operations
cd backend
npx prisma studio              # Database GUI
npx prisma migrate dev         # New migration
node populate-test-data.js     # Reseed data

# Git workflow
bash sync-with-team.sh         # Sync with team
git checkout -b feature/name   # New feature
git add . && git commit        # Commit
git push origin feature/name   # Push
gh pr create --base develop    # Create PR
```

### Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5174 | http://localhost:5174 |
| Backend | 3001 | http://localhost:3001 |
| API Docs | 3001 | http://localhost:3001/api-docs |
| Prisma Studio | 5555 | http://localhost:5555 |

---

## Getting Help

- 📖 Documentation: See markdown files in root
- 🐛 Bug Reports: GitHub Issues
- 💬 Questions: Team chat
- 📚 Prisma: https://www.prisma.io/docs
- ⚛️ React: https://react.dev
- 🎨 MUI: https://mui.com

---

## First Day Checklist

- [ ] Install Node.js, Git, GitHub CLI
- [ ] Setup SSH keys
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Setup database
- [ ] Start both servers
- [ ] Login successfully
- [ ] Read CONTRIBUTING.md
- [ ] Create develop branch
- [ ] Create first feature branch
- [ ] Make first commit
- [ ] Push to remote
- [ ] Create first PR

**All checked? You're ready to develop!** 🎉

---

For detailed information, see [CONTRIBUTING.md](./CONTRIBUTING.md).
