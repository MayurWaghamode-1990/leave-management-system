# Leave Management System - Testing Guide

## Testing Maternity/Paternity Leave Validations

### Test Accounts

#### For Maternity Leave Testing
**Account**: lakshmi@company.com / password123
- **Gender**: Female
- **Marital Status**: Married
- **Expected Result**: Should be eligible for maternity leave

#### For Paternity Leave Testing
**Account**: karthik@company.com / password123
- **Gender**: Male
- **Marital Status**: Married
- **Expected Result**: Should be eligible for paternity leave

#### For Negative Testing (Ineligible Users)
**Account**: user@company.com / password123
- **Gender**: Not specified or different
- **Marital Status**: Not specified
- **Expected Result**: Should NOT see maternity/paternity leave options (filtered out)

---

## Test Scenarios

### Scenario 1: Maternity Leave - Eligible Female Employee

**Test Steps**:
1. Login as `lakshmi@company.com`
2. Navigate to "My Leaves" page
3. Click "Apply for Leave"
4. Select "Maternity Leave" from dropdown
5. Fill in dates (e.g., 60-90 days)
6. Add reason with medical documentation note
7. Click "Submit Request"

**Expected Results**:
- ✅ Maternity Leave option should be visible in dropdown
- ✅ Can select dates up to 180 days
- ✅ System shows warning: "Medical certificate and pregnancy proof required"
- ✅ Request submits successfully
- ✅ Shows in pending approvals

**Validation Checks**:
- Cannot apply for maternity leave twice in the same year
- Requires documentation
- Available balance shows 180 days

---

### Scenario 2: Paternity Leave - Eligible Male Employee

**Test Steps**:
1. Login as `karthik@company.com`
2. Navigate to "My Leaves" page
3. Click "Apply for Leave"
4. Select "Paternity Leave" from dropdown
5. Fill in dates (e.g., 10-15 days)
6. Add reason
7. Click "Submit Request"

**Expected Results**:
- ✅ Paternity Leave option should be visible in dropdown
- ✅ Can select dates up to 15 days
- ✅ System shows warning: "Birth certificate or medical certificate required"
- ✅ Requires marital status to be "MARRIED" (hard requirement)
- ✅ Request submits successfully

**Validation Checks**:
- Cannot apply for paternity leave twice in the same year
- Must be married (MARRIED status required)
- Available balance shows 15 days

---

### Scenario 3: Maternity Leave - Ineligible (Male Employee)

**Test Steps**:
1. Login as `karthik@company.com` (Male)
2. Navigate to "My Leaves" page
3. Click "Apply for Leave"
4. Try to select "Maternity Leave"

**Expected Results**:
- ✅ Maternity Leave option should NOT be visible in dropdown
- ✅ Only male-eligible leave types shown

---

### Scenario 4: Paternity Leave - Ineligible (Female Employee)

**Test Steps**:
1. Login as `lakshmi@company.com` (Female)
2. Navigate to "My Leaves" page
3. Click "Apply for Leave"
4. Try to select "Paternity Leave"

**Expected Results**:
- ✅ Paternity Leave option should NOT be visible in dropdown
- ✅ Only female-eligible leave types shown

---

### Scenario 5: Paternity Leave - Ineligible (Unmarried Male)

**Test Steps**:
1. Login with an unmarried male account
2. Navigate to "My Leaves" page
3. Click "Apply for Leave"
4. Check leave type options

**Expected Results**:
- ✅ Paternity Leave option should NOT be visible (filtered by marital status)
- ❌ If visible and selected, should get error: "Paternity leave is only available for married employees"

---

### Scenario 6: Duplicate Maternity Leave in Same Year

**Test Steps**:
1. Login as `lakshmi@company.com`
2. Apply for first maternity leave (should succeed)
3. Try to apply for another maternity leave in the same year

**Expected Results**:
- ✅ First request succeeds
- ❌ Second request fails with error: "You already have a maternity leave request for this year"
- ✅ Works for both APPROVED and PENDING status

---

### Scenario 7: Half-Day Leave Selection

**Test Steps**:
1. Login with any account
2. Click "Apply for Leave"
3. Select any leave type
4. Select start and end date (same date for half day)
5. Toggle "Half Day Leave" switch
6. Select "First Half (Morning)" or "Second Half (Afternoon)"
7. Submit request

**Expected Results**:
- ✅ Half-day period selector appears when half-day toggle is ON
- ✅ Selector disappears when toggle is OFF
- ✅ Total days shows 0.5 days
- ✅ Summary shows period: "(Half Day - Morning)" or "(Half Day - Afternoon)"
- ✅ Request saves with halfDayPeriod field

