# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"AI Girls" is an **AI-powered companion system** that uses VRM (Virtual Reality Model) humanoid avatars controlled by Large Language Models. The project supports **two deployment modes**:

1. **Desktop Mode** (Original): MCP server for Claude Desktop/compatible LLM clients
2. **Web Mode** (MVP): Full-stack web app with React frontend + Hono backend deployed to VPS

Both modes share the same Godot VRM avatar system but differ in how the LLM integration is handled.

## Key Technologies

- **Godot Engine 4.5** - Game engine with GL Compatibility renderer (supports HTML5 export)
- **VRM Addon** - Full VRM 0.0 and 1.0 import/export support from V-Sekai team
- **MToon Shader** - Anime-style shader implementation for VRM models
- **React + Vite** - Modern frontend framework with TypeScript
- **Hono** - Lightweight web framework for backend API
- **Vercel AI SDK** - Unified interface for LLM providers with tool calling
- **Model Context Protocol (MCP)** - LLM-to-application communication for desktop
- **WebSocket API** - Real-time bidirectional communication
- **TypeScript/Node.js** - Type-safe server implementations

## Project Structure

```
ai-girls/
├── godot/                      # Godot 4.5 project
│   ├── scripts/
│   │   └── VRoidWebSocketController.gd  # Dual-mode: server (desktop) or client (web)
│   ├── scenes/                 # Godot scenes
│   │   └── model.tscn         # Main VRM scene
│   ├── addons/                # VRM & MToon addons
│   ├── animations/            # Animation libraries
│   ├── vrm_samples/           # Example VRM models
│   ├── vroid_models/          # VRoid Studio models
│   ├── mixamo_models/         # Mixamo animations
│   ├── project.godot          # Godot project file
│   └── export_presets.cfg     # HTML5 export settings
│
├── frontend/                   # React web frontend
│   ├── src/
│   │   ├── components/        # UI components (shadcn/ui)
│   │   ├── hooks/            # React hooks
│   │   ├── lib/              # API client & utilities
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── backend/                    # Hono web backend
│   ├── src/
│   │   ├── ai/               # Gemini AI client (AI SDK)
│   │   ├── websocket/        # WebSocket servers
│   │   ├── routes/           # HTTP API routes
│   │   ├── lib/              # Avatar control logic
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── live-vroid-mcp/            # Desktop MCP server
│   ├── src/
│   │   ├── index.ts          # MCP server with tool definitions
│   │   └── godot_connection.ts  # WebSocket client for Godot
│   └── package.json
│
├── godot-web-build/           # Godot HTML5 export output
│
└── deployment/                # VPS deployment configs
    ├── nginx/                # Nginx reverse proxy
    └── systemd/              # Systemd service
```

## Development Commands

### Web Mode (Recommended for Development)

**Quick Start All Services:**
```bash
./dev-start.sh
```

This starts:
- Hono backend on `http://localhost:3000`
- React frontend on `http://localhost:5173`

**Manual Start:**

1. **Backend:**
```bash
cd backend
npm install
cp .env.example .env  # Add GEMINI_API_KEY
npm run dev
```

2. **Frontend:**
```bash
cd frontend
npm install
npm run dev
```

3. **Export Godot to HTML5:**
```bash
# Open godot/ folder in Godot Editor
godot --editor --path godot/

# Then: Project → Export → Web (HTML5)
# Export to ../godot-web-build/index.html
```

4. **Access:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api/chat`
- Health check: `http://localhost:3000/health`

### Desktop Mode (MCP Server)

**1. Start Godot (Server Mode):**
```bash
# Open project in Godot Editor
godot --editor --path godot/

# Or run directly (WebSocket server on port 8080)
godot --path godot/ godot/scenes/model.tscn
```

**2. Start MCP Server:**
```bash
cd live-vroid-mcp
npm install
npm run dev
```

**3. Configure LLM Client:**

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "live-vroid": {
      "command": "node",
      "args": ["/path/to/ai-girls/live-vroid-mcp/build/index.js"]
    }
  }
}
```

### Environment Variables

**Backend (Web Mode):**
```bash
# backend/.env
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**MCP Server (Desktop Mode):**
```bash
# Optional: WebSocket URL for Godot connection
export GODOT_WS_URL="ws://localhost:8080"
```

