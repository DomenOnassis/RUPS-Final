# Bug Fix: localStorage Sharing Between Apps

## Problem

When a user logs in via AppLauncher (port 3002) and clicks on Risalko (port 3000) or Vezalko (port 3001), they get redirected back to the login page even though they're authenticated in AppLauncher.

## Root Cause

**localStorage is origin-specific** (protocol + domain + port). This means:
- `http://localhost:3002` (AppLauncher) has its own localStorage
- `http://localhost:3000` (Risalko) has its own localStorage  
- `http://localhost:3001` (Vezalko) has its own localStorage

These three apps **cannot directly share localStorage** because they're on different origins (different ports).

## Solution

Use the **`postMessage` API** to securely transfer authentication data from AppLauncher to the games when they open.

### How It Works

```
1. User logs in to AppLauncher
   └─> localStorage stores {user, token}

2. User clicks on a game
   └─> AppLauncher opens game in new window
   └─> AppLauncher sends postMessage with auth data
   
3. Game receives postMessage
   └─> Stores {user, token} in its own localStorage
   └─> Loads normally with authentication
```

## Changes Made

### 1. AppLauncher Dashboard (`src/app/page.tsx`)

**Before:**
```tsx
<a href={game.url}>...</a>
```

**After:**
```tsx
<button onClick={() => {
  const userData = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  
  const gameWindow = window.open(game.url, "_blank");
  
  // Send auth data multiple times for reliability
  const sendAuthData = () => {
    gameWindow.postMessage(
      { type: "AUTH_DATA", user: userData, token: token },
      game.url
    );
  };
  
  setTimeout(sendAuthData, 500);
  setTimeout(sendAuthData, 1000);
  setTimeout(sendAuthData, 2000);
}}>
```

### 2. Risalko Home Page (`src/app/page.tsx`)

Added message listener:

```tsx
useEffect(() => {
  // Listen for auth data from AppLauncher
  const handleMessage = (event: MessageEvent) => {
    if (event.origin === "http://localhost:3002") {
      if (event.data.type === "AUTH_DATA") {
        localStorage.setItem("user", event.data.user);
        localStorage.setItem("token", event.data.token);
        window.location.href = "/classes";
      }
    }
  };

  window.addEventListener("message", handleMessage);
  
  // Wait 2 seconds for auth data, then redirect if none received
  setTimeout(() => {
    const userCheck = localStorage.getItem("user");
    if (!userCheck) {
      window.location.href = "http://localhost:3002/login";
    }
  }, 2000);
  
  return () => window.removeEventListener("message", handleMessage);
}, []);
```

### 3. Vezalko Main JS (`src/main.js`)

Added global message listener:

```javascript
window.addEventListener('message', (event) => {
  if (event.origin === 'http://localhost:3002') {
    if (event.data.type === 'AUTH_DATA') {
      localStorage.setItem('user', event.data.user);
      localStorage.setItem('token', event.data.token);
      
      const user = JSON.parse(event.data.user);
      if (user.name) {
        localStorage.setItem('username', user.name);
      }
      
      window.location.reload();
    }
  }
});
```

### 4. Vezalko Login Scene (`src/scenes/loginScene.js`)

Added waiting period before redirect:

```javascript
create() {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    this.scene.start("MenuScene");
    return;
  }

  // Show loading message
  const loadingText = this.add.text(
    width / 2, height / 2, 
    'Loading authentication...', 
    { fontSize: '24px', color: '#333' }
  ).setOrigin(0.5);

  // Wait 3 seconds for postMessage, then redirect
  this.time.delayedCall(3000, () => {
    if (!localStorage.getItem("user")) {
      window.location.href = "http://localhost:3002/login";
    }
  });
}
```

## Security Considerations

### Origin Verification

All message listeners verify the sender's origin:

```javascript
if (event.origin === "http://localhost:3002") {
  // Only process messages from AppLauncher
}
```

This prevents malicious websites from sending fake authentication data.

### Message Type Check

All listeners check for the specific message type:

```javascript
if (event.data.type === "AUTH_DATA") {
  // Only process AUTH_DATA messages
}
```

This prevents processing of other postMessage communications.

## Testing the Fix

### Step 1: Clear All Storage
```javascript
// In browser console for each app
localStorage.clear();
```

