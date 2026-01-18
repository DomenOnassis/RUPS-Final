# AppLauncher Setup Guide

This guide will help you set up and run the AppLauncher with the integrated authentication system.

## Quick Start

### 1. Start the Vezalko Backend

The backend handles all authentication for the entire system.

```bash
# Navigate to the Vezalko backend directory
cd ../Vezalko/backend

# Install Python dependencies (if not already installed)
pip install -r requirements.txt

# Start the backend server
python main.py
```

The backend should now be running on `http://127.0.0.1:8000`

### 2. Start AppLauncher

```bash
# Navigate to AppLauncher directory
cd AppLauncher

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

AppLauncher will be available at `http://localhost:3002`

### 3. Start the Games (Optional)

#### Risalko

```bash
cd ../Risalko/frontend
npm install
npm run dev
```

Risalko will run on `http://localhost:3000`

#### Vezalko Frontend

```bash
cd ../Vezalko
npm install
npm run dev
```

Vezalko will run on `http://localhost:3001`

## First Time Setup

### Creating Your First Teacher Account

1. Navigate to `http://localhost:3002`
2. You'll be redirected to the login page
3. Click "Register here" at the bottom
4. Fill in your details:
   - First Name
   - Last Name
   - Email
   - Password (minimum 6 characters)
   - Select "Teacher" as user type
5. Click "Register"
6. You'll be automatically logged in and redirected to the game selection dashboard

### Creating Student Accounts

Students need to be created by teachers through the game interfaces (Risalko or Vezalko). Each student will receive a unique code that they can use to log in.

#### Student Login Process

1. Navigate to `http://localhost:3002`
2. Click the "Student" tab on the login page
3. Enter the student code provided by the teacher
4. Click "Sign In"

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      AppLauncher (Port 3002)                 │
│                   - Login/Register Pages                     │
│                   - Game Selection Dashboard                 │
│                   - Session Management                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Authentication Requests
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Vezalko Backend (Port 8000)                     │
│              - User Authentication (JWT)                     │
│              - User Management                               │
│              - Database (SQLite)                             │
└─────────────────────────────────────────────────────────────┘
                      ↑
                      │ API Calls
        ┌─────────────┴─────────────┐
        │                           │
┌───────┴────────┐         ┌────────┴────────┐
│ Risalko        │         │ Vezalko         │
│ (Port 3000)    │         │ (Port 3001)     │
│ Story Drawing  │         │ Circuit Builder │
└────────────────┘         └─────────────────┘
```

## Configuration

### Changing Backend URL

If your backend runs on a different port or host, update `src/config/api.ts`:

```typescript
export const API_BASE_URL = "http://your-backend-url:port";
```

### Changing Game URLs

Update `src/config/games.ts` to match your game server URLs:

```typescript
export const games: GameConfig[] = [
  {
    name: "risalko",
    title: "Risalko",
    description: "Story Drawing & Visualization Game",
    url: "http://localhost:3000", // Change this
    color: "#667eea",
  },
  {
    name: "vezalko",
    title: "Vezalko",
    description: "Circuit Building Educational Game",
    url: "http://localhost:3001", // Change this
    color: "#764ba2",
  },
];
```

### Changing AppLauncher Port

Edit `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 3002",  // Change 3002 to your desired port
    "start": "next start -p 3002"
  }
}
```

## Authentication Flow

### Teacher Login Flow

1. User enters email and password
2. AppLauncher sends POST request to `/api/login` with credentials
3. Backend validates credentials and returns:
   - User data (id, name, surname, email, type)
   - JWT access token
4. AppLauncher stores both in localStorage
5. User is redirected to dashboard

### Student Login Flow

1. Student enters their unique code
2. AppLauncher sends POST request to `/api/login` with code
3. Backend validates code and returns user data + token
4. Data stored in localStorage
5. Student redirected to dashboard

### Session Persistence

- User data and token are stored in browser's localStorage
- On page load, AppLauncher checks for existing session
- If no valid session, user is redirected to login
- Logout clears localStorage and redirects to login

## Troubleshooting

### Backend Connection Issues

**Error**: "Connection error. Please try again."

**Solutions**:
1. Verify backend is running: `curl http://127.0.0.1:8000/api/verify-token`
2. Check backend logs for errors
3. Ensure CORS is properly configured in backend
4. Verify firewall isn't blocking port 8000

### Login Redirects Immediately

**Cause**: No valid session in localStorage

**Solutions**:
1. Open browser DevTools → Console
2. Check for localStorage errors
3. Try clearing localStorage: `localStorage.clear()`
4. Log in again

### "Email already registered"

**Cause**: Attempting to register with an existing email

**Solutions**:
1. Use the login page instead
2. Use a different email address
3. Contact admin to reset account (if needed)

### Games Not Loading

**Cause**: Game servers not running or URLs misconfigured

**Solutions**:
1. Verify game servers are running on correct ports
2. Check `src/config/games.ts` URLs match running servers
3. Check browser console for CORS or network errors

## Development Tips

### Hot Reload

All three applications support hot reload:
- Changes to AppLauncher automatically refresh
- Backend changes require server restart
- Game changes automatically refresh

### Debugging Authentication

Add console logs to track auth flow:

```typescript
// In login/register pages
console.log('Login response:', data);
console.log('Stored user:', localStorage.getItem('user'));
console.log('Stored token:', localStorage.getItem('token'));
```

### Testing Different User Types

1. Register as teacher
2. Create student codes through game interface
3. Open incognito window
4. Test student login with code

## Production Deployment

### Environment Variables

Create `.env.local` for production:

```env
NEXT_PUBLIC_API_URL=https://your-production-backend.com
```

Update `src/config/api.ts`:

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
```

### Build for Production

```bash
npm run build
npm start
```

### Security Considerations

1. **HTTPS**: Use HTTPS in production
2. **CORS**: Restrict CORS to specific domains
3. **Token Expiry**: Implement token refresh mechanism
4. **Environment Variables**: Never commit sensitive data
5. **Database**: Use PostgreSQL instead of SQLite for production

## API Endpoints Reference

### POST /api/login

**Request Body**:
```json
{
  "email": "teacher@example.com",
  "password": "password123",
  "code": null
}
```

or for students:

```json
{
  "code": "STUDENT123"
}
```

**Response**:
```json
{
  "data": {
    "id": 1,
    "name": "John",
    "surname": "Doe",
    "email": "john@example.com",
    "type": "teacher",
    "code": null,
    "is_active": true
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### POST /api/register

**Request Body**:
```json
{
  "name": "Jane",
  "surname": "Smith",
  "email": "jane@example.com",
  "password": "securepass123",
  "type": "teacher"
}
```

**Response**:
```json
{
  "id": 2,
  "name": "Jane",
  "surname": "Smith",
  "email": "jane@example.com",
  "type": "teacher",
  "code": null,
  "is_active": true
}
```

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs
3. Check browser console for errors
4. Verify all services are running

## Next Steps

After setup:
1. Create a teacher account
2. Explore both games (Risalko and Vezalko)
3. Create student accounts through the game interfaces
4. Test student login with generated codes
5. Customize styling and branding as needed
