# Frontend Implementation Guide

## Overview

The Leave Management System frontend is built with React 18, TypeScript, and Material-UI, providing a modern and responsive user interface for all user roles.

## Technology Stack

- **React 18** with TypeScript
- **Material-UI (MUI)** for components and styling
- **React Router** for navigation
- **React Query (TanStack Query)** for server state management
- **React Hook Form** for form handling
- **Day.js** for date manipulation
- **Axios** for API calls
- **React Hot Toast** for notifications

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (LoadingSpinner, etc.)
│   └── layout/         # Layout components (Sidebar, Layout)
├── contexts/           # React contexts (AuthContext)
├── hooks/              # Custom React hooks
├── pages/              # Page components organized by user role
│   ├── auth/           # Authentication pages
│   ├── employee/       # Employee-specific pages
│   ├── manager/        # Manager-specific pages
│   ├── hr/             # HR admin pages
│   ├── reports/        # Reporting pages
│   └── profile/        # Profile pages
├── services/           # API service modules
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and configurations
```

## Key Features Implemented

### 1. Authentication System
- **Login page** with demo credentials
- **JWT token management** with automatic refresh
- **Role-based routing** for different user types
- **Protected routes** with authentication checks

### 2. Employee Features
- **Dashboard** with leave balance overview and quick actions
- **Leave request form** with date validation and duration calculation
- **Leave history** with filtering and pagination
- **Leave balances** with visual progress indicators

### 3. Manager Features
- **Manager dashboard** with team overview and pending approvals
- **Pending approvals** with approve/reject functionality
- **Team calendar view** (placeholder for future implementation)

### 4. HR Admin Features
- **HR dashboard** with administrative tools
- **User management** (placeholder for future implementation)
- **Policy management** (placeholder for future implementation)

### 5. Common Features
- **Responsive design** that works on desktop and mobile
- **Role-based navigation** with dynamic menu items
- **Notification system** with toast messages
- **Loading states** and error handling

## Component Architecture

### Layout System
- **DashboardLayout**: Main application layout with sidebar and header
- **Sidebar**: Role-based navigation menu
- **NotificationPanel**: Slide-out notification drawer

### Form Handling
- Uses React Hook Form for all forms
- TypeScript validation with proper error handling
- Date pickers with Material-UI integration

### API Integration
- Centralized API client with interceptors
- React Query for caching and synchronization
- Optimistic updates for better UX

## Styling and Theming

The application uses a custom Material-UI theme located in `src/utils/theme.ts`:

- **Primary Color**: Blue (#1976d2)
- **Secondary Color**: Pink (#dc004e)
- **Consistent spacing** and typography
- **Card-based layout** with subtle shadows
- **Status colors** for different leave states

## User Roles and Permissions

The frontend handles five user roles with different access levels:

1. **EMPLOYEE**: Basic leave management
2. **MANAGER**: Team oversight and approvals
3. **HR_ADMIN**: Full administrative access
4. **PAYROLL_OFFICER**: Report access only
5. **IT_ADMIN**: User and system management

## State Management

- **AuthContext**: Global authentication state
- **React Query**: Server state and caching
- **Local component state**: UI-specific state

## Development Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (when implemented)

## API Integration

The frontend integrates with the backend through:

- **Authentication endpoints** (`/auth/*`)
- **Leave management** (`/leaves/*`)
- **User management** (`/users/*`)
- **Reports and analytics** (`/reports/*`)

## Future Enhancements

The current implementation provides a solid foundation. Future enhancements could include:

1. **Advanced Analytics**: Charts and graphs with libraries like Recharts
2. **Calendar Integration**: Full calendar view for team leaves
3. **Real-time Notifications**: WebSocket integration
4. **Mobile App**: React Native implementation
5. **Offline Support**: PWA capabilities
6. **Advanced Search**: Global search functionality
7. **Bulk Operations**: Multi-select and bulk actions
8. **Custom Themes**: User-selectable themes

## Testing Strategy

While tests are not implemented in this version, the recommended testing approach would include:

- **Unit tests**: Individual component testing with Jest and React Testing Library
- **Integration tests**: User flow testing
- **E2E tests**: Complete user journey testing with Cypress

## Performance Considerations

The application is optimized for performance through:

- **Code splitting**: Route-based splitting with React.lazy
- **Query optimization**: React Query caching and background updates
- **Bundle optimization**: Vite's optimized bundling
- **Image optimization**: Proper image handling and lazy loading

## Accessibility

The application follows accessibility best practices:

- **Semantic HTML**: Proper HTML structure
- **ARIA labels**: Screen reader support
- **Keyboard navigation**: Full keyboard accessibility
- **Color contrast**: WCAG compliant color scheme

## Browser Support

The application supports:

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

## Deployment

The frontend can be deployed to:

- **Vercel** (recommended for development)
- **Netlify**
- **AWS S3 + CloudFront**
- **Traditional web servers** (Apache, Nginx)

Build the application with `npm run build` and deploy the `dist` folder.