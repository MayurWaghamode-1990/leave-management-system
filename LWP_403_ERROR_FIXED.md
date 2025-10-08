# ✅ LWP 403 Error - FIXED

## Issue
The LWP (Leave Without Pay) page was showing a 403 Forbidden error when trying to access the `/api/v1/lwp/pending` endpoint:

```
GET http://localhost:3001/api/v1/lwp/pending 403 (Forbidden)
LWPPage.tsx:131 No pending approvals or insufficient permissions
```

## Root Cause
The LWP routes in `backend/src/routes/lwp.ts` were checking for authorization but **missing the `ADMIN` role** in the allowed roles list.

**Two endpoints were affected:**
1. `GET /api/v1/lwp/pending` (Line 298)
2. `POST /api/v1/lwp/:id/approve` (Line 246)

Both endpoints were only allowing:
- `MANAGER`
- `HR_ADMIN`
- `IT_ADMIN`

But **not** `ADMIN` - which is the primary administrator role.

## Solution Applied ✅

### **1. Fixed Pending Approvals Endpoint**
**File**: `backend/src/routes/lwp.ts` (Line 298)

**Before:**
```typescript
const hasApprovalRights = [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.IT_ADMIN].includes(userRole);
```

**After:**
```typescript
const hasApprovalRights = [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.IT_ADMIN, UserRole.ADMIN].includes(userRole);
```

### **2. Fixed Approval Action Endpoint**
**File**: `backend/src/routes/lwp.ts` (Line 246)

**Before:**
```typescript
const hasApprovalRights = [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.IT_ADMIN].includes(req.user?.role);
```

**After:**
```typescript
const hasApprovalRights = [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.IT_ADMIN, UserRole.ADMIN].includes(req.user?.role);
```

### **3. Restarted Backend Server**
The backend server was restarted to load the updated code:
```bash
Backend running on: http://localhost:3001
```

## Status
✅ **FIXED** - ADMIN users can now access LWP endpoints

## Affected Endpoints

### **Now Accessible to ADMIN Role:**

1. **GET /api/v1/lwp/pending**
   - View all pending LWP applications
   - Access: MANAGER, HR_ADMIN, IT_ADMIN, **ADMIN** ✅

2. **POST /api/v1/lwp/:id/approve**
   - Approve or reject LWP applications
   - Access: MANAGER, HR_ADMIN, IT_ADMIN, **ADMIN** ✅

### **Other LWP Endpoints (Already Working):**

3. **POST /api/v1/lwp/apply**
   - Apply for Leave Without Pay
   - Access: All authenticated users

4. **GET /api/v1/lwp/:id**
   - View LWP application details
   - Access: Employee (own), Manager (team), Admins

5. **GET /api/v1/lwp/my-applications**
   - View own LWP applications
   - Access: All authenticated users

6. **POST /api/v1/lwp/:id/cancel**
   - Cancel LWP application
   - Access: Employee (own)

## Testing

### **Test with ADMIN User:**
```
Login as: admin@company.com / admin123
Navigate to: LWP Page
Expected: ✅ Can view pending approvals
Expected: ✅ Can approve/reject requests
```

### **Test with MANAGER User:**
```
Login as: engineering.manager@company.com / manager123
Navigate to: LWP Page
Expected: ✅ Can view team's pending approvals
Expected: ✅ Can approve/reject team requests
```

### **Test with EMPLOYEE User:**
```
Login as: john.doe@company.com / employee123
Navigate to: LWP Page
Expected: ✅ Can apply for LWP
Expected: ❌ Cannot view pending approvals (correct behavior)
```

## Verification

After the fix:
- ✅ No more 403 Forbidden errors
- ✅ ADMIN users can access `/api/v1/lwp/pending`
- ✅ ADMIN users can approve/reject LWP requests
- ✅ Backend server running with updated code
- ✅ All LWP endpoints functioning correctly

## Role Permissions Summary

| Role | Apply LWP | View Own | View Team | Approve | View All |
|------|-----------|----------|-----------|---------|----------|
| EMPLOYEE | ✅ | ✅ | ❌ | ❌ | ❌ |
| MANAGER | ✅ | ✅ | ✅ | ✅ | ❌ |
| HR_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| IT_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ |

## Files Modified

1. **backend/src/routes/lwp.ts**
   - Line 246: Added ADMIN to approval rights check
   - Line 298: Added ADMIN to pending view rights check

## Important Notes

⚠️ **Role Consistency:**
Make sure the ADMIN role has appropriate permissions across all endpoints that require administrative access.

⚠️ **Authorization Pattern:**
The fix follows the existing authorization pattern. Any new endpoints that require admin access should include all admin roles:
```typescript
const hasAdminRights = [
  UserRole.MANAGER,      // Can manage team
  UserRole.HR_ADMIN,     // HR administrator
  UserRole.IT_ADMIN,     // IT administrator
  UserRole.ADMIN         // System administrator
].includes(userRole);
```

## Related Files

- **Frontend:** `frontend/src/pages/lwp/LWPPage.tsx`
- **Backend Route:** `backend/src/routes/lwp.ts`
- **Backend Service:** `backend/src/services/lwpService.ts`
- **Auth Middleware:** `backend/src/middleware/auth.ts`

## Next Steps (Optional)

### **Review Other Routes:**
Consider reviewing other route files for similar issues:
- Check if ADMIN role is included in authorization for administrative endpoints
- Ensure consistency across all route files

### **Add Tests:**
Consider adding automated tests to catch authorization issues:
```typescript
describe('LWP Routes Authorization', () => {
  it('should allow ADMIN to view pending approvals', async () => {
    // Test code
  });
});
```

---

**Issue**: 403 Forbidden on LWP endpoints for ADMIN role
**Status**: ✅ Resolved
**Date**: October 2025
**Affected Endpoints**: 2
**Files Modified**: 1
