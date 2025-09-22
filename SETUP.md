# Leave Management System - Complete Setup Guide

This comprehensive guide will help you set up the Leave Management System for development and production.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **PostgreSQL** (version 14 or higher)
- **Git**
- **npm** or **yarn**

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd leave-management-system

# Install dependencies for all packages
npm run install:all
```

### 2. Database Setup

#### Install PostgreSQL
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: Use Homebrew: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

#### Create Database
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE leave_management_db;
CREATE USER lms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE leave_management_db TO lms_user;
```

### 3. Environment Configuration

#### Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your database credentials:
```bash
DATABASE_URL="postgresql://lms_user:your_password@localhost:5432/leave_management_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 4. Database Migration and Seeding

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

### 5. Start Development Servers

```bash
# From the root directory, start both frontend and backend
npm run dev

# Or start individually:
npm run dev:backend  # Starts on http://localhost:3001
npm run dev:frontend # Starts on http://localhost:5173
```

## Sample Login Credentials

After running the seed script, you can login with:

| Role | Email | Password |
|------|-------|----------|
| HR Admin | hr.admin@company.com | password123 |
| Manager | alex.johnson@company.com | password123 |
| Employee | ananya.patel@company.com | password123 |
| Employee | john.doe@company.com | password123 |
| Payroll Officer | michelle.lee@company.com | password123 |

## API Documentation

- **Health Check**: http://localhost:3001/health
- **API Base URL**: http://localhost:3001/api/v1
- **Swagger Documentation**: http://localhost:3001/api/v1/docs (Coming soon)

## Common Commands

### Backend Commands
```bash
cd backend

# Development
npm run dev                # Start dev server with hot reload
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Run migrations
npm run db:studio          # Open Prisma Studio (DB GUI)
npm run db:seed            # Seed database

# Testing & Quality
npm run test               # Run tests
npm run lint               # Run linter
npm run lint:fix           # Fix linting issues
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run preview            # Preview production build

# Testing & Quality
npm run test               # Run tests
npm run test:ui            # Run tests with UI
npm run lint               # Run linter
```

## Project Structure Overview

```
leave-management-system/
├── frontend/              # React.js frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── contexts/      # React contexts
│   │   └── types/         # TypeScript types
│   └── package.json
├── backend/               # Node.js/Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   ├── prisma/           # Database schema & migrations
│   └── package.json
├── shared/               # Shared types and utilities
└── docs/                # Documentation
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   ```bash
   # Kill process on port 3001 (backend)
   lsof -ti:3001 | xargs kill -9
   
   # Kill process on port 5173 (frontend)
   lsof -ti:5173 | xargs kill -9
   ```

3. **Prisma Client Issues**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

4. **Node Version Issues**
   - Use Node.js version 18 or higher
   - Consider using nvm: `nvm use 18`

### Logs and Debugging

- Backend logs: Check `backend/logs/` directory
- Frontend: Check browser console
- Database: Use Prisma Studio (`npm run db:studio`)

## Next Steps

1. **Frontend Development**: Start with the employee dashboard in `frontend/src/pages/`
2. **API Enhancement**: Add more endpoints in `backend/src/routes/`
3. **Testing**: Add tests in respective `__tests__` directories
4. **Deployment**: See `DEPLOYMENT.md` for production setup

## Frontend-Specific Setup

### Environment Configuration
```bash
cd frontend
cp .env.example .env
# Edit .env with your API URL (default: http://localhost:3001/api/v1)
```

### Development Server
```bash
cd frontend
npm run dev  # Runs on http://localhost:5173
```

## Testing the Application

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Login with Demo Credentials
Visit `http://localhost:5173` and use:
- **Employee**: ananya.patel@company.com / password123
- **Manager**: alex.johnson@company.com / password123  
- **HR Admin**: hr.admin@company.com / password123

### 3. Test Key Features
1. **Employee Flow**: Apply for leave, view balances, check history
2. **Manager Flow**: Review pending approvals, view team calendar
3. **HR Flow**: Manage users and policies

## Application Architecture

### Backend (Node.js + Express + Prisma)
- **API Server**: RESTful APIs with JWT authentication
- **Database**: PostgreSQL with Prisma ORM
- **Features**: RBAC, audit logging, regional compliance

### Frontend (React + TypeScript + Material-UI)
- **SPA**: Single Page Application with React Router
- **State Management**: React Query + Context API
- **UI Components**: Material-UI with custom theming

### Key Features Implemented
✅ **Authentication & Authorization**  
✅ **Employee Self-Service Portal**  
✅ **Manager Approval Workflows**  
✅ **Leave Balance Management**  
✅ **Regional Policy Support** (India/USA)  
✅ **Responsive Design**  
✅ **Real-time Notifications**  

## Production Deployment

### Backend Deployment
1. **Environment Variables**: Set production environment variables
2. **Database**: Use managed PostgreSQL (AWS RDS, etc.)
3. **Hosting**: Deploy to Railway, Render, or AWS
4. **Security**: Enable HTTPS, set CORS origins

### Frontend Deployment  
1. **Build**: Run `npm run build` in frontend directory
2. **Static Hosting**: Deploy to Vercel, Netlify, or AWS S3
3. **Environment**: Configure production API URL

## Additional Resources

- [Complete Frontend Guide](./FRONTEND_GUIDE.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [Material-UI Documentation](https://mui.com)

## Feature Roadmap

### Phase 2 Enhancements
- Advanced reporting with charts and analytics
- Team calendar with conflict detection  
- Bulk operations for HR admins
- Mobile app (React Native)
- Integration with external HR systems

### Phase 3 Enterprise Features
- Multi-tenant support
- Advanced approval workflows (3+ levels)
- AI-powered leave predictions
- Biometric attendance integration
- Advanced audit and compliance reports

## Support

For issues and questions:
1. Check this setup guide and frontend guide
2. Review the requirements document  
3. Check application logs for errors
4. Verify database connectivity and seeded data
5. Create a new issue if needed