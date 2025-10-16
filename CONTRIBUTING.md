# Contributing to Leave Management System

## Quick Start for Team Development

### Initial Setup

```bash
# Clone the repository
git clone git@github.com:MayurWaghamode-1990/leave-management-system.git
cd leave-management-system

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database
cd backend
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate deploy
npx prisma generate
npm run db:seed

# Start development servers
cd backend && npm run dev    # Terminal 1 - Backend on :3001
cd frontend && npm run dev   # Terminal 2 - Frontend on :5174
```

### Daily Development Workflow

#### 1. Start of Day

```bash
# Get latest changes
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name
```

#### 2. During Development

```bash
# Make changes, test locally

# Commit frequently
git add .
git commit -m "feat: Add feature description"

# Push to your branch
git push origin feature/your-feature-name
```

#### 3. Before Lunch & End of Day

```bash
# Sync with team's changes
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git merge develop  # or: git rebase develop
```

#### 4. When Feature is Complete

```bash
# Push final changes
git push origin feature/your-feature-name

# Create Pull Request
gh pr create \
  --base develop \
  --title "feat: Your feature title" \
  --body "Description of changes"
```

## Branching Strategy

```
main (production)
  ↓
develop (integration)
  ↓
feature/leave-balance-ui
feature/approval-workflow
feature/email-notifications
bugfix/fix-date-calculation
```

### Branch Naming Convention

- `feature/short-description` - New features
- `bugfix/short-description` - Bug fixes
- `hotfix/short-description` - Critical production fixes
- `refactor/short-description` - Code refactoring
- `docs/short-description` - Documentation updates

## Code Review Guidelines

### Before Requesting Review

- [ ] Code runs without errors
- [ ] All tests pass: `npm run test`
- [ ] Linting passes: `npm run lint`
- [ ] TypeScript compiles: `npm run type-check`
- [ ] No console.log statements (backend only)
- [ ] Updated relevant documentation

### Reviewing Others' Code

```bash
# Check out PR
gh pr checkout 42

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Test locally
npm run dev

# Run quality checks
npm run lint
npm run type-check
npm run test

# Leave review
gh pr review 42 --comment --body "Your feedback here"
```

### Review Criteria

✅ **Approve if:**
- Code works as expected
- Follows project conventions
- Has appropriate error handling
- Includes necessary tests
- Documentation is updated

⚠️ **Request changes if:**
- Breaking changes without discussion
- Missing error handling
- Poor variable naming
- Missing tests for critical logic
- Security concerns

## Avoiding Merge Conflicts

### Module Ownership (Recommended)

**Developer A:**
- `frontend/src/pages/leaves/`
- `backend/src/routes/leaves.ts`
- `backend/src/services/leaveService.ts`

**Developer B:**
- `frontend/src/pages/approvals/`
- `backend/src/routes/approvals.ts`
- `backend/src/services/approvalService.ts`

**Shared (Coordinate):**
- Database schema (`prisma/schema.prisma`)
- Shared types (`src/types/`)
- Shared components (`frontend/src/components/common/`)

### Database Migration Coordination

⚠️ **ALWAYS communicate before schema changes!**

```bash
# Developer A creates migration
npx prisma migrate dev --name add_notification_table
git add prisma/
git commit -m "db: Add notification preferences table"
git push

# Developer B applies migration
git pull origin develop
npx prisma migrate deploy
npx prisma generate
```

### Handling Merge Conflicts

```bash
# Get latest develop
git checkout develop
git pull origin develop

# Try to merge into your branch
git checkout feature/your-feature
git merge develop

# If conflicts occur:
# 1. Open conflicted files
# 2. Look for <<<<<<< HEAD markers
# 3. Manually resolve conflicts
# 4. Test that code still works
# 5. Commit resolution

git add .
git commit -m "merge: Resolve conflicts with develop"
git push
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add email notification for leave approval
fix: Correct leave balance calculation
docs: Update API documentation
style: Format code with prettier
refactor: Simplify approval logic
test: Add unit tests for leave service
chore: Update dependencies
```

## Testing Requirements

### Before Creating PR

```bash
# Backend tests
cd backend
npm run test
npm run test:coverage  # Should be >70%

# Frontend tests
cd frontend
npm run test
```

### When Adding New Features

- Add unit tests for business logic
- Add integration tests for API endpoints
- Test edge cases and error scenarios
- Test with different user roles

## Communication

### Daily Standup (Async)

Post in Slack/Teams:
```
Yesterday: ✅ Completed leave balance UI
Today: 🚧 Working on approval workflow API
Blockers: ❌ Need clarification on multi-level approvals
```

### Before Making Large Changes

- Create GitHub issue first
- Discuss approach with team
- Get agreement on design
- Then start implementation

### When Stuck

Don't wait more than 1 hour:
1. Review documentation
2. Check similar code in project
3. Ask teammate
4. Create GitHub discussion

## Environment Setup

### Backend (.env)

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/lms_db"

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Running Tests

```bash
# Backend
cd backend
npm test                    # Unit tests
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage report

# Frontend
cd frontend
npm test                    # Component tests
npm run test:ui            # Interactive test UI
```

## Deployment

### Staging Deployment

```bash
# Merge to develop triggers staging deployment
git checkout develop
git merge feature/your-feature
git push origin develop

# Wait for CI/CD to deploy to staging
# Test at: https://staging.your-domain.com
```

### Production Deployment

```bash
# Only from main branch
git checkout main
git merge develop
git tag v1.2.3
git push origin main --tags

# Creates GitHub release
# Triggers production deployment
```

## Getting Help

- 📖 **Documentation**: See `/docs` folder
- 💬 **Team Chat**: Slack #lms-dev channel
- 🐛 **Bug Reports**: GitHub Issues
- 💡 **Feature Requests**: GitHub Discussions
- 🚨 **Urgent Issues**: Tag @team-leads

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Auto-format on save (recommended)
- **Linting**: Fix before committing
- **Naming**:
  - `camelCase` for variables/functions
  - `PascalCase` for components/classes
  - `UPPER_SNAKE_CASE` for constants

## Quick Reference

```bash
# Get latest code
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# See what others are working on
gh pr list

# Create PR
gh pr create --base develop

# Review teammate's PR
gh pr checkout 42
gh pr review 42 --approve

# Sync your branch with develop
git checkout feature/my-feature
git merge develop
```

---

**Questions?** Ask in #lms-dev or create a GitHub Discussion!
