# Vezalko 2.0 - React/Next.js Circuit Simulator

A modern reimplementation of Vezalko using React and Next.js with Konva for canvas rendering.

## Features

- **Electric Circuit Builder**: Build circuits with batteries, bulbs, resistors, switches, and wires
- **Logic Gate Builder**: Create logic circuits with AND, OR, NOT, NAND, NOR, XOR, XNOR gates
- **Real-time Simulation**: Circuits simulate automatically as you build
- **Challenge Mode**: Complete challenges to earn points
- **Sandbox Mode**: Free exploration and experimentation
- **Leaderboard**: See top players and their scores
- **Responsive Design**: Works on desktop and tablets

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Konva / React-Konva** - Canvas rendering
- **Zustand** - State management

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd Vezalko-2
npm install
```

### Development

```bash
npm run dev
```

The app will run on [http://localhost:3001](http://localhost:3001)

### Backend

This frontend uses the same backend as the original Vezalko. Make sure the backend is running:

```bash
cd ../Vezalko/backend
pip install -r requirements.txt
python main.py
```

Backend runs on [http://localhost:8000](http://localhost:8000)

## Project Structure

```
Vezalko-2/
├── public/
│   └── assets/          # Component images (battery, bulb, etc.)
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── page.tsx     # Home (redirect)
│   │   ├── login/       # Login page
│   │   ├── menu/        # Main menu
│   │   ├── lab/         # Lab/hub page
│   │   ├── challenges/  # Challenge selection
│   │   ├── scoreboard/  # Leaderboard
│   │   └── workspace/   # Circuit workspaces
│   │       ├── electric/
│   │       └── logic/
│   ├── components/      # React components
│   │   ├── ElectricWorkspace.tsx
│   │   ├── LogicWorkspace.tsx
│   │   └── Modal.tsx
│   ├── config/          # API configuration
│   ├── hooks/           # Custom hooks
│   ├── logic/           # Circuit simulation logic
│   │   ├── Node.ts
│   │   ├── CircuitGraph.ts
│   │   └── LogicCircuitGraph.ts
│   └── store/           # Zustand stores
│       ├── authStore.ts
│       ├── workspaceStore.ts
│       └── logicWorkspaceStore.ts
└── package.json
```

## Usage

1. **Login**: Authenticate through the App Launcher
2. **Menu**: Power on the switch and click Start
3. **Lab**: Choose workspace type (Electric or Logic)
4. **Mode**: Select Sandbox or Challenge mode
5. **Build**: Drag components from the panel to the workspace
6. **Interact**:
   - **Drag** - Move components
   - **Double-click** - Rotate (or toggle switch)
   - **Right-click** - Delete component
   - **Ctrl+Z** - Undo
   - **Ctrl+Y** - Redo
   - **Mouse wheel** - Zoom

## Comparison with Original

| Feature | Original (Phaser) | New (React) |
|---------|------------------|-------------|
| Framework | Phaser 3 | Next.js 15 |
| Rendering | Canvas (Phaser) | Canvas (Konva) |
| State | Scene-based | Zustand |
| UI | Phaser Graphics | React + Tailwind |
| Performance | Good | Good |
| Maintainability | Moderate | Excellent |
| Code Clarity | Game-like | Component-based |

## API Endpoints

Uses the same endpoints as original Vezalko:

- `POST /api/login` - Authentication
- `GET /api/challenges` - List challenges
- `GET /api/users/:id/stats` - User statistics
- `POST /api/users/:id/challenge-complete` - Complete challenge
- `GET /api/users/leaderboard` - Top players

## Theme

Uses the Risalko design system:
- **Primary**: Indigo (#6366F1)
- **Secondary**: Amber (#F59E0B)
- **Success**: Green (#22C55E)
- **Error**: Red (#EF4444)