---

### Scenario 8: Leave Balance Real-Time Validation

**Test Steps**:
1. Login with any account
2. Check current leave balance for a type (e.g., Casual Leave: 12 days)
3. Apply for leave using 5 days (should succeed)
4. Try to apply another 10 days while first is PENDING

**Expected Results**:
- ✅ First request (5 days) succeeds
- ❌ Second request (10 days) fails with: "Insufficient balance. Available: 7 days (after pending: 5)"
- ✅ Warning shows: "5 days are already pending approval"

---

### Scenario 9: Weekend/Holiday Exclusion

**Test Steps**:
1. Login with any account
2. Apply for leave from Friday to Monday (4 calendar days)
3. Check calculated working days

**Expected Results**:
- ✅ System excludes Saturday and Sunday
- ✅ Actual leave days = 2 (Friday + Monday)
- ✅ Warning shows: "Leave days adjusted: Requested 4 days, actual working days 2"

---

## API Testing (Backend)

### Test Endpoint: POST /api/v1/leaves/validate

**Test Case 1: Validate Maternity Leave - Eligible**
```bash
curl -X POST http://localhost:3001/api/v1/leaves/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {lakshmi_token}" \
  -d '{
    "leaveType": "MATERNITY_LEAVE",
    "startDate": "2025-02-01",
    "endDate": "2025-04-30",
    "reason": "Maternity leave with medical certificate"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": [
        "Medical certificate and pregnancy proof required for maternity leave"
      ],
      "requiredDocumentation": true
    }
  }
}
```

**Test Case 2: Validate Maternity Leave - Male Employee (Ineligible)**
```bash
curl -X POST http://localhost:3001/api/v1/leaves/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {karthik_token}" \
  -d '{
    "leaveType": "MATERNITY_LEAVE",
    "startDate": "2025-02-01",
    "endDate": "2025-04-30",
    "reason": "Test"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "validation": {
      "isValid": false,
      "errors": [
        "Maternity leave is only available for female employees"
      ],
      "warnings": [],
      "requiredDocumentation": false
    }
  }
}
```

**Test Case 3: Validate Paternity Leave - Eligible**
```bash
curl -X POST http://localhost:3001/api/v1/leaves/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {karthik_token}" \
  -d '{
    "leaveType": "PATERNITY_LEAVE",
    "startDate": "2025-02-01",
    "endDate": "2025-02-15",
    "reason": "Paternity leave with birth certificate"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": [
        "Birth certificate or medical certificate required for paternity leave"
      ],
      "requiredDocumentation": true
    }
  }
}
```

---

## Automated Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| Maternity - Eligible Female | ✅ PASS | Lakshmi account |
| Maternity - Male Employee | ✅ PASS | Filtered from UI |
| Paternity - Eligible Male | ✅ PASS | Karthik account |
| Paternity - Female Employee | ✅ PASS | Filtered from UI |
| Paternity - Unmarried Male | ✅ PASS | Filtered from UI |
| Duplicate Maternity (Same Year) | ✅ PASS | Error shown |
| Half-Day Period Selector | ✅ PASS | UI shows correctly |
| Real-Time Balance Validation | ✅ PASS | Pending considered |
| Weekend/Holiday Exclusion | ✅ PASS | Auto-calculated |

---

## Notes

1. **Gender & Marital Status Filtering**: The frontend filters leave types based on user profile automatically
2. **Backend Validation**: Double validation on backend ensures security
3. **Documentation Requirements**: System warns users about required documents
4. **Year-Based Limits**: One maternity/paternity leave per calendar year
5. **Real-Time Balance**: Considers pending leaves when calculating available balance

---

## Regression Testing Checklist

- [ ] Regular leave types still work (Casual, Sick, Earned)
- [ ] Manager approval workflow not affected
- [ ] Notifications sent correctly
- [ ] Leave balance calculations accurate
- [ ] Calendar integration not broken
- [ ] Report generation includes new leave types
- [ ] Email notifications mention correct leave type
- [ ] Audit logs track maternity/paternity requests

---

## Known Issues / Future Enhancements

1. **Document Upload**: Add file upload for medical/birth certificates
2. **Extended Validation**: Add age restrictions (e.g., min age for maternity)
3. **Regional Rules**: Different maternity/paternity days by country
4. **Grace Period**: Allow paternity leave within X days of birth

---

## Test Data Reset

To reset test data and re-run tests:

```bash
cd backend
npx tsx prisma/seed.ts
```

This will recreate all test accounts with fresh balances.
