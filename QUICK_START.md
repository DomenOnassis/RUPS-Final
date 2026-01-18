# Quick Start Guide

Get up and running with RUPS-Final in 5 minutes!

## Prerequisites

- ✅ Python 3.8+
- ✅ Node.js 20+
- ✅ npm or yarn

## 🚀 Fast Start (3 Steps)

### Step 1: Start Backend (Required)

```bash
cd Vezalko/backend
pip install -r requirements.txt
python main.py
```

✅ Backend running on `http://127.0.0.1:8000`

### Step 2: Start AppLauncher (Main Entry)

```bash
cd AppLauncher
npm install
npm run dev
```

✅ AppLauncher running on `http://localhost:3002`

### Step 3: Open Browser

Navigate to: **http://localhost:3002**

🎉 Done! Register and start playing!

---

## 🎮 Optional: Start Games

### Risalko (Story Drawing)

```bash
cd Risalko/frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`

### Vezalko (Circuit Building)

```bash
cd Vezalko
npm install
npm run dev
```

Runs on `http://localhost:3001`

---

## 📝 First Time Setup

### Create Teacher Account

1. Go to `http://localhost:3002`
2. Click **"Register here"**
3. Fill in your details
4. Select **"Teacher"**
5. Click **"Register"**

✅ You're logged in!

### Create Student Account

Students are created by teachers through the game interfaces. Each student gets a unique code.

### Student Login

1. Go to `http://localhost:3002`
2. Click **"Student"** tab
3. Enter your code
4. Click **"Sign In"**

---

## 🔧 Using Startup Scripts

### macOS/Linux

```bash
./start-dev.sh
```

### Windows

```cmd
start-dev.bat
```

These scripts automatically start the backend and AppLauncher.

---

## 🎯 Port Reference

| Service | Port | URL |
|---------|------|-----|
| AppLauncher | 3002 | http://localhost:3002 |
| Risalko | 3000 | http://localhost:3000 |
| Vezalko | 3001 | http://localhost:3001 |
| Backend API | 8000 | http://127.0.0.1:8000 |
| API Docs | 8000 | http://127.0.0.1:8000/docs |

---

## ❓ Troubleshooting

### "Connection error" on login

**Fix**: Make sure backend is running
```bash
cd Vezalko/backend
python main.py
```

### Port already in use

**macOS/Linux**:
```bash
lsof -ti:3002 | xargs kill -9
```

**Windows**:
```cmd
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

### "Module not found" errors

**Fix**: Install dependencies
```bash
npm install
```

### Backend errors

**Fix**: Check Python dependencies
```bash
pip install -r requirements.txt
```

---

## 📚 Documentation

- [README.md](./README.md) - Full overview
- [AppLauncher/SETUP.md](./AppLauncher/SETUP.md) - Detailed setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration info

---

## 🎓 User Guide

### For Teachers

1. **Register** at AppLauncher
2. **Login** with email/password
3. **Select a game** from dashboard
4. **Create classes** in the game
5. **Add students** and get their codes
6. **Track progress** through game interface

### For Students

1. **Get your code** from teacher
2. **Login** at AppLauncher with code
3. **Select a game** from dashboard
4. **Complete assignments** in the game
5. **View your progress**

---

## 🔐 Default Credentials

There are no default credentials. You must register a new account.

**First Teacher Account**:
1. Visit AppLauncher
2. Click "Register"
3. Create your account

**Student Accounts**:
- Created by teachers
- Login with unique code

---

## 🛠️ Development

### Project Structure

```
RUPS-Final/
├── AppLauncher/     # Main entry (Port 3002)
├── Risalko/         # Story game (Port 3000)
├── Vezalko/         # Circuit game (Port 3001)
│   └── backend/     # Auth server (Port 8000)
└── docs/            # Documentation
```

### Making Changes

1. **Backend changes**: Restart backend server
2. **Frontend changes**: Auto-reload (hot module replacement)
3. **Config changes**: Restart affected service

### Testing

```bash
# Test backend
cd Vezalko/backend
python -m pytest

# Test frontend
cd AppLauncher
npm test
```

---

## 🚀 Production Deployment

### Build for Production

```bash
# AppLauncher
cd AppLauncher
npm run build
npm start

# Risalko
cd Risalko/frontend
npm run build
npm start

# Vezalko
cd Vezalko
npm run build
npm run preview
```

### Environment Variables

Create `.env.local` files:

```env
NEXT_PUBLIC_API_URL=https://your-api.com
NEXT_PUBLIC_RISALKO_URL=https://risalko.your-domain.com
NEXT_PUBLIC_VEZALKO_URL=https://vezalko.your-domain.com
```

---

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Can't login | Check backend is running |
| Games not loading | Verify game servers are running |
| CORS errors | Check backend CORS config |
| Session lost | Check localStorage in browser |

### Getting Help

1. Check documentation
2. Review error messages
3. Check browser console
4. Check backend logs
5. Review this guide

---

## ✅ Checklist

Before starting development:

- [ ] Python 3.8+ installed
- [ ] Node.js 20+ installed
- [ ] Git repository cloned
- [ ] Dependencies installed
- [ ] Backend running (Port 8000)
- [ ] AppLauncher running (Port 3002)
- [ ] Browser opened to http://localhost:3002
- [ ] Account created

---

## 🎉 You're Ready!

Everything is set up! Start by:

1. Creating a teacher account
2. Exploring both games
3. Creating a test class
4. Adding test students
5. Testing student login

Happy coding! 🚀

---

## Quick Commands Reference

```bash
# Start backend
cd Vezalko/backend && python main.py

# Start AppLauncher
cd AppLauncher && npm run dev

# Start Risalko
cd Risalko/frontend && npm run dev

# Start Vezalko
cd Vezalko && npm run dev

# Install all dependencies
cd AppLauncher && npm install
cd ../Risalko/frontend && npm install
cd ../../Vezalko && npm install
cd backend && pip install -r requirements.txt

# View API docs
open http://127.0.0.1:8000/docs

# Clear localStorage (browser console)
localStorage.clear()
```

---

**Last Updated**: 2026-01-18  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