### Git Workflow
The project uses `main` as the primary branch.

## Architecture

### Web Mode Architecture

```
┌─────────────────────────────────────────┐
│  Browser                                │
│  ┌─────────────────────────────────┐   │
│  │  React Frontend                 │   │
│  │  • Chat Interface               │   │
│  │  • shadcn/ui + Tailwind        │   │
│  └──────────┬──────────────────────┘   │
│             │ HTTP POST /api/chat       │
│             ↓                            │
│  ┌─────────────────────────────────┐   │
│  │  Godot HTML5 Canvas             │   │
│  │  • VRM Avatar Rendering         │   │
│  │  • WebSocket CLIENT             │   │
│  └──────────┬──────────────────────┘   │
└─────────────┼──────────────────────────┘
              │ WebSocket /godot
              ↓
┌─────────────────────────────────────────┐
│  Backend Server (Hono)                  │
│  ┌─────────────────────────────────┐   │
│  │  Gemini AI (via AI SDK)         │   │
│  │  • Tool calling                 │   │
│  │  • control_avatar               │   │
│  │  • animate_from_text            │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  WebSocket Servers              │   │
│  │  • /godot (Godot client)        │   │
│  │  • /ws/state (Frontend updates) │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Flow:**
1. User types in React chat interface
2. Frontend sends POST to `/api/chat`
3. Hono backend calls Gemini AI with tool calling
4. Gemini responds with text + avatar control commands
5. Backend sends WebSocket commands to Godot client
6. Godot animates avatar
7. Frontend displays AI response

### Desktop Mode Architecture

```
Desktop LLM (Claude Desktop/etc)
    ↓
MCP Server (stdio protocol)
    ↓ (WebSocket CLIENT)
Godot Desktop App (WebSocket SERVER on :8080)
    ↓
VRM Avatar Animations
```

**Flow:**
1. User talks to LLM in Claude Desktop
2. LLM calls MCP tools (control_avatar, etc.)
3. MCP server sends WebSocket commands to Godot
4. Godot animates avatar
5. LLM sees tool results and continues conversation

## Core Components

### 1. VRoidWebSocketController (`godot/scripts/VRoidWebSocketController.gd`)

**Dual-mode WebSocket controller:**
- **Server Mode (Desktop)**: Listens on port 8080 for MCP client connections
- **Client Mode (Web)**: Connects to Hono backend at `ws://backend:3000/godot`

**Features:**
- Auto-detection of web environment (switches to client mode automatically)
- Dual animation system:
  - **Global library**: Facial expressions (happy, sad, angry, surprised, relaxed, neutral)
  - **Locomotion library**: Mixamo body animations (idle, wave, sit, jump, dance, etc.)
- Capabilities discovery and transmission
- One-shot animation auto-return to idle
- Animation/emotion/look direction control

**Key Functions:**
- `_ready()`: Auto-detects mode, starts appropriate WebSocket setup
- `_process_client_mode()`: Handles client connections (web)
- `_process_server_mode()`: Handles server connections (desktop)
- `_play_animation()`: Plays locomotion animations
- `_set_emotion()`: Sets facial expressions
- `_set_look_direction()`: Controls gaze direction

### 2. Hono Backend (`backend/src/`)

**Main Server (`index.ts`):**
- HTTP routes for chat API
- WebSocket servers for Godot and frontend
- Static file serving (Godot build + React build)
- Gemini AI initialization

**Gemini AI Client (`ai/gemini.ts`):**
- Uses Vercel AI SDK with `@ai-sdk/google` provider
- Tool definitions using Zod schemas
- `generateText()` for non-streaming responses
- `streamText()` for streaming (future feature)
- Conversation history management

**WebSocket Servers:**
- `godot-server.ts`: Manages Godot client connections, sends avatar commands
- `state-server.ts`: Broadcasts avatar state to frontend clients

**Chat Routes (`routes/chat.ts`):**
- `POST /api/chat`: Send message, get AI response
- `GET /api/chat/history`: Get conversation history
- `DELETE /api/chat/history`: Clear conversation
- `GET /api/chat/status`: System status

### 3. React Frontend (`frontend/src/`)

**Main App (`App.tsx`):**
- Full-screen Godot iframe background
- Chat interface overlay at bottom

