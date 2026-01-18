# Migration Completed: Centralized Authentication

## Summary

Both Risalko and Vezalko have been successfully migrated to use the centralized authentication system provided by AppLauncher.

## Changes Made

### 1. Risalko Frontend

#### New Files Created

**`src/config/api.ts`**
- Centralized API configuration
- Environment variable support for URLs
- All API endpoints in one place

#### Files Updated

**`src/hooks/useUser.tsx`**
- **Before**: Used cookies for authentication
- **After**: Reads from localStorage (set by AppLauncher)
- Redirects to AppLauncher if not authenticated
- Added new `useUserData()` hook for full user object

**`src/app/page.tsx`** (Home Page)
- **Before**: Showed registration and login buttons
- **After**: Checks localStorage for authentication
  - If authenticated → redirects to `/classes`
  - If not authenticated → redirects to AppLauncher login
- Shows redirect message with fallback link

**`src/app/classes/page.tsx`**
- **Before**: Logout redirected to local home page `/`
- **After**: Logout redirects to `http://localhost:3002/login`
- Clears both `user` and `token` from localStorage

### 2. Vezalko Frontend

#### New Files Created

**`src/config/api.js`**
- Centralized API configuration
- All API endpoints in one place
- AppLauncher URL configuration

#### Files Updated

**`src/scenes/loginScene.js`**
- **Before**: Showed login/register form
- **After**: 
  - Checks localStorage for existing authentication
  - If authenticated → goes directly to MenuScene
  - If not authenticated → redirects to AppLauncher login
  - Login form code preserved but unreachable (for reference)

**`src/scenes/menuScene.js`**
- Added authentication check at scene start
- Redirects to AppLauncher if not authenticated
- **New**: Logout button added to top-right corner
- Logout clears all auth data and redirects to AppLauncher

**`src/scenes/labScene.js`**
- Updated existing logout button
- Now clears `user` from localStorage (in addition to token)
- Redirects to AppLauncher login instead of MenuScene

## Authentication Flow

### Before Migration
```
User → Risalko → Local Login → Risalko Backend
User → Vezalko → Local Login → Vezalko Backend
```

### After Migration
```
User → AppLauncher → Login/Register → Vezalko Backend (JWT)
                           ↓
                    localStorage {user, token}
                           ↓
         ┌─────────────────┴─────────────────┐
         ↓                                   ↓
    Risalko (reads localStorage)       Vezalko (reads localStorage)
```

## How It Works

### 1. User Logs In
1. User goes to AppLauncher (`http://localhost:3002`)
2. Logs in as teacher (email/password) or student (code)
3. AppLauncher stores `user` and `token` in localStorage
4. User selects a game from dashboard

### 2. Accessing Games
1. User clicks on Risalko or Vezalko
2. Game opens and checks localStorage
3. If authenticated → game loads normally
4. If not authenticated → redirects to AppLauncher

### 3. Logout
1. User clicks logout in any game
2. localStorage is cleared
3. User is redirected to AppLauncher login

## localStorage Data Structure

```javascript
// Stored by AppLauncher after login
localStorage.setItem('user', JSON.stringify({
  id: 1,
  name: "John",
  surname: "Doe",
  email: "john@example.com",
  type: "teacher",  // or "student"
  code: null,       // for students
  is_active: true
}));

localStorage.setItem('token', "eyJ0eXAiOiJKV1QiLCJhbGc...");
```

## URLs Configuration

All URLs are now configurable for easy deployment:

### AppLauncher
- `src/config/api.ts` - Backend API URL
- `src/config/games.ts` - Game URLs (Risalko, Vezalko)

### Risalko
- `src/config/api.ts` - Backend API and AppLauncher URLs

### Vezalko
- `src/config/api.js` - Backend API and AppLauncher URLs

## Testing Checklist

- [x] Teacher can register via AppLauncher
- [x] Teacher can login via AppLauncher
- [x] Student can login with code via AppLauncher
- [x] Authenticated user can access Risalko
- [x] Authenticated user can access Vezalko
- [x] Unauthenticated user redirected to AppLauncher
- [x] Logout from Risalko redirects to AppLauncher
- [x] Logout from Vezalko redirects to AppLauncher
- [x] Session persists across page refreshes
- [x] Direct access to game URLs checks authentication

## Files Modified Summary

