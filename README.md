# RUPS-Final

Educational Gaming Platform with Unified Authentication

## Overview

This project consists of three integrated applications:

1. **AppLauncher** - Unified authentication and game selection hub
2. **Risalko** - Story Drawing & Visualization Game
3. **Vezalko** - Circuit Building Educational Game

All applications share a common authentication system powered by the Vezalko backend.

## Project Structure

```
RUPS-Final/
├── AppLauncher/          # Main entry point with login/register
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   ├── config/      # API and game configuration
│   │   ├── hooks/       # React hooks (useAuth)
│   │   └── utils/       # Utility functions
│   └── README.md
│
├── Risalko/             # Story drawing game
│   ├── frontend/        # Next.js frontend
│   └── backend/         # Python Flask backend
│
└── Vezalko/             # Circuit building game
    ├── src/             # Phaser.js game frontend
    └── backend/         # FastAPI backend (main auth server)
```

## Quick Start

### 1. Start the Backend (Required)

```bash
cd Vezalko/backend
pip install -r requirements.txt
python main.py
```

Backend runs on `http://127.0.0.1:8000`

### 2. Start AppLauncher (Main Entry Point)

```bash
cd AppLauncher
npm install
npm run dev
```

AppLauncher runs on `http://localhost:3002`

### 3. Start the Games (Optional)

#### Risalko
```bash
cd Risalko/frontend
npm install
npm run dev
```
Runs on `http://localhost:3000`

#### Vezalko
```bash
cd Vezalko
npm install
npm run dev
```
Runs on `http://localhost:3001`

## Authentication System

### Architecture

- **AppLauncher**: Handles all user login/registration
- **Vezalko Backend**: Provides authentication API (JWT tokens)
- **Games**: Inherit authentication from AppLauncher via localStorage

### User Types

1. **Teachers**: 
   - Register with email/password
   - Can create classes and manage students
   - Full access to both games

2. **Students**: 
   - Login with unique code (provided by teacher)
   - Access games assigned by teacher

### Authentication Flow

```
User → AppLauncher → Login/Register → Vezalko Backend
                                           ↓
                                    JWT Token + User Data
                                           ↓
                                    localStorage
                                           ↓
                              Games access user session
```

## Features

### AppLauncher
- ✅ Unified login/register interface
- ✅ Teacher and student login modes
- ✅ Session persistence
- ✅ Game selection dashboard
- ✅ Responsive design

### Risalko
- 📝 Story-based drawing exercises
- 👥 Class management
- 📊 Student progress tracking
- 🎨 Interactive drawing canvas

### Vezalko
- ⚡ Circuit building workspace
- 🧩 Logic gate challenges
- 🎯 Progressive difficulty levels
- 📈 Performance analytics

## Configuration

### API Endpoints

Configure backend URL in `AppLauncher/src/config/api.ts`:

```typescript
export const API_BASE_URL = "http://127.0.0.1:8000";
```

### Game URLs

Configure game URLs in `AppLauncher/src/config/games.ts`:

```typescript
export const games: GameConfig[] = [
  {
    name: "risalko",
    title: "Risalko",
    url: "http://localhost:3000",
    color: "#667eea",
  },
  {
    name: "vezalko",
    title: "Vezalko",
    url: "http://localhost:3001",
    color: "#764ba2",
  },
];
```

## Documentation

- [AppLauncher Setup Guide](./AppLauncher/SETUP.md)
- [AppLauncher README](./AppLauncher/README.md)
- [Vezalko README](./Vezalko/README.md)
- [Risalko Backend](./Risalko/backend/)

## Development

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: FastAPI (Python), SQLite
- **Game Engine**: Phaser.js (Vezalko)
- **Authentication**: JWT tokens
- **Styling**: CSS Modules

### Port Allocation

- `3002` - AppLauncher (main entry)
- `3000` - Risalko frontend
- `3001` - Vezalko frontend
- `8000` - Vezalko backend (auth server)
- `5000` - Risalko backend (if needed)

## Usage

### For Teachers

1. Navigate to `http://localhost:3002`
2. Register a new account (select "Teacher")
3. Login and select a game
4. Create classes and add students through game interface
5. Students receive unique codes for login

### For Students

1. Navigate to `http://localhost:3002`
2. Click "Student" tab on login page
3. Enter code provided by teacher
4. Select and play assigned games

## Troubleshooting

### Backend Not Running
```bash
cd Vezalko/backend
python main.py
```

### Port Already in Use
```bash
# Kill process on port 3002
lsof -ti:3002 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3002   # Windows
```

### Authentication Issues
1. Clear browser localStorage
2. Restart backend server
3. Check backend logs for errors
4. Verify CORS configuration

### Games Not Loading
1. Ensure game servers are running
2. Check URLs in `AppLauncher/src/config/games.ts`
3. Verify network connectivity

## Migration Notes

### Changes from Previous Setup

**Before**: Each game had its own login/register pages

**After**: 
- ✅ Centralized authentication in AppLauncher
- ✅ Single backend (Vezalko) handles all auth
- ✅ Games inherit authentication via localStorage
- ✅ Removed duplicate login pages from games

### Breaking Changes

- Games no longer have standalone login pages
- Must access games through AppLauncher
- All authentication goes through Vezalko backend

## Contributing

This is an educational project. When making changes:

1. Test authentication flow thoroughly
2. Ensure all three apps work together
3. Update documentation
4. Check CORS settings for new endpoints

## License

Educational project for FERI university coursework.

## Support

For issues:
1. Check documentation in respective folders
2. Verify all services are running
3. Check browser console for errors
4. Review backend logs