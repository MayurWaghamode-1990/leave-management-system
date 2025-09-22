# 🔌 Leave Management System - API Documentation

## Overview

The Leave Management System provides a RESTful API for managing leave requests, approvals, and administrative functions. This documentation covers all available endpoints, authentication, and usage examples.

**Base URL**: `/api/v1`

---

## Authentication

### JWT Token Authentication
All API endpoints require authentication using JWT tokens.

```http
Authorization: Bearer <jwt_token>
```

### Login Endpoint
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "userpassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "email": "user@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE"
    }
  }
}
```

---

## Core Endpoints

### Users

#### Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "managerId": "mgr456",
    "profile": {
      "phoneNumber": "+1234567890",
      "emergencyContact": "Emergency Contact Info"
    }
  }
}
```

#### Update User Profile
```http
PUT /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "profile": {
    "phoneNumber": "+1234567890",
    "emergencyContact": "Jane Doe - +0987654321"
  }
}
```

### Leave Requests

#### Create Leave Request
```http
POST /api/v1/leave-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "leaveTypeId": "annual_leave",
  "startDate": "2024-03-15",
  "endDate": "2024-03-20",
  "isHalfDay": false,
  "halfDayPeriod": null,
  "reason": "Family vacation",
  "attachments": ["file_id_1", "file_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "req789",
    "leaveTypeId": "annual_leave",
    "startDate": "2024-03-15",
    "endDate": "2024-03-20",
    "totalDays": 6,
    "status": "PENDING",
    "reason": "Family vacation",
    "submittedAt": "2024-03-01T10:00:00Z"
  }
}
```

