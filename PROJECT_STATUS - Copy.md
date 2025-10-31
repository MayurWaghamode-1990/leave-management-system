🎯 Leave Management System - Technology Stack

  Frontend 🎨

  Core Framework & Build Tools

  - React 18.2.0 - Modern UI framework with hooks
  - TypeScript 5.2.2 - Type-safe JavaScript
  - Vite 5.0.8 - Fast build tool and dev server

  UI Framework & Styling

  - Material-UI (MUI) 5.15.3 - Comprehensive component library
    - @mui/material - Core components
    - @mui/icons-material - Icon set
    - @mui/lab - Experimental components
    - @mui/x-date-pickers - Date/time pickers
  - Emotion - CSS-in-JS styling solution

  State Management & Data Fetching

  - TanStack React Query 5.14.2 - Server state management
  - React Hook Form 7.48.2 - Form state management
  - Yup 1.4.0 - Schema validation

  Routing & Navigation

  - React Router DOM 6.20.1 - Client-side routing

  Data Visualization & UI Components

  - Recharts 2.8.0 - Charts and graphs
  - React Big Calendar 1.19.4 - Calendar views
  - React Beautiful DnD 13.1.1 - Drag and drop

  HTTP Client & Real-time

  - Axios 1.6.2 - HTTP requests
  - Socket.io Client 4.8.1 - Real-time websocket communication

  Date & Time

  - Day.js 1.11.10 - Date manipulation
  - Date-fns 3.6.0 - Date utilities
  - Moment.js 2.30.1 - Date formatting

  Notifications & UX

  - React Hot Toast 2.4.1 - Toast notifications

  Authentication & Integration

  - @azure/msal-browser 4.24.0 - Microsoft authentication
  - gapi-script 1.2.0 - Google API integration

  ---
  Backend ⚙️

  Core Framework

  - Node.js - Runtime environment
  - Express 4.18.2 - Web framework
  - TypeScript 5.3.3 - Type-safe backend

  Database & ORM

  - Prisma 5.22.0 - Modern ORM
  - @prisma/client - Database client
  - MySQL2 3.15.0 - MySQL driver
  - SQLite - Development database (fallback)

  Authentication & Security

  - JWT (jsonwebtoken 9.0.2) - Token-based auth
  - bcryptjs 2.4.3 - Password hashing
  - Helmet 7.2.0 - Security headers
  - CORS 2.8.5 - Cross-origin resource sharing
  - Express Rate Limit 7.5.1 - Rate limiting
  - Express Slow Down 3.0.0 - Request throttling

  Validation

  - Joi 17.11.0 - Schema validation
  - Express Validator 7.2.1 - Request validation

  Email & Calendar Integration

  - Nodemailer 6.10.1 - Email sending
  - Handlebars 4.7.8 - Email templates
  - ical-generator 9.0.0 - iCal file generation
  - node-ical 0.21.0 - iCal parsing
  - googleapis 160.0.0 - Google Calendar API
  - @azure/msal-node 3.8.0 - Microsoft integration

  Scheduling & Automation

  - node-cron 4.2.1 - Scheduled tasks (accruals, expiration)

  File Upload

  - Multer 1.4.5-lts.1 - File upload handling

  Real-time Communication

  - Socket.io 4.8.1 - WebSocket server

  Logging & Monitoring

  - Winston 3.11.0 - Structured logging

  API Documentation

  - Swagger JSDoc 6.2.8 - API documentation generator
  - Swagger UI Express 5.0.1 - Interactive API docs

  Utilities

  - uuid 13.0.0 - Unique ID generation
  - dotenv 16.6.1 - Environment variables

  Development Tools

  - tsx 4.7.0 - TypeScript execution
  - Jest 29.7.0 - Testing framework
  - ESLint 8.56.0 - Code linting

  ---
  Architecture & Features 🏗️

  Database Models (Prisma Schema)

  - Users & Departments
  - Leave Requests & Approvals
  - Leave Balances & Policies
  - Holidays & Calendar
  - Notifications & Audit Logs
  - Automation Rules
  - Comp Off Management
  - Multi-level Approvals
  - Leave Templates
  - Calendar Integrations

  Key Features Implemented

  1. ✅ Multi-region Support - India & USA compliance
  2. ✅ Leave Accrual System - Monthly automatic accrual
  3. ✅ Multi-level Approvals - Hierarchical approval workflows
  4. ✅ Real-time Notifications - Socket.io powered
  5. ✅ Email Notifications - Handlebars templates
  6. ✅ Calendar Integration - Google & Outlook sync
  7. ✅ Comp Off Management - Weekend work tracking
  8. ✅ Advanced Analytics - Reports & dashboards
  9. ✅ Leave Forecasting - AI-powered predictions
  10. ✅ Automation Rules - Custom workflow automation
  11. ✅ Role-based Access Control - Admin/Manager/Employee
  12. ✅ Audit Logging - Complete activity tracking

  Development & Deployment

  - Dev Server: Vite (Frontend) + tsx watch (Backend)
  - Version Control: Git & GitHub
  - Environment: Windows (Win32)
  - Package Manager: npm
  - Testing: Jest (Backend) + Vitest (Frontend)

  ---
  URLs & Ports 🌐

  - Frontend: http://localhost:5174
  - Backend API: http://localhost:3001
  - API Documentation: http://localhost:3001/api-docs
  - Prisma Studio: http://localhost:5555 (when running)