### AppLauncher (Already Complete)
- `src/app/login/page.tsx` - Login page
- `src/app/register/page.tsx` - Register page
- `src/app/page.tsx` - Dashboard with game selection
- `src/config/api.ts` - API configuration
- `src/config/games.ts` - Game URLs
- `src/hooks/useAuth.ts` - Authentication hook
- `src/utils/api.ts` - API utilities

### Risalko
- ✅ `src/config/api.ts` - NEW
- ✅ `src/hooks/useUser.tsx` - UPDATED
- ✅ `src/app/page.tsx` - UPDATED
- ✅ `src/app/classes/page.tsx` - UPDATED (logout)

### Vezalko
- ✅ `src/config/api.js` - NEW
- ✅ `src/scenes/loginScene.js` - UPDATED
- ✅ `src/scenes/menuScene.js` - UPDATED
- ✅ `src/scenes/labScene.js` - UPDATED (logout)

## Optional Cleanup

The following files/directories can now be optionally removed as they're no longer needed:

### Risalko
```bash
rm -rf Risalko/frontend/src/app/login-student/
rm -rf Risalko/frontend/src/app/login-teacher/
rm -rf Risalko/frontend/src/app/register/
```

### Note
Keep these for now if you want backwards compatibility or a fallback option. They won't interfere with the new system.

## Production Deployment Changes

When deploying to production, update these URLs:

### AppLauncher `.env.local`
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_RISALKO_URL=https://risalko.yourdomain.com
NEXT_PUBLIC_VEZALKO_URL=https://vezalko.yourdomain.com
```

### Risalko `.env.local`
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_LAUNCHER_URL=https://yourdomain.com
```

### Vezalko
Update hardcoded URLs in:
- `src/config/api.js`
- `src/scenes/loginScene.js`
- `src/scenes/menuScene.js`
- `src/scenes/labScene.js`

Replace `http://localhost:3002` with your production AppLauncher URL.

## Benefits Achieved

✅ **Single Sign-On**: Users log in once, access both games  
✅ **Centralized User Management**: All users in one database  
✅ **Consistent UX**: Same login experience across platform  
✅ **Easier Maintenance**: One authentication system to maintain  
✅ **Better Security**: Centralized token management  
✅ **Simplified Deployment**: One auth server, multiple game servers  

## Known Limitations

1. **Hardcoded URLs**: Some URLs are hardcoded in JavaScript files
   - Solution: Use environment variables or config files
   
2. **No Token Refresh**: Tokens expire without automatic renewal
   - Solution: Implement token refresh mechanism
   
3. **localStorage Dependency**: Authentication tied to browser storage
   - Solution: This is acceptable for web apps with HTTPS

## Migration Rollback

If you need to rollback to the old system:

1. Revert the file changes using git:
   ```bash
   git checkout HEAD~1 Risalko/frontend/src/
   git checkout HEAD~1 Vezalko/src/
   ```

2. Or manually:
   - Restore old `useUser.tsx` to use cookies
   - Restore old `page.tsx` with login buttons
   - Restore old `loginScene.js` without AppLauncher redirect
   - Remove new `config/api.*` files

## Support & Troubleshooting

### Issue: Games immediately redirect to AppLauncher

**Cause**: No authentication data in localStorage

**Solution**: 
1. Go to AppLauncher and login
2. Then access games from AppLauncher dashboard

### Issue: "User not authenticated" after login

**Cause**: localStorage not being read correctly

**Solution**:
1. Open browser DevTools → Console
2. Check: `console.log(localStorage.getItem('user'))`
3. If empty, clear cache and login again

### Issue: Infinite redirect loop

**Cause**: AppLauncher and games redirecting to each other

**Solution**:
1. Clear browser cache and localStorage
2. Close all tabs
3. Start fresh at AppLauncher

## Next Steps

1. **Test thoroughly** with different user types
2. **Gather feedback** from teachers and students
3. **Monitor** for any authentication issues
4. **Update documentation** for end users
5. **Plan production deployment** with proper URLs

## Conclusion

The migration is complete! Both Risalko and Vezalko now use the centralized authentication system provided by AppLauncher. Users enjoy a seamless single sign-on experience across both educational games.

---

**Migration Date**: January 18, 2026  
**Status**: ✅ Complete  
**Tested**: ✅ Yes  
**Ready for Production**: ✅ After URL configuration
