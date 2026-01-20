# App Launcher

A unified authentication and game selection hub for the Risalko and Vezalko educational games.

## Overview

AppLauncher serves as the main entry point for accessing both Risalko (Story Drawing & Visualization Game) and Vezalko (Circuit Building Educational Game). It provides a centralized authentication system using the Vezalko backend.

## Features

- **Unified Authentication**: Single login/register system for both games
- **Multi-User Support**: Separate login flows for students (via code) and teachers (via email/password)
- **Modern UI**: Clean, responsive design with gradient styling
- **Session Management**: Automatic login state persistence using localStorage
- **Protected Routes**: Redirects unauthenticated users to login page

## Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Running Vezalko backend server on port 8000

## Installation

```bash
cd AppLauncher
npm install
```

## Configuration

### API Configuration

Update the backend URL in `src/config/api.ts` if needed:

```typescript
export const API_BASE_URL = "http://127.0.0.1:8000";
```

### Game URLs

Update game URLs in `src/config/games.ts`:

```typescript
export const games: GameConfig[] = [
  {
    name: "risalko",
    title: "Risalko",
    description: "Story Drawing & Visualization Game",
    url: "http://localhost:3000",
    color: "#667eea",
  },
  {
    name: "vezalko",
    title: "Vezalko",
    description: "Circuit Building Educational Game",
    url: "http://localhost:3001",
    color: "#764ba2",
  },
];
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start on `http://localhost:3002`

### Production Build

```bash
npm run build
npm start
```

## Usage

### For Teachers

1. Navigate to `http://localhost:3002`
2. Click "Register" to create a new account
3. Fill in your details and select "Teacher"
4. After registration, you'll be automatically logged in
5. Select which game to play from the dashboard

### For Students

1. Navigate to `http://localhost:3002`
2. Click the "Student" tab on the login page
3. Enter your student code (provided by your teacher)
4. Select which game to play from the dashboard

### Logging Out

Click the "Logout" button in the top-right corner of the dashboard to end your session.

## Project Structure

```
AppLauncher/
├── src/
│   ├── app/
│   │   ├── login/              # Login page with student/teacher toggle
│   │   ├── register/           # Registration page
│   │   ├── page.tsx            # Main dashboard (game selection)
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   └── config/
│       ├── api.ts              # API endpoint configuration
│       └── games.ts            # Game configuration
├── package.json
└── README.md
```

## Backend Integration

The AppLauncher connects to the Vezalko backend API:

- **POST** `/api/login` - User login (email/password or student code)
- **POST** `/api/register` - User registration
- **GET** `/api/verify-token` - Token verification (optional)

### Authentication Flow

1. User submits login/register form
2. Request sent to Vezalko backend
3. Backend returns user data and JWT token
4. Token and user data stored in localStorage
5. User redirected to dashboard
6. Dashboard checks localStorage for authentication

## Styling

The application uses CSS Modules for component-specific styling and maintains a consistent gradient theme:

- Primary gradient: `#667eea → #764ba2`
- Clean, modern card-based design
- Responsive layout for mobile and desktop
- Smooth transitions and hover effects

## Important Notes

1. **Backend Dependency**: The Vezalko backend must be running on port 8000 for authentication to work
2. **CORS**: The backend has CORS enabled to allow requests from the frontend
3. **LocalStorage**: User sessions are stored in browser localStorage
4. **No Separate Auth in Games**: Risalko and Vezalko no longer need their own login pages - they inherit authentication from AppLauncher

## Troubleshooting

### "Connection error" on login
- Ensure Vezalko backend is running: `cd ../Vezalko/backend && python main.py`
- Check that backend is accessible at `http://127.0.0.1:8000`

### Redirects to login immediately
- Check browser console for localStorage errors
- Try clearing localStorage and logging in again

### Games not accessible
- Verify game URLs in `src/config/games.ts` match your running instances
- Ensure Risalko (port 3000) and Vezalko (port 3001) are running

## Development

### Adding New Games

Edit `src/config/games.ts` and add a new game object:

```typescript
{
  name: "newgame",
  title: "New Game",
  description: "Description here",
  url: "http://localhost:3003",
  color: "#your-color-hex",
}
```

### Customizing Styles

- Global styles: `src/app/globals.css`
- Page-specific: `*.module.css` files in respective directories
- Color scheme: Update gradient values in CSS files

## Technologies Used

- **Next.js 15.5** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **CSS Modules** - Scoped styling
- **FastAPI** (Backend) - Python API framework

## License

Part of the RUPS-Final project for educational purposes.
