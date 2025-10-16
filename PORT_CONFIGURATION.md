# Port Configuration Guide

## Current Port Assignments

| Service | Port | URL | Status |
|---------|------|-----|--------|
| **Backend API** | 3001 | http://localhost:3001 | ✅ Primary |
| **Frontend Dev** | 5174 | http://localhost:5174 | ✅ Primary |
| **Frontend Alt** | 5173 | http://localhost:5173 | ⚠️ Fallback |
| **Swagger Docs** | 3001 | http://localhost:3001/api-docs | ✅ Same as Backend |
| **Prisma Studio** | 5555 | http://localhost:5555 | ✅ On demand |
| **MySQL** | 3306 | localhost:3306 | 🗄️ Database |
| **WebSocket** | 3001 | ws://localhost:3001 | ✅ Same as Backend |

## Default Configuration

### Backend (Port 3001)

**Location**: `backend/.env`
```env
PORT=3001
```

**Also configured in**:
- `backend/src/index.ts` - Server startup
- `frontend/src/config/api.ts` - API base URL
- `.vscode/launch.json` - Debug configuration

### Frontend (Port 5174)

**Default**: Vite automatically uses port 5173, but switches to 5174 if 5173 is in use.

**Location**: `frontend/vite.config.ts`
```typescript
server: {
  port: 5173,  // Will try 5174, 5175, etc. if occupied
  host: true
}
```

**Also configured in**:
- `backend/.env.example` - CORS_ORIGIN
- `backend/src/index.ts` - CORS whitelist
- `.vscode/launch.json` - Debug URL

## Port Conflicts Resolution

### If Backend Port 3001 is in Use

**Check what's using it**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001
kill -9 $(lsof -ti:3001)
```

**Or change the port**:
```env
# backend/.env
PORT=3002
```

Then update frontend API URL:
```typescript
// frontend/src/config/api.ts
const API_BASE_URL = 'http://localhost:3002/api/v1'
```

### If Frontend Port 5173/5174 is in Use

**Vite handles this automatically** - it will try ports in sequence:
- 5173 (default)
- 5174 (first fallback)
- 5175, 5176, etc.

**Manual override**:
```bash
# Start on specific port
cd frontend
PORT=5175 npm run dev
```

Update backend CORS:
```env
# backend/.env
CORS_ORIGIN=http://localhost:5175
```

## Configuration Files Reference

### Files Containing Port Numbers

| File | Ports Used | Purpose |
|------|------------|---------|
| `backend/.env` | 3001 | Backend server port |
| `backend/.env.example` | 3001, 5174 | Template & CORS |
| `backend/src/index.ts` | 3001, 5173-5178 | Server & CORS whitelist |
| `frontend/vite.config.ts` | 5173 | Vite dev server |
| `frontend/src/config/api.ts` | 3001 | API endpoint |
| `.vscode/launch.json` | 3001, 5174 | Debugging |
| `.vscode/tasks.json` | - | Uses env defaults |

## Environment-Specific Ports

### Development
```
Backend:  3001
Frontend: 5174
```

### Production
```
Backend:  443 (HTTPS via reverse proxy)
Frontend: 443 (HTTPS via CDN/hosting)
API:      https://api.yourdomain.com
App:      https://yourdomain.com
```

## CORS Configuration

Backend accepts requests from multiple frontend ports for flexibility:

```typescript
// backend/src/index.ts
const allowedOrigins = [
  'http://localhost:5173',  // Vite default
  'http://localhost:5174',  // Vite fallback
  'http://localhost:5175',  // Additional fallback
  'http://localhost:5176',  // Additional fallback
  'http://localhost:5177',  // Additional fallback
  'http://localhost:5178',  // Additional fallback
  process.env.CORS_ORIGIN || 'http://localhost:5174'
]
```

This means:
✅ Frontend can run on any port 5173-5178
✅ No CORS errors during development
✅ Handles Vite's automatic port switching

## Checking Current Ports

### See What's Running

**Windows**:
```bash
netstat -ano | findstr "3001 5174"
```

**Mac/Linux**:
```bash
lsof -i :3001
lsof -i :5174
```

### Test Port Availability

**Windows**:
```powershell
Test-NetConnection localhost -Port 3001
```

**Mac/Linux**:
```bash
nc -zv localhost 3001
```

## Common Scenarios

### Scenario 1: Clean Start

```bash
# Terminal 1
cd backend
npm run dev
# ✅ Backend: http://localhost:3001