**Components:**
- `ChatInterface.tsx`: Main chat UI with text input
- `AvatarCanvas.tsx`: Godot iframe wrapper
- `MessageList.tsx`: Chat message display
- `ui/`: shadcn/ui components (Button, Input, Card)

**Hooks:**
- `useChat.ts`: Chat state management, message sending

**API Client (`lib/api.ts`):**
- HTTP client for backend API
- Type-safe requests/responses

### 4. MCP Server (`live-vroid-mcp/src/`)

**Desktop-only component for Claude Desktop integration**

**Tools:**
- `control_avatar`: Direct avatar control (clip, emotion, lookAt)
- `animate_from_text`: Natural language interpretation
- `sequence_animations`: Multi-step animation sequences

**Godot Connection (`godot_connection.ts`):**
- WebSocket client to Godot server
- Command queue with timeout handling
- Auto-reconnection logic
- Capabilities tracking

## WebSocket Protocol

**Command Format (from backend/MCP to Godot):**
```json
{
  "type": "avatar_control",
  "clip": "wave",
  "emotion": "happy",
  "lookAt": "user"
}
```

**Capabilities Format (from Godot to backend/MCP):**
```json
{
  "type": "capabilities",
  "data": {
    "clips": ["idle", "wave", "sit", "jump", "dance", ...],
    "emotions": ["neutral", "happy", "sad", "angry", "surprised", "relaxed"],
    "lookTargets": ["user", "away", "down", "up", "left", "right"],
    "mouthShapes": ["aa", "ee", "ih", "oh", "ou"]
  }
}
```

## Avatar Control

### Available Animations

**Body Animations (Locomotion):**
- `idle`, `wave`, `sit`, `jump`, `dance`, `blow_kiss`, `clap`, `bow`, `nod`, `shake_head`

**One-shot animations** (auto-return to idle):
- `wave`, `jump`, `blow_kiss`, `clap`, `bow`, `nod`, `shake_head`

**Looping animations:**
- `idle`, `sit`, `dance`

### Facial Expressions

**Emotions:**
- `neutral`, `happy`, `sad`, `angry`, `surprised`, `relaxed`

**Mappings:**
- `confused` → `surprised`
- `excited` → `happy`
- `bored` → `relaxed`
- `shy` → `sad`
- `confident` → `neutral`

### Gaze Directions

**Look Targets:**
- `user` (forward)
- `away` (left)
- `down`
- `up`
- `left`
- `right`

## Animation System

### Dual Library Architecture

The project uses a sophisticated dual-library approach:

1. **Global Animation Library** (`[Global]/...`)
   - Facial expressions: Applied immediately via `advance(0.0)` for state-based control
   - Look directions: `lookUp`, `lookDown`, `lookLeft`, `lookRight`
   - Mouth shapes for lip sync: `aa`, `ee`, `ih`, `oh`, `ou`
   - Special: `blink`, `RESET`

2. **Locomotion Animation Library** (`locomotion/...`)
   - Body animations from Mixamo
   - Timeline-based playback
   - Automatic return to idle for one-shot animations

### Animation Mappings

Located in `godot/scripts/VRoidWebSocketController.gd`:

```gdscript
var animation_mappings = {
  "idle": "locomotion/X Bot",
  "sit": "locomotion/Sitting",
  "wave": "locomotion/Blow A Kiss",
  # ... etc
}

var emotion_mappings = {
  "neutral": "neutral",
  "happy": "happy",
  # ... etc
}

var look_mappings = {
  "down": "lookDown",
  "left": "lookLeft",
  # ... etc
}
```

## VRM Model Support

### Importing VRM Models

1. Place `.vrm` files in `godot/vrm_samples/` or `godot/vroid_models/`
2. Godot auto-imports using VRM addon
3. Models are converted to Godot scenes
4. Configure import settings for head hiding mode if needed

### Runtime Loading

See `godot/vrm_samples/load_at_runtime_scene.gd` for programmatic loading example.

### VRM Features

**Supported:**
- VRM 0.0 and 1.0 import (0.0 converts to 1.0 naming)
- VRM 1.0 export
- MToon materials with HDR emissive
- Spring bones (needs optimization)
- Node constraints (buggy with retargeting)
- Humanoid skeleton retargeting via SkeletonProfileHumanoid
- Expressions (blend shapes, material color/UV offsets)
- First-person head hiding

