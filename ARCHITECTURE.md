# System Architecture

## Overview

The RUPS-Final project is a unified educational gaming platform consisting of three main components that work together to provide a seamless authentication and gaming experience.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              AppLauncher (Port 3002)                    │    │
│  │              Next.js Application                        │    │
│  │                                                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │    │
│  │  │ Login Page   │  │Register Page │  │  Dashboard  │ │    │
│  │  │              │  │              │  │             │ │    │
│  │  │ • Teacher    │  │ • Name       │  │ • Risalko   │ │    │
│  │  │ • Student    │  │ • Email      │  │ • Vezalko   │ │    │
│  │  │              │  │ • Password   │  │ • Logout    │ │    │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │    │
│  │                                                         │    │
│  │  localStorage: { user, token }                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ HTTP Requests                     │
│                              ↓                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────┐    │
│  │         Vezalko Backend (Port 8000)                     │    │
│  │         FastAPI + SQLite                                │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐ │    │
│  │  │           Authentication Service                  │ │    │
│  │  │                                                   │ │    │
│  │  │  • POST /api/login                               │ │    │
│  │  │  • POST /api/register                            │ │    │
│  │  │  • GET  /api/verify-token                        │ │    │
│  │  │                                                   │ │    │
│  │  │  JWT Token Generation & Validation               │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐ │    │
│  │  │              User Management                      │ │    │
│  │  │                                                   │ │    │
│  │  │  • User CRUD operations                          │ │    │
│  │  │  • Password hashing (bcrypt)                     │ │    │
│  │  │  • Student code generation                       │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐ │    │
│  │  │              Database (SQLite)                    │ │    │
│  │  │                                                   │ │    │
│  │  │  Tables:                                          │ │    │
│  │  │  • users                                          │ │    │
│  │  │  • classes                                        │ │    │
│  │  │  • stories                                        │ │    │
│  │  │  • paragraphs                                     │ │    │
│  │  │  • circuits                                       │ │    │
│  │  │  • challenges                                     │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  │                                                         │    │
│  │  CORS: Allow all origins (development)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                         GAME FRONTENDS                           │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │  Risalko (Port 3000)     │  │  Vezalko (Port 3001)     │    │
│  │  Next.js                 │  │  Phaser.js + Vite        │    │
│  │                          │  │                          │    │
│  │  • Story Management      │  │  • Circuit Builder       │    │
│  │  • Drawing Canvas        │  │  • Logic Gates           │    │
│  │  • Class Management      │  │  • Challenges            │    │
│  │  • Student Progress      │  │  • Scoreboard            │    │
│  │                          │  │                          │    │
│  │  Reads localStorage      │  │  Reads localStorage      │    │
│  │  { user, token }         │  │  { user, token }         │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Teacher Registration & Login

```
┌──────┐                ┌──────────────┐              ┌─────────────┐
│ User │                │ AppLauncher  │              │   Backend   │
└──┬───┘                └──────┬───────┘              └──────┬──────┘
   │                           │                             │
   │ 1. Visit /register        │                             │
   ├──────────────────────────►│                             │
   │                           │                             │
   │ 2. Fill form              │                             │
   │    (name, email, pass)    │                             │
   ├──────────────────────────►│                             │
   │                           │                             │
   │                           │ 3. POST /api/register       │
   │                           ├────────────────────────────►│
   │                           │                             │
   │                           │                             │ 4. Hash password
   │                           │                             │    Create user
   │                           │                             │    Generate JWT
   │                           │                             │
   │                           │ 5. Return user + token      │
   │                           │◄────────────────────────────┤
   │                           │                             │
   │                           │ 6. Store in localStorage    │
   │                           │    - user data              │
   │                           │    - JWT token              │
   │                           │                             │
   │ 7. Redirect to dashboard  │                             │
   │◄──────────────────────────┤                             │
   │                           │                             │
```

### Student Login

```
┌─────────┐              ┌──────────────┐              ┌─────────────┐
│ Student │              │ AppLauncher  │              │   Backend   │
└────┬────┘              └──────┬───────┘              └──────┬──────┘
     │                          │                             │
     │ 1. Visit /login          │                             │
     ├─────────────────────────►│                             │
     │                          │                             │
     │ 2. Click "Student" tab   │                             │
     ├─────────────────────────►│                             │
     │                          │                             │
     │ 3. Enter student code    │                             │
     ├─────────────────────────►│                             │
     │                          │                             │
     │                          │ 4. POST /api/login          │
     │                          │    { code: "ABC123" }       │
     │                          ├────────────────────────────►│
     │                          │                             │
     │                          │                             │ 5. Validate code
     │                          │                             │    Find user
     │                          │                             │    Generate JWT
     │                          │                             │
     │                          │ 6. Return user + token      │
     │                          │◄────────────────────────────┤
     │                          │                             │
     │                          │ 7. Store in localStorage    │
     │                          │                             │
     │ 8. Redirect to dashboard │                             │
     │◄─────────────────────────┤                             │
     │                          │                             │
```

### Game Access Flow