# Terminal 2
cd frontend
npm run dev
# ✅ Frontend: http://localhost:5173 or 5174
```

### Scenario 2: Port 3001 Occupied

```bash
cd backend
PORT=3002 npm run dev

# Update frontend API URL
cd frontend
VITE_API_URL=http://localhost:3002/api/v1 npm run dev
```

### Scenario 3: Multiple Developers

Each developer can use different ports:

**Developer A**:
```bash
cd backend && PORT=3001 npm run dev
cd frontend && PORT=5174 npm run dev
```

**Developer B**:
```bash
cd backend && PORT=3002 npm run dev
cd frontend && PORT=5175 npm run dev
```

## Docker Port Mapping

If running in Docker:

```yaml
# docker-compose.yml
services:
  backend:
    ports:
      - "3001:3001"

  frontend:
    ports:
      - "5174:5173"  # Map host 5174 to container 5173

  mysql:
    ports:
      - "3306:3306"
```

## Firewall Rules

If needed, allow these ports:

**Windows Firewall**:
```powershell
netsh advfirewall firewall add rule name="LMS Backend" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="LMS Frontend" dir=in action=allow protocol=TCP localport=5174
```

**Linux (ufw)**:
```bash
sudo ufw allow 3001/tcp
sudo ufw allow 5174/tcp
```

## Network Access

### Localhost Only (Default)
```
Backend:  http://localhost:3001
Frontend: http://localhost:5174
```

### Network Access (Team Testing)

**Backend**:
```typescript
// backend/src/index.ts
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server accessible at http://0.0.0.0:${PORT}`)
})
```

**Frontend**:
```typescript
// frontend/vite.config.ts
server: {
  host: '0.0.0.0',  // Listen on all interfaces
  port: 5174
}
```

Access from other devices:
```
http://YOUR_IP:3001  # Backend
http://YOUR_IP:5174  # Frontend
```

## Quick Reference Card

```
┌────────────────────────────────────────────────┐
│  Leave Management System - Ports              │
├────────────────────────────────────────────────┤
│ 🚀 Backend API:      http://localhost:3001    │
│ 🎨 Frontend App:     http://localhost:5174    │
│ 📚 API Docs:         /api-docs (port 3001)    │
│ 🗄️  Prisma Studio:   http://localhost:5555    │
│ 📊 MySQL:            localhost:3306           │
├────────────────────────────────────────────────┤
│ ⚠️  Port Issues?                              │
│   • Kill: taskkill /PID <PID> /F             │
│   • Check: netstat -ano | findstr :3001      │
└────────────────────────────────────────────────┘
```

## Troubleshooting

### Backend Not Starting

1. **Check if port is in use**:
   ```bash
   netstat -ano | findstr :3001
   ```

2. **Kill existing process**:
   ```bash
   taskkill /PID <PID> /F
   ```

3. **Use different port**:
   ```bash
   PORT=3002 npm run dev
   ```

### Frontend CORS Errors

1. **Verify backend CORS settings**:
   ```env
   CORS_ORIGIN=http://localhost:5174
   ```

2. **Check frontend API URL**:
   ```typescript
   // frontend/src/config/api.ts
   const API_BASE_URL = 'http://localhost:3001/api/v1'
   ```

3. **Restart both servers**

### WebSocket Connection Issues

WebSocket runs on same port as backend (3001):
```
ws://localhost:3001
```

If issues, check:
- Backend is running
- No firewall blocking
- CORS allows WebSocket upgrade

## Production Deployment

In production, use standard ports with reverse proxy:

```nginx
# nginx.conf
server {
  listen 443 ssl;
  server_name yourdomain.com;

  # Frontend
  location / {
    root /var/www/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # Backend API
  location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # WebSocket
  location /socket.io {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Summary

**Development Ports** (Recommended):
- ✅ Backend: **3001**
- ✅ Frontend: **5174** (or 5173 if available)
- ✅ MySQL: **3306**
- ✅ Prisma Studio: **5555**

**Flexibility**:
- Backend CORS allows frontend on ports 5173-5178
- Vite automatically finds available port
- Easy to change via environment variables

**No conflicts by design!** 🎉
