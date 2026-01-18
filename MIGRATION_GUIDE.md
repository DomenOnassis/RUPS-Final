# Migration Guide: Removing Login Pages from Games

This guide explains how to update Risalko and Vezalko to work with the new centralized authentication system.

## Overview

**Before**: Each game had its own login/register pages  
**After**: AppLauncher handles all authentication, games read from localStorage

## Changes Required

### 1. Remove Login/Register Pages (Optional)

Since authentication is now handled by AppLauncher, you can optionally remove the login pages from the games themselves.

#### Risalko

```bash
# Optional: Remove these files if you want
rm -rf Risalko/frontend/src/app/login-student/
rm -rf Risalko/frontend/src/app/login-teacher/
rm -rf Risalko/frontend/src/app/register/
```

#### Vezalko

Vezalko doesn't have login pages in the frontend (it's a Phaser game), so no changes needed.

### 2. Update Authentication Checks

#### Risalko - Update useUser Hook

The existing `useUser` hook in Risalko already reads from localStorage, so it should work with the new system. However, you may want to update the redirect logic:

**File**: `Risalko/frontend/src/hooks/useUser.tsx`

```typescript
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Redirect to AppLauncher login instead of local login
      window.location.href = "http://localhost:3002/login";
    }
  }, [router]);

  return user;
}
```

#### Vezalko - Update Scene Authentication

**File**: `Vezalko/src/scenes/loginScene.js`

Update the login scene to check localStorage first:

```javascript
create() {
  // Check if user is already logged in via AppLauncher
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      this.scene.start("MenuScene", { user });
      return;
    } catch (e) {
      console.error("Failed to parse user data:", e);
    }
  }

  // If not logged in, redirect to AppLauncher
  window.location.href = "http://localhost:3002/login";
}
```

### 3. Update Backend API Calls

Both games should continue using the Vezalko backend API for game-specific operations. Only authentication is centralized.

#### API Endpoints Still Used by Games

```javascript
// These endpoints are still used by games
const API_BASE = "http://127.0.0.1:8000/api";

// Class management (Risalko)
POST   /api/classes
GET    /api/classes
GET    /api/classes/{id}
PUT    /api/classes/{id}
DELETE /api/classes/{id}

// Story management (Risalko)
POST   /api/stories
GET    /api/stories
GET    /api/stories/{id}

// Circuit management (Vezalko)
POST   /api/circuits
GET    /api/circuits
GET    /api/circuits/{id}

// Challenge management (Vezalko)
GET    /api/challenges
POST   /api/challenges
```

### 4. Update Navigation Links

#### Risalko - Update Home Page

**File**: `Risalko/frontend/src/app/page.tsx`

```typescript
export default function Home() {
  return (
    <div>
      <h1>Welcome to Risalko</h1>
      <p>Please access this game through the AppLauncher</p>
      <a href="http://localhost:3002">Go to AppLauncher</a>
    </div>
  );
}
```

#### Add Logout Button to Games

Both games should have a logout button that clears localStorage and redirects to AppLauncher:

```typescript
function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "http://localhost:3002/login";
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
```

### 5. Update Configuration Files

Create a shared config file for API endpoints:

#### Risalko

**File**: `Risalko/frontend/src/config/api.ts`

```typescript
export const API_BASE_URL = "http://127.0.0.1:8000";
export const APP_LAUNCHER_URL = "http://localhost:3002";

export const API_ENDPOINTS = {
  classes: `${API_BASE_URL}/api/classes`,
  stories: `${API_BASE_URL}/api/stories`,
  paragraphs: `${API_BASE_URL}/api/paragraphs`,
  users: `${API_BASE_URL}/api/users`,
};
```

#### Vezalko

**File**: `Vezalko/src/config/api.js`

```javascript
export const API_BASE_URL = "http://127.0.0.1:8000";
export const APP_LAUNCHER_URL = "http://localhost:3002";

export const API_ENDPOINTS = {
  circuits: `${API_BASE_URL}/api/circuits`,
  challenges: `${API_BASE_URL}/api/challenges`,
  users: `${API_BASE_URL}/api/users`,
};
```

## Testing the Migration

### 1. Test Teacher Flow

```bash
# Terminal 1: Start backend
cd Vezalko/backend
python main.py

# Terminal 2: Start AppLauncher
cd AppLauncher
npm run dev

# Terminal 3: Start Risalko
cd Risalko/frontend
npm run dev

# Terminal 4: Start Vezalko
cd Vezalko
npm run dev
```