**Known Issues:**
- VRMC_node_constraint: Buggy when combined with retargeting
- VRMC_springBone: Not supported in standalone .gltf export
- lookAt: Only creates animation tracks, app must create BlendSpace2D
- firstPerson: Head hiding requires camera layers or runtime script

**Not Yet Implemented:**
- VRMC_vrm_animation (planned for humanoid AnimationLibrary import/export)

### Critical Addon Requirements

⚠️ **IMPORTANT**: Addon paths must NOT be renamed:
- `godot/addons/vrm` - Referenced by generated VRM meta scripts
- `godot/addons/Godot-MToon-Shader` - Referenced by generated materials

Both plugins must be enabled in Project Settings → Plugins.

## Deployment

### Web Mode Deployment (Production)

Full deployment guide in `deployment/README.md`.

**Quick Overview:**
1. Clone to VPS: `/opt/ai-girls`
2. Build backend: `cd backend && npm install && npm run build`
3. Build frontend: `cd frontend && npm install && npm run build`
4. Export Godot HTML5 build (from local machine, upload to VPS)
5. Configure systemd service
6. Configure Nginx reverse proxy with SSL
7. Start service: `sudo systemctl start ai-girls`

**VPS Requirements:**
- Ubuntu 20.04+
- Node.js 20+
- Nginx
- SSL certificate (Let's Encrypt)

**Costs:**
- Hetzner VPS: €5-10/month
- Domain: €10/year
- Gemini API: Free tier or pay-as-you-go

### Desktop Mode Deployment

No deployment needed - runs locally on developer machine with Claude Desktop.

## Development Workflow

### Adding New Animations

1. Export animation from Mixamo (FBX format)
2. Import into Godot project (`godot/mixamo_models/`)
3. Add to AnimationPlayer
4. Update `animation_mappings` in `godot/scripts/VRoidWebSocketController.gd`
5. Determine if one-shot or looping
6. For web: Re-export HTML5 build

### Modifying AI Behavior

**Web Mode:**
Edit `backend/src/ai/gemini.ts` - change `DEFAULT_SYSTEM_PROMPT`

**Desktop Mode:**
MCP server has no persistent system prompt - LLM client controls behavior

### Testing

**Web Mode:**
```bash
./dev-start.sh
# Open http://localhost:5173
# Type messages and watch avatar animate
```

**Desktop Mode:**
```bash
# Terminal 1: Godot
godot --path godot/ godot/scenes/model.tscn

# Terminal 2: MCP Server
cd live-vroid-mcp && npm run dev

# Terminal 3: Claude Desktop (or compatible client)
# Chat and use avatar control tools
```

### Debugging

**Web Mode:**
- Backend logs: `tail -f backend.log`
- Frontend logs: Browser console (F12)
- Godot logs: Browser console (iframe)
- Network: Browser DevTools Network tab

**Desktop Mode:**
- Godot logs: Godot console
- MCP server logs: stderr (printed to terminal)
- WebSocket traffic: Browser DevTools or Wireshark

## Future Development

### Planned Features

1. **Voice Integration**
   - Speech-to-text for voice input
   - TTS with lip-sync (using mouth shapes)

2. **Persistence**
   - Database for conversation history
   - User accounts and sessions

3. **Multi-Avatar**
   - Switch between different VRM characters
   - Character-specific personalities

4. **Advanced Animations**
   - More Mixamo animations
   - Custom animation blending
   - Procedural animations

5. **Streaming Responses**
   - Use `streamText()` from AI SDK
   - Real-time text streaming in chat UI

### Current Limitations

- Text-based conversation only (no voice)
- No lip-sync (mouth shapes exist but not connected)
- Single avatar at a time
- In-memory conversation history (lost on restart)
- Limited animation library

## Documentation

- **WEB_DEPLOYMENT_README.md** - Complete web deployment guide
- **backend/README.md** - Hono backend details
- **frontend/README.md** - React frontend details
- **deployment/README.md** - VPS deployment instructions
- **godot-web-build/README.md** - Godot HTML5 export guide

## License

MIT