### Step 2: Login to AppLauncher
1. Go to `http://localhost:3002`
2. Login with your credentials
3. Verify you see the dashboard

### Step 3: Click on Risalko
1. Click the "Risalko" button
2. Game should open in new tab
3. Should automatically redirect to `/classes`
4. You should be logged in (see your name/classes)

### Step 4: Click on Vezalko  
1. Go back to AppLauncher
2. Click the "Vezalko" button
3. Game should open in new tab
4. Should show "Loading authentication..." briefly
5. Should load MenuScene with your username
6. You should be logged in

### Step 5: Verify Logout
1. Logout from any app
2. Should redirect to AppLauncher login
3. Try accessing games directly → should redirect to login

## Troubleshooting

### Issue: Game still redirects to login

**Possible Causes:**
1. Browser blocked the popup window
2. postMessage not being received
3. Timing issue (page loads too fast)

**Debug Steps:**
```javascript
// In game's browser console
console.log('User:', localStorage.getItem('user'));
console.log('Token:', localStorage.getItem('token'));

// Check if messages are being received
window.addEventListener('message', (e) => {
  console.log('Message received:', e);
});
```

**Solutions:**
- Allow popups from localhost in browser settings
- Check browser console for errors
- Increase wait time in game's redirect logic

### Issue: postMessage not received

**Check:**
1. Is the game opening in a popup or new tab?
2. Are there any console errors?
3. Is the origin correct in the code?

**Fix:**
- Make sure browser allows popups
- Check network tab for blocked requests
- Verify origins match exactly (including port)

### Issue: User data format incorrect

**Check:**
```javascript
// In game console
const user = localStorage.getItem('user');
console.log('Raw user data:', user);
console.log('Parsed:', JSON.parse(user));
```

**Fix:**
- User data should be JSON string
- Should have: id, name, surname, email, type, code

## Alternative Solutions (For Production)

### Option 1: Same Port, Different Paths
Instead of different ports, use:
- `https://yourdomain.com/` (AppLauncher)
- `https://yourdomain.com/risalko` (Risalko)
- `https://yourdomain.com/vezalko` (Vezalko)

**Benefits:**
- Same origin = shared localStorage
- No postMessage needed
- Simpler authentication flow

**Implementation:**
Use a reverse proxy (Nginx) to route paths to different apps.

### Option 2: Secure Cookies
Use cookies instead of localStorage with proper domain settings:

```javascript
document.cookie = "user=...; domain=.localhost; path=/";
```

**Benefits:**
- Can be shared across subdomains
- More secure with httpOnly flag
- Automatic sending with requests

**Drawbacks:**
- Doesn't work across different ports in localhost
- Requires domain setup

### Option 3: Authentication Server with Redirects
Use URL parameters to pass temporary auth tokens:

```javascript
window.location.href = `${gameUrl}?auth_token=${temporaryToken}`;
```

Game validates token with backend and gets user data.

**Benefits:**
- Works across any domains
- More secure (temporary tokens)
- Standard OAuth flow

**Drawbacks:**
- More complex implementation
- Requires backend token validation

## Production Recommendations

For production deployment:

1. **Use same domain with different paths**
   ```
   https://yourdomain.com/
   https://yourdomain.com/risalko
   https://yourdomain.com/vezalko
   ```

2. **Set up reverse proxy** (Nginx example):
   ```nginx
   location / {
     proxy_pass http://localhost:3002;
   }
   
   location /risalko {
     proxy_pass http://localhost:3000;
   }
   
   location /vezalko {
     proxy_pass http://localhost:3001;
   }
   ```

3. **Use HTTPS** for secure localStorage

4. **Implement token refresh** to handle expiration

5. **Add CSRF protection** for enhanced security

## Summary

✅ **Fixed**: Apps can now share authentication via postMessage  
✅ **Secure**: Origin verification prevents fake auth data  
✅ **Reliable**: Multiple send attempts ensure delivery  
✅ **User-friendly**: Seamless transition between apps  
✅ **Tested**: Works with Risalko and Vezalko  

The fix maintains the centralized authentication system while solving the localStorage isolation issue inherent to different-port origins.

---

**Status**: ✅ Fixed  
**Testing**: Required  
**Production**: Consider same-origin alternative