#### Get Leave Requests
```http
GET /api/v1/leave-requests?status=PENDING&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by status (PENDING, APPROVED, REJECTED)
- `startDate`: Filter by start date (YYYY-MM-DD)
- `endDate`: Filter by end date (YYYY-MM-DD)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "req789",
        "leaveTypeId": "annual_leave",
        "leaveType": {
          "id": "annual_leave",
          "name": "Annual Leave",
          "color": "#4CAF50"
        },
        "startDate": "2024-03-15",
        "endDate": "2024-03-20",
        "totalDays": 6,
        "status": "PENDING",
        "reason": "Family vacation",
        "submittedAt": "2024-03-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### Update Leave Request
```http
PUT /api/v1/leave-requests/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Updated reason for leave",
  "startDate": "2024-03-16",
  "endDate": "2024-03-21"
}
```

#### Cancel Leave Request
```http
DELETE /api/v1/leave-requests/:id
Authorization: Bearer <token>
```

### Leave Approvals

#### Get Pending Approvals (Manager)
```http
GET /api/v1/approvals/pending
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "req789",
      "employee": {
        "id": "emp123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com"
      },
      "leaveType": {
        "id": "annual_leave",
        "name": "Annual Leave"
      },
      "startDate": "2024-03-15",
      "endDate": "2024-03-20",
      "totalDays": 6,
      "reason": "Family vacation",
      "submittedAt": "2024-03-01T10:00:00Z"
    }
  ]
}
```

#### Approve/Reject Leave Request
```http
POST /api/v1/approvals/:requestId
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "APPROVE",
  "comments": "Approved for the requested dates"
}
```

**Actions:**
- `APPROVE`: Approve the request
- `REJECT`: Reject the request
- `REQUEST_INFO`: Request additional information

### Leave Balance

#### Get User Leave Balance
```http
GET /api/v1/leave-balance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "leaveTypeId": "annual_leave",
      "leaveType": {
        "id": "annual_leave",
        "name": "Annual Leave",
        "color": "#4CAF50"
      },
      "allocated": 25,
      "used": 8,
      "pending": 3,
      "available": 14,
      "carryForward": 2,
      "expiryDate": "2024-12-31"
    },
    {
      "leaveTypeId": "sick_leave",
      "leaveType": {
        "id": "sick_leave",
        "name": "Sick Leave",
        "color": "#FF9800"
      },
      "allocated": 12,
      "used": 2,
      "pending": 0,
      "available": 10,
      "carryForward": 0,
      "expiryDate": null
    }
  ]
}
```

### Leave Types

#### Get All Leave Types
```http
GET /api/v1/leave-types
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "annual_leave",
      "name": "Annual Leave",
      "description": "Yearly vacation entitlement",
      "color": "#4CAF50",
      "requiresApproval": true,
      "maxDaysPerRequest": 30,
      "advanceBookingDays": 365,
      "carryForwardAllowed": true,
      "documentationRequired": false
    }
  ]
}
```

---

## Administrative Endpoints

### User Management (HR Admin)

#### Get All Users
```http
GET /api/v1/admin/users?department=Engineering&role=EMPLOYEE
Authorization: Bearer <token>
```

#### Create User
```http
POST /api/v1/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "EMPLOYEE",
  "department": "Marketing",
  "managerId": "mgr456",
  "startDate": "2024-03-01"
}
```

#### Update User
```http
PUT /api/v1/admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "department": "Engineering",
  "managerId": "mgr789",
  "role": "MANAGER"
}
```

### Leave Policy Management

#### Get Leave Policies
```http
GET /api/v1/admin/policies
Authorization: Bearer <token>
```

#### Create Leave Policy
```http
POST /api/v1/admin/policies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Annual Leave Policy",
  "leaveTypeId": "annual_leave",
  "allocation": 25,
  "accrualType": "MONTHLY",
  "carryForwardLimit": 5,
  "applicableRoles": ["EMPLOYEE", "MANAGER"],
  "effectiveDate": "2024-01-01"
}
```

### Reporting

#### Leave Summary Report
```http
GET /api/v1/reports/leave-summary?startDate=2024-01-01&endDate=2024-12-31&department=Engineering
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalEmployees": 50,
      "totalLeavesTaken": 825,
      "averageLeaveDays": 16.5,
      "leaveUtilization": 66
    },
    "byLeaveType": [
      {
        "leaveType": "Annual Leave",
        "totalDays": 650,
        "percentage": 78.8
      },
      {
        "leaveType": "Sick Leave",
        "totalDays": 125,
        "percentage": 15.2
      }
    ],
    "byDepartment": [
      {
        "department": "Engineering",
        "totalDays": 300,
        "employees": 20
      }
    ]
  }
}
```

---

## File Upload

### Upload Documents
```http
POST /api/v1/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "file": <binary_file_data>,
  "category": "leave_document"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "file123",
    "filename": "medical_certificate.pdf",
    "originalName": "medical_certificate.pdf",
    "size": 245760,
    "mimeType": "application/pdf",
    "url": "/uploads/file123.pdf"
  }
}
```

### Download File
```http
GET /api/v1/files/:id
Authorization: Bearer <token>
```

---

## Calendar Integration

### Get Calendar Events
```http
GET /api/v1/calendar/events?startDate=2024-03-01&endDate=2024-03-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "req789",
      "title": "John Doe - Annual Leave",
      "start": "2024-03-15",
      "end": "2024-03-20",
      "type": "leave",
      "status": "approved",
      "employee": {
        "id": "emp123",
        "name": "John Doe"
      }
    }
  ]
}
```

### Export Calendar
```http
GET /api/v1/calendar/export?format=ical&userId=emp123
Authorization: Bearer <token>
```

---

## Monitoring and Health

### Health Check
```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-01T10:00:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "checks": [
    {
      "service": "database",
      "status": "healthy",
      "responseTime": 15
    },
    {
      "service": "email",
      "status": "healthy",
      "responseTime": 8
    }
  ]
}
```

### System Metrics
```http
GET /api/v1/monitoring/metrics
Authorization: Bearer <token>
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "startDate",
        "message": "Start date cannot be in the past"
      }
    ]
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_REQUIRED` | Missing or invalid authentication token |
| `AUTHORIZATION_FAILED` | Insufficient permissions |
| `VALIDATION_ERROR` | Invalid input data |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `CONFLICT` | Resource conflict (e.g., overlapping leave dates) |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per minute
- **File upload**: 10 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Webhooks

### Webhook Events
The system can send webhooks for various events:

- `leave.request.submitted`
- `leave.request.approved`
- `leave.request.rejected`
- `leave.balance.updated`
- `user.created`

### Webhook Payload Example
```json
{
  "event": "leave.request.approved",
  "timestamp": "2024-03-01T10:00:00Z",
  "data": {
    "requestId": "req789",
    "employeeId": "emp123",
    "approver": "mgr456",
    "startDate": "2024-03-15",
    "endDate": "2024-03-20"
  }
}
```

---

## SDK and Examples

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

class LMSClient {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL: baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getLeaveBalance() {
    const response = await this.client.get('/leave-balance');
    return response.data;
  }

  async submitLeaveRequest(request) {
    const response = await this.client.post('/leave-requests', request);
    return response.data;
  }

  async approveLeaveRequest(requestId, comments) {
    const response = await this.client.post(`/approvals/${requestId}`, {
      action: 'APPROVE',
      comments
    });
    return response.data;
  }
}

// Usage
const lms = new LMSClient('https://your-domain.com/api/v1', 'your-jwt-token');
const balance = await lms.getLeaveBalance();
```

### Python Example
```python
import requests

class LMSClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_leave_balance(self):
        response = requests.get(f'{self.base_url}/leave-balance', headers=self.headers)
        return response.json()

    def submit_leave_request(self, request_data):
        response = requests.post(f'{self.base_url}/leave-requests',
                               json=request_data, headers=self.headers)
        return response.json()

# Usage
lms = LMSClient('https://your-domain.com/api/v1', 'your-jwt-token')
balance = lms.get_leave_balance()
```

---

## Testing

### Postman Collection
A Postman collection is available for testing all endpoints:
- Download: `/docs/postman/LMS_API.postman_collection.json`
- Environment: `/docs/postman/LMS_Environment.postman_environment.json`

### cURL Examples

#### Login
```bash
curl -X POST "https://your-domain.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@company.com","password":"password"}'
```

#### Get Leave Balance
```bash
curl -X GET "https://your-domain.com/api/v1/leave-balance" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Submit Leave Request
```bash
curl -X POST "https://your-domain.com/api/v1/leave-requests" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveTypeId": "annual_leave",
    "startDate": "2024-03-15",
    "endDate": "2024-03-20",
    "reason": "Family vacation"
  }'
```

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Core leave management functionality
- User authentication and authorization
- File upload and management
- Reporting endpoints
- Webhook support

---

*For technical support or API questions, contact: [API_SUPPORT_EMAIL]*
*API Documentation last updated: [Current Date]*