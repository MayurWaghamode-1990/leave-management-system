# Leave Management System

A comprehensive leave management application supporting India and US compliance requirements.

## Features

### V1 Scope
- ✅ Leave request and approval workflows with configurable policies
- ✅ Employee self-service portal for leave application, balance view, and history
- ✅ Role-based dashboards for employees, managers, and HR
- ✅ Automated balance accruals based on region-specific policies
- ✅ Integration with payroll and HR systems for leave/payroll reconciliation
- ✅ Support for Indian and US leave laws and accrual types
- ✅ Multi-level (two levels) approval workflows
- ✅ Notifications, reminders, and real-time alerts
- ✅ Configurable company-wide and regional holiday calendars
- ✅ Core reports: balances, utilization, trends, compliance
- ✅ Web-based application with responsive design for desktop and mobile

## Tech Stack

### Frontend
- **Framework:** React.js with TypeScript
- **UI Components:** Material-UI
- **State Management:** React Query + Context API
- **Routing:** React Router
- **Build Tool:** Vite

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + Role-Based Access Control
- **Documentation:** Swagger/OpenAPI

### Additional Services
- **Cache:** Redis
- **Email:** SendGrid/Nodemailer
- **File Storage:** Local/AWS S3
- **Process Manager:** PM2 (Production)

## Project Structure

```
leave-management-system/
├── frontend/                 # React frontend application
├── backend/                  # Node.js backend API
├── shared/                   # Shared types and utilities
├── docs/                     # Documentation and requirements
└── README.md
```

## User Roles

1. **Employee** - Initiates leave requests, manages own balance and history
2. **Manager/Supervisor** - Reviews, approves/rejects leave requests from direct reports
3. **HR/Admin** - Configures policies, manages users, oversees all leave data/reports
4. **Payroll Officer** - Accesses leave/payroll-related reports and integration dashboards
5. **IT/Solution Architect** - Manages integrations, system health, and security roles

## Regional Compliance

### India
- Factories Act, 1948 compliance
- State-specific Shops & Establishments Act
- Maternity Benefit Act support
- Sandwich policy handling
- State-wise holiday calendars

### USA
- FMLA compliance
- State-specific PTO laws
- Use-it-or-lose-it policy handling
- Federal and state holiday support

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (optional, for caching)

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Set up PostgreSQL database
4. Configure environment variables
5. Run database migrations
6. Start the development servers

## Development Setup

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Start development servers
cd backend && npm run dev
cd frontend && npm run dev
```

## License

MIT License - see LICENSE file for details.