**Test Steps**:
1. Go to `http://localhost:3002`
2. Register as teacher
3. Click on Risalko → Should open and work
4. Go back, click on Vezalko → Should open and work
5. Logout from AppLauncher
6. Try accessing games directly → Should redirect to login

### 2. Test Student Flow

**Test Steps**:
1. Login as teacher
2. Create a student through Risalko/Vezalko
3. Note the student code
4. Logout
5. Login as student using the code
6. Access games → Should work with student permissions

### 3. Test Session Persistence

**Test Steps**:
1. Login to AppLauncher
2. Open Risalko in new tab
3. Refresh Risalko → Should stay logged in
4. Close all tabs
5. Reopen AppLauncher → Should still be logged in
6. Logout → All tabs should lose access

## Common Issues and Solutions

### Issue 1: Games Show "Not Authenticated"

**Cause**: localStorage not being read correctly

**Solution**:
```javascript
// Check localStorage in browser console
console.log(localStorage.getItem("user"));
console.log(localStorage.getItem("token"));

// If empty, login again through AppLauncher
```

### Issue 2: CORS Errors

**Cause**: Backend not allowing requests from game origins

**Solution**: Ensure backend CORS is set to allow all origins (dev) or specific origins (prod)

```python
# Vezalko/backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: Infinite Redirect Loop

**Cause**: Game redirects to AppLauncher, which redirects back

**Solution**: Check authentication logic in game entry points

```typescript
// Correct approach
useEffect(() => {
  const user = localStorage.getItem("user");
  if (!user) {
    // Only redirect once
    window.location.href = "http://localhost:3002/login";
  }
}, []); // Empty dependency array
```

### Issue 4: Token Expired

**Cause**: JWT token has expired

**Solution**: Implement token refresh or redirect to login

```typescript
async function verifyToken() {
  const token = localStorage.getItem("token");
  const response = await fetch("http://127.0.0.1:8000/api/verify-token", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Token expired, redirect to login
    localStorage.clear();
    window.location.href = "http://localhost:3002/login";
  }
}
```

## Rollback Plan

If you need to rollback to the old system:

1. Keep the old login pages (don't delete them)
2. Update routes to point to local login pages
3. Restore old authentication logic
4. Keep AppLauncher as optional entry point

## Production Considerations

### 1. Update URLs

Replace `localhost` URLs with production domains:

```typescript
// Development
const APP_LAUNCHER_URL = "http://localhost:3002";

// Production
const APP_LAUNCHER_URL = "https://yourdomain.com";
```

### 2. Secure localStorage

Use HTTPS in production to secure localStorage data:

```typescript
// Check if running on HTTPS
if (window.location.protocol !== "https:" && process.env.NODE_ENV === "production") {
  console.warn("Application should be served over HTTPS");
}
```

### 3. Add Token Refresh

Implement token refresh to avoid session expiry:

```typescript
// Refresh token every 25 minutes (if token expires in 30)
setInterval(async () => {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/refresh-token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("token", data.access_token);
  }
}, 25 * 60 * 1000);
```

### 4. Add Error Boundaries

Wrap games in error boundaries to handle auth failures gracefully:

```typescript
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }) {
  return (
    <div>
      <h2>Authentication Error</h2>
      <p>{error.message}</p>
      <button onClick={() => window.location.href = APP_LAUNCHER_URL}>
        Return to Login
      </button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <YourGame />
    </ErrorBoundary>
  );
}
```

## Checklist

- [ ] Backend is running on port 8000
- [ ] AppLauncher is running on port 3002
- [ ] Games read from localStorage
- [ ] Games redirect to AppLauncher when not authenticated
- [ ] Logout clears localStorage and redirects
- [ ] Teacher can register and login
- [ ] Student can login with code
- [ ] Session persists across page refreshes
- [ ] CORS is properly configured
- [ ] All API endpoints work with new auth
- [ ] Documentation is updated
- [ ] Team is trained on new flow

## Support

If you encounter issues during migration:

1. Check browser console for errors
2. Verify localStorage contents
3. Check backend logs
4. Test with fresh browser session (incognito)
5. Review this guide and ARCHITECTURE.md

## Summary

The migration centralizes authentication in AppLauncher while keeping game-specific functionality in the games themselves. This provides:

✅ Single login point  
✅ Consistent user experience  
✅ Easier maintenance  
✅ Shared session across games  
✅ Simplified deployment  

The games continue to function independently but inherit authentication from the central system.
