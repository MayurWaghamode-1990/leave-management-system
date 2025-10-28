# System Configuration Setup Guide

This guide explains the new configurable system for departments, locations, and other dropdown options in the Leave Management System.

## What Was Added

### 1. Database Schema
**File:** `backend/prisma/schema.prisma`

Added a new `SystemConfiguration` model that stores configurable options:
- **Categories:** DEPARTMENT, LOCATION, GENDER, MARITAL_STATUS, DESIGNATION, COUNTRY
- **Fields:** category, value, displayName, isActive, sortOrder, metadata

### 2. Backend API Endpoints
**File:** `backend/src/routes/configurations.ts`

New REST API endpoints:
- `GET /api/v1/configurations` - Get all configurations (grouped by category)
- `GET /api/v1/configurations/:category` - Get configurations for specific category
- `POST /api/v1/configurations` - Create new configuration (HR/IT Admin only)
- `PATCH /api/v1/configurations/:id` - Update configuration (HR/IT Admin only)
- `DELETE /api/v1/configurations/:id` - Delete configuration (HR/IT Admin only)

### 3. Seed Script
**File:** `backend/src/scripts/seedConfigurations.ts`

Populates default values for all configuration categories.

### 4. Frontend Admin Page
**File:** `frontend/src/pages/admin/ConfigurationsPage.tsx`

A complete admin interface to:
- View all configurations organized by tabs
- Add new options to any category
- Edit existing options (display name, sort order)
- Activate/deactivate options
- Reorder options
- Delete options

### 5. Updated User Form
**File:** `frontend/src/pages/hr/UsersPage.tsx`

The add/edit user form now:
- Fetches configuration options dynamically from the API
- Uses dropdown selects for all configurable fields
- Falls back to default values if API fails

## Setup Instructions

### Step 1: Generate Prisma Migration

```bash
cd backend
npx prisma migrate dev --name add_system_configurations
```

### Step 2: Seed Default Configurations

```bash
cd backend
npx ts-node src/scripts/seedConfigurations.ts
```

### Step 3: Add Route to Frontend Navigation

Add the configurations page to your admin navigation menu. Example:

**File:** `frontend/src/App.tsx` or your routing configuration

```tsx
import ConfigurationsPage from '@/pages/admin/ConfigurationsPage'

// In your routes:
<Route path="/admin/configurations" element={<ConfigurationsPage />} />
```

### Step 4: Restart Backend Server

```bash
cd backend
npm run dev
```

### Step 5: Restart Frontend Server

```bash
cd frontend
npm run dev
```

## Usage

### For Administrators

1. Navigate to **Admin > System Configurations**
2. Select the category tab (Departments, Locations, etc.)
3. Click **Add New** to create a new option
4. Edit existing options by clicking the edit icon
5. Reorder options using the up/down arrows
6. Activate/deactivate options using the toggle switch
7. Delete options using the delete icon

### Configuration Categories

1. **Departments** - Used in user profiles, filters, and reports
2. **Locations** - Used in user profiles, holiday management, and policies
3. **Designations** - Job titles for employees
4. **Gender** - Gender options for user profiles
5. **Marital Status** - Marital status options for user profiles
6. **Countries** - Country options for region-specific policies

## API Examples

### Get All Configurations

```bash
GET /api/v1/configurations
```

Response:
```json
{
  "success": true,
  "data": {
    "DEPARTMENT": [
      {
        "id": "abc123",
        "value": "Engineering",
        "displayName": "Engineering",
        "isActive": true,
        "sortOrder": 1
      }
    ],
    "LOCATION": [...]
  }
}
```

### Create New Department

```bash
POST /api/v1/configurations
Content-Type: application/json

{
  "category": "DEPARTMENT",
  "value": "Legal",
  "displayName": "Legal Department",
  "sortOrder": 7
}
```

### Update Configuration

```bash
PATCH /api/v1/configurations/{id}
Content-Type: application/json

{
  "displayName": "Human Resources",
  "sortOrder": 2,
  "isActive": true
}
```

## Benefits

1. **Flexibility** - Add/remove options without code changes
2. **Consistency** - All forms use the same configuration values
3. **User-Friendly** - Admins can manage options through UI
4. **Maintainable** - No need to update hardcoded arrays in multiple files
5. **Scalable** - Easy to add new configuration categories

## Future Enhancements

Consider adding:
- Import/export configurations via CSV
- Configuration history/audit log
- Bulk update operations
- Configuration validation rules
- Multi-language support for display names
- Department hierarchy with parent-child relationships
- Location-specific configurations

## Troubleshooting

### Issue: Configurations not loading in forms

**Solution:** Check browser console for API errors. Verify backend server is running and authentication token is valid.

### Issue: Cannot create new configuration

**Solution:** Ensure you're logged in as HR_ADMIN or IT_ADMIN role. Check API logs for specific error messages.

### Issue: Duplicate configuration error

**Solution:** Each category-value combination must be unique. Use a different value or update the existing one.

## Files Modified/Created

### Backend
- ✅ `backend/prisma/schema.prisma` - Added SystemConfiguration model
- ✅ `backend/src/routes/configurations.ts` - New API routes
- ✅ `backend/src/index.ts` - Registered configuration routes
- ✅ `backend/src/scripts/seedConfigurations.ts` - Seed script

### Frontend
- ✅ `frontend/src/pages/admin/ConfigurationsPage.tsx` - Admin UI
- ✅ `frontend/src/pages/hr/UsersPage.tsx` - Updated to use dynamic configs

## Next Steps

1. Run the migration and seed script
2. Test the configuration page
3. Add navigation link to admin menu
4. Update other forms that might use hardcoded values (if any)
5. Train HR admins on how to use the configuration page

---

**Note:** Always backup your database before running migrations in production!