```
┌──────┐         ┌──────────────┐         ┌─────────┐         ┌─────────────┐
│ User │         │ AppLauncher  │         │  Game   │         │   Backend   │
└──┬───┘         └──────┬───────┘         └────┬────┘         └──────┬──────┘
   │                    │                      │                     │
   │ 1. Click game      │                      │                     │
   ├───────────────────►│                      │                     │
   │                    │                      │                     │
   │                    │ 2. Redirect to game  │                     │
   │                    │      with session    │                     │
   │                    ├─────────────────────►│                     │
   │                    │                      │                     │
   │                    │                      │ 3. Read localStorage│
   │                    │                      │    { user, token }  │
   │                    │                      │                     │
   │                    │                      │ 4. Verify token     │
   │                    │                      ├────────────────────►│
   │                    │                      │                     │
   │                    │                      │ 5. Token valid      │
   │                    │                      │◄────────────────────┤
   │                    │                      │                     │
   │                    │                      │ 6. Load game        │
   │                    │                      │    with user data   │
   │                    │                      │                     │
   │ 7. Play game       │                      │                     │
   │◄──────────────────────────────────────────┤                     │
   │                    │                      │                     │
```

## Data Flow

### User Data Storage

```
┌─────────────────────────────────────────────────────────┐
│                  Browser localStorage                    │
│                                                          │
│  user: {                                                 │
│    id: 1,                                                │
│    name: "John",                                         │
│    surname: "Doe",                                       │
│    email: "john@example.com",                            │
│    type: "teacher",                                      │
│    code: null,                                           │
│    is_active: true                                       │
│  }                                                       │
│                                                          │
│  token: "eyJ0eXAiOiJKV1QiLCJhbGc..."                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │ Write on login                    │ Read on page load
         │                                    │
    ┌────┴────────┐                    ┌─────┴──────┐
    │ AppLauncher │                    │   Games    │
    └─────────────┘                    └────────────┘
```

### API Request Flow

```
Frontend                    Backend
   │                           │
   │  POST /api/login          │
   ├──────────────────────────►│
   │  {                        │
   │    email: "...",          │
   │    password: "..."        │
   │  }                        │
   │                           │
   │                           │ 1. Validate credentials
   │                           │ 2. Query database
   │                           │ 3. Verify password hash
   │                           │ 4. Generate JWT token
   │                           │
   │  Response                 │
   │◄──────────────────────────┤
   │  {                        │
   │    data: { user },        │
   │    access_token: "...",   │
   │    token_type: "bearer"   │
   │  }                        │
   │                           │
```

## Security Architecture

### Password Security

```
User Password
     ↓
bcrypt hash with salt
     ↓
Stored in database
     ↓
Never transmitted back to client
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user@example.com",
    "user_id": 1,
    "exp": 1640000000
  },
  "signature": "..."
}
```

### CORS Configuration

```python
# Vezalko Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    surname VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    type VARCHAR NOT NULL,  -- 'student' or 'teacher'
    code VARCHAR UNIQUE,    -- For student login
    is_active BOOLEAN DEFAULT TRUE
);
```

### Classes Table

```sql
CREATE TABLE classes (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    teacher_id INTEGER,
    created_at TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);
```

## Technology Stack

### Frontend Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| AppLauncher | Next.js 15 | Main authentication hub |
| Risalko | Next.js | Story drawing game |
| Vezalko | Phaser.js + Vite | Circuit building game |
| Styling | CSS Modules | Component-scoped styles |
| State | React Hooks | Local state management |

### Backend Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Framework | FastAPI | REST API endpoints |
| Database | SQLite | Data persistence |
| ORM | SQLModel | Database models |
| Auth | JWT | Token-based authentication |
| Password | bcrypt | Password hashing |

## Deployment Architecture

### Development

```
localhost:3002  →  AppLauncher
localhost:3000  →  Risalko
localhost:3001  →  Vezalko
localhost:8000  →  Backend API
```

### Production (Recommended)

```
https://yourdomain.com/              →  AppLauncher
https://yourdomain.com/risalko       →  Risalko
https://yourdomain.com/vezalko       →  Vezalko
https://api.yourdomain.com           →  Backend API
```

## Key Design Decisions

### 1. Centralized Authentication
- **Why**: Avoid duplicate login systems
- **Benefit**: Single source of truth for user sessions
- **Trade-off**: Games depend on AppLauncher

### 2. localStorage for Session
- **Why**: Simple, works across same-origin apps
- **Benefit**: No server-side session management
- **Trade-off**: Not secure for sensitive data (use HTTPS)

### 3. JWT Tokens
- **Why**: Stateless authentication
- **Benefit**: Scalable, no server-side session storage
- **Trade-off**: Cannot revoke without additional logic

### 4. Vezalko Backend as Auth Server
- **Why**: Already had robust FastAPI setup
- **Benefit**: Reuse existing infrastructure
- **Trade-off**: Vezalko backend is critical dependency

## Future Improvements

1. **Token Refresh**: Implement refresh token mechanism
2. **Session Expiry**: Add automatic logout on token expiry
3. **Multi-factor Auth**: Add 2FA for teacher accounts
4. **Social Login**: Google/Microsoft OAuth integration
5. **Database**: Migrate from SQLite to PostgreSQL
6. **Caching**: Add Redis for session caching
7. **Monitoring**: Add logging and error tracking
8. **Testing**: Add integration tests for auth flow
