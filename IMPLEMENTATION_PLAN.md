# AI Girls - Implementation Plan
## Path to Web Deployment with Dynamic Animation Discovery

**Last Updated**: 2025-11-02
**Status**: In Progress (Phases 1-2 Completed)
**Priority**: Fix Local Workflow First → Web Deployment

---

## Executive Summary

This document outlines a comprehensive plan to improve the AI Girls VRM avatar system from its current working local state to a fully deployable web application with dynamic animation management.

### Current State
✅ **Working Locally**: `scenes/model.tscn` with VRoidWebSocketController operational
✅ **MCP Integration**: Claude Desktop → MCP Server → Godot WebSocket functional
✅ **Dynamic Capabilities**: Animation discovery implemented (Phases 1-2 complete)
❌ **Manual Workflow**: Blender → Godot import is tedious and error-prone
❌ **Not Web-Ready**: Architecture incompatible with browser deployment

### Strategic Goals
1. ✅ **Dynamic Animation Discovery** - Eliminate manual synchronization (COMPLETED)
2. **Streamlined Workflow** - Simplify animation import process
3. **Web Deployment Ready** - Enable public cloud deployment
4. ✅ **Maintainability** - Single source of truth for animations (COMPLETED)

---

## Problem Analysis

### Critical Issues Identified

#### 1. Hardcoded Animation Lists (HIGH PRIORITY)

**Problem Locations:**

**File 1**: `scripts/VRoidWebSocketController.gd`
```gdscript
# Lines 26-49: animation_mappings dictionary
var animation_mappings = {
    "idle": "locomotion/X Bot",
    "wave": "locomotion/Blow A Kiss",
    # ... 20+ hardcoded entries
}
```

**File 2**: `live-vroid-mcp/src/index.ts`
```typescript
// Lines 27-43: ANIMATIONS constant
const ANIMATIONS = [
  "idle", "wave", "jump", "sit", "dance",
  // ... hardcoded list
] as const;
```

**Impact:**
- Adding new animation requires editing **TWO** files
- Easy to forget updates → runtime errors
- No validation that Godot actually has the animation
- MCP server blind to actual capabilities

**Root Cause:**
No capability discovery protocol between Godot and MCP server.

---

#### 2. Manual Animation Workflow (MEDIUM PRIORITY)

**Current Process:**
```
VRoid Studio → Mixamo → Blender → glTF Export → Godot Import
   (model)    (animations) (merge)    (export)     (manual setup)
                                                        ↓
                                             Edit animation_mappings
                                                        ↓
                                             Edit MCP server ANIMATIONS
```

**Pain Points:**
- 8-step process for each new animation
- Blender required as intermediary
- Easy to miss synchronization steps
- No batch import capability
- No metadata tracking (duration, tags, type)

---

#### 3. Web Deployment Architecture (HIGH PRIORITY)

**Current Architecture** (localhost only):
```
Claude Desktop → MCP Server (Node.js) → WebSocket Client
                                              ↓
                                        Godot WebSocket SERVER
                                        (scenes/model.scn)
```

**Problem:**
- Godot HTML5 exports run in browser
- Browsers **CANNOT** host WebSocket servers (security restriction)
- Current architecture fundamentally incompatible with web deployment

**Required Architecture** (web-compatible):
```
Claude Desktop → MCP Server (Cloud) ← WebSocket Client ← Godot HTML5 (Browser)
                      ↓
                WebSocket SERVER
                (bidirectional)
```

**Changes Needed:**
1. MCP server must HOST WebSocket server
2. Godot must become WebSocket CLIENT
3. Reverse all connection logic
4. Support both modes (desktop = server, web = client)

---

#### 4. Missing Build Artifacts (BLOCKING)

**Issues in `live-vroid-mcp/`:**
- `package.json` references `server.js` (doesn't exist)
- Should reference `build/index.js`
- `build/` directory missing (TypeScript not compiled)
- Development script uses wrong file

**Impact:**
- MCP server cannot run in production mode
- Must compile TypeScript before deployment
- Incorrect dev workflow

---

## Detailed Implementation Plan

### Phase 1: Dynamic Animation Discovery ⭐ PRIORITY 1 ✅ COMPLETED

**Goal**: Eliminate hardcoded animation lists through runtime capability exchange

**Estimated Time**: 4-5 hours
**Complexity**: Medium
**Dependencies**: None
**Status**: ✅ Completed (Git commit: 56be486)

#### 1.1 Godot Capability Discovery (2 hours)

**File**: `scripts/VRoidWebSocketController.gd`

**Add new function** (around line 95):
```gdscript
func _get_capabilities() -> Dictionary:
    """
    Dynamically extract available animations from AnimationPlayer.
    Called on startup and when animations change.
    """
    var capabilities = {
        "animations": [],
        "emotions": [],
        "lookDirections": [],
        "mouthShapes": []
    }

    # Extract from animation_mappings (current approach)
    for key in animation_mappings.keys():
        capabilities["animations"].append(key)

    for key in emotion_mappings.keys():
        capabilities["emotions"].append(key)

    for key in look_mappings.keys():
        capabilities["lookDirections"].append(key)

    for key in mouth_shapes.keys():
        capabilities["mouthShapes"].append(key)

    return capabilities
```

**Modify welcome message** (around line 167):
```gdscript
var welcome = {
    "type": "welcome",
    "message": "Connected to Live-Vroid",
    "state": {
        "animation": current_clip,
        "emotion": current_emotion,
        "lookAt": current_look
    },
    "capabilities": _get_capabilities()  # ADD THIS LINE
}
```

**Future Enhancement** (optional):
```gdscript
# Directly query AnimationPlayer for all animations
func _get_all_animations() -> Array:
    var anims = []
    var anim_list = animation_player.get_animation_list()
    for anim_name in anim_list:
        anims.append(anim_name)
    return anims
```

---

#### 1.2 MCP Server Dynamic Consumption (2 hours)

**File**: `live-vroid-mcp/src/godot_connection.ts`

**Add capability storage**:
```typescript
export class GodotConnection {
  private capabilities: {
    animations: string[];
    emotions: string[];
    lookDirections: string[];
    mouthShapes: string[];
  } | null = null;

  // Store capabilities from welcome message
  private handleWelcomeMessage(data: any): void {
    if (data.capabilities) {
      this.capabilities = data.capabilities;
      console.error('[Godot] Received capabilities:', this.capabilities);
    }
  }

  // Expose capabilities to MCP server
  public getCapabilities() {
    return this.capabilities;
  }
}
```

**File**: `live-vroid-mcp/src/index.ts`

**Remove hardcoded constants** (lines 27-60):
```typescript
// DELETE THESE:
// const ANIMATIONS = [...];
// const EMOTIONS = [...];
// const LOOK_TARGETS = [...];
```

**Dynamic tool schema generation**:
```typescript
// Wait for capabilities before registering tools
godotConnection.on('capabilities', (caps) => {

  // Generate dynamic tool schemas
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const capabilities = godotConnection.getCapabilities();

    if (!capabilities) {
      // Fallback to minimal schema
      return { tools: [] };
    }

    return {
      tools: [
        {
          name: "control_avatar",
          description: "Control the VRoid avatar's animation, emotion, and gaze",
          inputSchema: {
            type: "object",
            properties: {
              clip: {
                type: "string",
                description: "Animation clip to play",
                enum: capabilities.animations  // DYNAMIC!
              },
              emotion: {
                type: "string",
                description: "Facial expression",
                enum: capabilities.emotions     // DYNAMIC!
              },
              lookAt: {
                type: "string",
                description: "Gaze direction",
                enum: capabilities.lookDirections  // DYNAMIC!
              }
            }
          }
        },
        // ... other tools with dynamic schemas
      ]
    };
  });
});
```

**Validation in tool handlers**:
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const capabilities = godotConnection.getCapabilities();

  if (name === "control_avatar") {
    // Validate against actual capabilities
    if (args.clip && !capabilities.animations.includes(args.clip)) {
      throw new Error(`Unknown animation: ${args.clip}. Available: ${capabilities.animations.join(', ')}`);
    }

    // ... proceed with validated command
  }
});
```

---

#### 1.3 Testing (1 hour)

**Test Cases:**
1. ✅ Start Godot → MCP receives capabilities in welcome message
2. ✅ Add new animation in Godot → MCP automatically recognizes it (after reconnect)
3. ✅ LLM requests invalid animation → Receives clear error message
4. ✅ LLM sees updated tool schemas with actual available animations

**Testing Steps:**
```bash
# Terminal 1: Start Godot with logging
godot --path . --verbose

# Terminal 2: Start MCP server with debug logging
cd live-vroid-mcp
DEBUG=* npm run dev

# Terminal 3: Check MCP server logs
# Should see: "Received capabilities: {animations: [...], emotions: [...]}"

# Test in Claude Desktop
# Ask: "What animations can you perform?"
# Claude should list actual capabilities from Godot
```

---

### Phase 2: Fix MCP Server Build ⭐ PRIORITY 1 ✅ COMPLETED

**Goal**: Correct package.json and ensure TypeScript compilation works

**Estimated Time**: 30 minutes
**Complexity**: Low
**Dependencies**: None
**Status**: ✅ Completed (Git commit: 56be486)

#### 2.1 Fix package.json

**File**: `live-vroid-mcp/package.json`

**Current (BROKEN)**:
```json
{
  "scripts": {
    "start": "node server.js",        // WRONG FILE
    "dev": "node --watch server.js",  // WRONG FILE
    "build": "tsc"
  }
}
```

**Fixed**:
```json
{
  "scripts": {
    "start": "node build/index.js",
    "dev": "tsx --watch src/index.ts",
    "build": "tsc",
    "prebuild": "rm -rf build"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/ws": "^8.5.10",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

#### 2.2 Build and Verify

```bash
cd live-vroid-mcp

# Install any missing dependencies
npm install

# Build TypeScript
npm run build

# Verify build output exists
ls -la build/
# Should see: index.js, godot_connection.js, etc.

# Test production mode
npm start
# Should connect to ws://localhost:8080
```

---

### Phase 3: Improve Animation Workflow 🎨 PRIORITY 2

**Goal**: Document best practices and create optional enhancement tools

**Estimated Time**: 3-4 hours
**Complexity**: Low-Medium
**Dependencies**: Phase 1 (for metadata integration)

#### 3.1 Document Streamlined Workflow (1 hour)

**Create**: `docs/ANIMATION_WORKFLOW.md`

```markdown
# Animation Import Workflow

## Quick Start: Adding a Single Animation

1. **Download from Mixamo**
   - Go to mixamo.com
   - Upload your VRM model (or use default rig)
   - Select animation (e.g., "Waving")
   - Download settings:
     - Format: FBX Binary
     - Skin: With Skin
     - Frame Rate: 30 FPS

2. **Import to Blender**
   - File → Import → FBX
   - Select your VRM model .blend file
   - File → Import → FBX (again)
   - Select downloaded animation FBX
   - Select imported armature → Match bones
   - Retarget animation to VRM skeleton

3. **Export to Godot**
   - File → Export → glTF 2.0
   - Include: Selected Objects, Animations
   - Save to: `mixamo_models/your_model_with_anims.glb`

4. **Import to Godot**
   - Drag .glb into Godot project
   - Auto-imports with animations
   - Open scenes/model.scn
   - Add animation to AnimationPlayer library

5. **Update Mappings** (if not using dynamic discovery)
   - Edit `scripts/VRoidWebSocketController.gd`
   - Add to `animation_mappings`:
     ```gdscript
     "wave": "locomotion/Waving",
     ```
   - Restart Godot → MCP auto-detects new animation

## Batch Import: Multiple Animations

[... detailed batch workflow ...]

## Troubleshooting

[... common issues ...]
```

---

#### 3.2 Animation Metadata System (2 hours)

**Create**: `animations/animation_metadata.json`

```json
{
  "version": "1.0",
  "lastUpdated": "2025-11-02",
  "animations": {
    "wave": {
      "type": "oneshot",
      "godotName": "locomotion/Blow A Kiss",
      "duration": 2.5,
      "tags": ["greeting", "social", "friendly"],
      "description": "Friendly wave gesture, blowing a kiss",
      "source": "mixamo",
      "mixamoId": "blow_kiss_001"
    },
    "idle": {
      "type": "loop",
      "godotName": "locomotion/X Bot",
      "duration": 5.0,
      "tags": ["default", "neutral"],
      "description": "Default standing idle pose",
      "source": "mixamo",
      "mixamoId": "idle_001"
    },
    "jump": {
      "type": "oneshot",
      "godotName": "locomotion/Jump",
      "duration": 1.8,
      "tags": ["energetic", "excited", "active"],
      "description": "Energetic jumping motion",
      "source": "mixamo",
      "mixamoId": "jump_001"
    }
  },
  "emotions": {
    "happy": {
      "vrm_expression": "happy",
      "intensity": 1.0,
      "description": "Bright, cheerful expression with smile"
    }
  }
}
```

**Benefits:**
- Documentation of animation sources
- Smart animation selection by MCP server (e.g., "show excitement" → search tags)
- Duration info for sequence timing
- Version tracking

**Optional Enhancement**: Load metadata in MCP server for smarter animation selection:
```typescript
// In animate_from_text tool
function selectAnimationByContext(text: string, metadata: AnimationMetadata): string {
  // Search tags for semantic matching
  // "show excitement" → find animations tagged "energetic", "excited"
}
```

---

### Phase 4: Reverse WebSocket Architecture 🌐 PRIORITY 2

**Goal**: Make system compatible with browser-based Godot HTML5 export

**Estimated Time**: 5-6 hours
**Complexity**: High
**Dependencies**: Phase 1, Phase 2

#### 4.1 Architecture Overview

**Current (Desktop Only)**:
```
MCP Server (Client) → connects to → Godot (Server on :8080)
```

**Target (Web Compatible)**:
```
MCP Server (Server on :8080) ← connects from ← Godot (Client)
```

**Dual Mode Support**:
```gdscript
# VRoidWebSocketController.gd
@export var connection_mode: String = "server"  # or "client"
@export var server_url: String = "ws://localhost:8080"
```

---

#### 4.2 Add WebSocket Server to MCP (3 hours)

**Create**: `live-vroid-mcp/src/websocket_server.ts`

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

export class GodotWebSocketServer extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number = 8080) {
    super();

    this.wss = new WebSocketServer({ port });
    console.error(`[WebSocket Server] Listening on port ${port}`);

    this.wss.on('connection', (ws: WebSocket) => {
      console.error('[WebSocket Server] Client connected');
      this.clients.add(ws);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.emit('message', message, ws);
        } catch (error) {
          console.error('[WebSocket Server] Parse error:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.error('[WebSocket Server] Client disconnected');
      });

      // Send welcome request (reverse of current flow)
      this.requestCapabilities(ws);
    });
  }

  // Request capabilities from Godot client
  private requestCapabilities(ws: WebSocket): void {
    ws.send(JSON.stringify({
      type: 'request_capabilities',
      commandId: `cap_${Date.now()}`
    }));
  }

  // Broadcast command to all connected Godot clients
  public sendCommand(command: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const commandId = `cmd_${Date.now()}`;
      const message = {
        ...command,
        commandId
      };

      // Send to all clients (or implement routing for multi-client)
      this.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });

      // TODO: Implement response handling with timeout
      setTimeout(() => reject(new Error('Command timeout')), 10000);
    });
  }

  public close(): void {
    this.clients.forEach(client => client.close());
    this.wss.close();
  }
}
```

**Modify**: `live-vroid-mcp/src/index.ts`

```typescript
import { GodotWebSocketServer } from './websocket_server.js';

// Detect mode from environment
const MODE = process.env.WS_MODE || 'client'; // 'client' or 'server'

let godotConnection: GodotConnection | GodotWebSocketServer;

if (MODE === 'server') {
  // Web deployment mode: MCP hosts server
  godotConnection = new GodotWebSocketServer(8080);
} else {
  // Desktop mode: MCP connects as client
  godotConnection = new GodotConnection();
}
```

---

#### 4.3 Add WebSocket Client to Godot (2 hours)

**Modify**: `scripts/VRoidWebSocketController.gd`

```gdscript
extends Node3D

@export var connection_mode: String = "server"  # "server" or "client"
@export var server_url: String = "ws://localhost:8080"
@export var websocket_port: int = 8080

var websocket: WebSocketPeer = WebSocketPeer.new()
var is_server_mode: bool = true
var tcp_server: TCPServer = null

func _ready():
    is_server_mode = (connection_mode == "server")

    if is_server_mode:
        _start_server()
    else:
        _connect_to_server()

    # ... rest of initialization

func _start_server():
    """Original server mode (desktop)"""
    tcp_server = TCPServer.new()
    var error = tcp_server.listen(websocket_port)
    if error != OK:
        push_error("Failed to start WebSocket server on port %d" % websocket_port)
        return
    print("WebSocket server started on port %d" % websocket_port)

func _connect_to_server():
    """New client mode (web deployment)"""
    print("Connecting to WebSocket server at %s" % server_url)
    var error = websocket.connect_to_url(server_url)
    if error != OK:
        push_error("Failed to connect to WebSocket server: %d" % error)
        return

func _process(delta):
    if is_server_mode:
        _process_server(delta)
    else:
        _process_client(delta)

func _process_client(delta):
    """Handle client mode polling"""
    websocket.poll()

    var state = websocket.get_ready_state()

    if state == WebSocketPeer.STATE_OPEN:
        while websocket.get_available_packet_count():
            var packet = websocket.get_packet()
            var message = packet.get_string_from_utf8()
            _handle_message(message)

    elif state == WebSocketPeer.STATE_CLOSING:
        pass

    elif state == WebSocketPeer.STATE_CLOSED:
        var code = websocket.get_close_code()
        print("WebSocket closed with code: %d" % code)
        # Implement reconnection logic
        _reconnect_timer += delta
        if _reconnect_timer > 5.0:
            _connect_to_server()
            _reconnect_timer = 0.0

func _process_server(delta):
    """Original server mode logic"""
    # ... existing server processing code

func _send_message(message: String):
    """Send message in either mode"""
    if is_server_mode:
        for peer_id in connected_peers.keys():
            var peer = connected_peers[peer_id]
            peer.send_text(message)
    else:
        websocket.send_text(message)
```

**Export Considerations for HTML5**:
```gdscript
# In client mode, server_url should be configured at export time
# For cloud deployment:
@export var server_url: String = "wss://your-mcp-server.com:8080"  # WSS for HTTPS
```

---

#### 4.4 Testing Dual Mode (1 hour)

**Test Desktop Mode (original)**:
```bash
# Terminal 1: Godot as server
godot --path . res://scenes/model.scn
# Connection mode: "server"

# Terminal 2: MCP as client
cd live-vroid-mcp
WS_MODE=client npm start
```

**Test Web Mode (reversed)**:
```bash
# Terminal 1: MCP as server
cd live-vroid-mcp
WS_MODE=server npm start

# Terminal 2: Godot as client
# Set connection_mode="client" in scenes/model.scn
# Set server_url="ws://localhost:8080"
godot --path . res://scenes/model.scn
```

---

### Phase 5: HTML5 Export Configuration 🚀 PRIORITY 3

**Goal**: Create working HTML5 export of Godot project

**Estimated Time**: 2-3 hours
**Complexity**: Medium
**Dependencies**: Phase 4

#### 5.1 Create Export Preset

**Create**: `export_presets.cfg`

```ini
[preset.0]

name="HTML5"
platform="Web"
runnable=true
dedicated_server=false
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="builds/web/index.html"
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.0.options]

custom_template/debug=""
custom_template/release=""
variant/extensions_support=false
variant/thread_support=true
vram_texture_compression/for_desktop=true
vram_texture_compression/for_mobile=false
html/export_icon=true
html/custom_html_shell=""
html/head_include=""
html/canvas_resize_policy=2
html/focus_canvas_on_start=true
html/experimental_virtual_keyboard=false
progressive_web_app/enabled=false
progressive_web_app/offline_page=""
progressive_web_app/display=1
progressive_web_app/orientation=0
progressive_web_app/icon_144x144=""
progressive_web_app/icon_180x180=""
progressive_web_app/icon_512x512=""
progressive_web_app/background_color=Color(0, 0, 0, 1)
```

**Important Settings:**
- `variant/thread_support=true` - Required for SharedArrayBuffer
- `html/canvas_resize_policy=2` - Adaptive sizing

---

#### 5.2 Configure SharedArrayBuffer Headers

**Create**: `builds/web/.htaccess` (for Apache)

```apache
<IfModule mod_headers.c>
    Header set Cross-Origin-Embedder-Policy "require-corp"
    Header set Cross-Origin-Opener-Policy "same-origin"
</IfModule>
```

**Or for Netlify** (`builds/web/_headers`):
```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

**Or for Vercel** (`builds/web/vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

---

#### 5.3 Export and Test Locally

```bash
# Export via Godot Editor
# Project → Export → Add → HTML5
# Use preset settings above
# Export to builds/web/index.html

# Test locally with proper headers
cd builds/web
python3 -m http.server 8000 --bind 127.0.0.1

# Or use a tool that supports custom headers:
npm install -g http-server
http-server . -p 8000 \
  --cors \
  -H "Cross-Origin-Embedder-Policy: require-corp" \
  -H "Cross-Origin-Opener-Policy: same-origin"

# Open browser: http://localhost:8000
```

---

#### 5.4 Update Scene for Web

**In `scenes/model.tscn` (or create web variant)**:
```gdscript
# Detect if running in web browser
func _ready():
    if OS.has_feature("web"):
        connection_mode = "client"
        server_url = "wss://your-mcp-server.com:8080"
    else:
        connection_mode = "server"

    # ... rest of initialization
```

---

### Phase 6: Cloud Deployment 🌍 PRIORITY 3

**Goal**: Deploy complete system to public URLs

**Estimated Time**: 3-4 hours
**Complexity**: Medium
**Dependencies**: Phase 4, Phase 5

#### 6.1 Deploy MCP Server

**Option A: Railway.app** (recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd live-vroid-mcp
railway init

# Configure environment
railway variables set WS_MODE=server
railway variables set PORT=8080

# Deploy
railway up

# Get public URL
railway domain
# Example: live-vroid-mcp-production.up.railway.app
```

**Option B: Fly.io**
```toml
# fly.toml
app = "live-vroid-mcp"

[build]
  builder = "heroku/buildpacks:20"

[[services]]
  http_checks = []
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

```bash
fly launch
fly deploy
```

**Option C: Render**
- Create new "Web Service"
- Connect GitHub repo
- Build Command: `cd live-vroid-mcp && npm install && npm run build`
- Start Command: `cd live-vroid-mcp && npm start`
- Environment: `WS_MODE=server`

---

#### 6.2 Deploy Godot HTML5

**Option A: Vercel** (recommended for static hosting)
```json
// vercel.json
{
  "buildCommand": null,
  "outputDirectory": "builds/web",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd builds/web
vercel --prod

# Get URL: https://ai-girls.vercel.app
```

**Option B: Netlify**
```toml
# netlify.toml
[build]
  publish = "builds/web"

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Embedder-Policy = "require-corp"
    Cross-Origin-Opener-Policy = "same-origin"
```

```bash
netlify deploy --prod --dir=builds/web
```

---

#### 6.3 Configure Connection

**Update Godot export** with production MCP server URL:

**File**: `scripts/VRoidWebSocketController.gd`
```gdscript
func _ready():
    if OS.has_feature("web"):
        connection_mode = "client"
        # Use your deployed MCP server URL
        server_url = "wss://live-vroid-mcp-production.up.railway.app"
    else:
        connection_mode = "server"
```

**Re-export and redeploy** Godot HTML5 with updated URL.

---

#### 6.4 Configure Claude Desktop for Cloud

**File**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "live-vroid-local": {
      "command": "node",
      "args": ["/absolute/path/to/ai-girls/live-vroid-mcp/build/index.js"]
    },
    "live-vroid-cloud": {
      "command": "node",
      "args": [
        "-e",
        "require('ws'); const ws = new WebSocket('wss://live-vroid-mcp-production.up.railway.app'); ws.on('open', () => process.stdin.pipe(ws).pipe(process.stdout));"
      ]
    }
  }
}
```

Or create a **relay script** for cleaner configuration.

---

### Phase 7: Testing & Validation ✅ PRIORITY 3

**Goal**: End-to-end testing of complete system

**Estimated Time**: 2-3 hours
**Complexity**: Low
**Dependencies**: All previous phases

#### 7.1 Local Testing Checklist

- [ ] Dynamic animation discovery works
  - [ ] Add new animation in Godot
  - [ ] MCP server recognizes it without code changes
  - [ ] LLM can use new animation immediately

- [ ] MCP server builds correctly
  - [ ] `npm run build` succeeds
  - [ ] `build/` directory contains .js files
  - [ ] `npm start` runs without errors

- [ ] Dual WebSocket modes work
  - [ ] Desktop mode: Godot server + MCP client
  - [ ] Web mode: MCP server + Godot client
  - [ ] Switching between modes works

- [ ] HTML5 export functional
  - [ ] Export completes without errors
  - [ ] Opens in browser
  - [ ] SharedArrayBuffer available
  - [ ] WebSocket connects to local MCP server

---

#### 7.2 Cloud Deployment Testing Checklist

- [ ] MCP server deployed
  - [ ] Public URL accessible
  - [ ] WebSocket connection works
  - [ ] Logs show activity

- [ ] Godot HTML5 deployed
  - [ ] Opens in browser from public URL
  - [ ] Connects to cloud MCP server
  - [ ] Animations play correctly

- [ ] Claude Desktop integration
  - [ ] MCP tools visible in Claude
  - [ ] Commands reach cloud MCP server
  - [ ] Cloud MCP forwards to Godot HTML5
  - [ ] Avatar responds to Claude commands

- [ ] Multi-user testing
  - [ ] Multiple browser tabs can connect
  - [ ] Commands from Claude affect all viewers
  - [ ] Or: Implement user routing if needed

---

#### 7.3 Performance Testing

- [ ] Animation latency acceptable
  - [ ] < 500ms from Claude command to avatar movement
  - [ ] No dropped frames during animations

- [ ] WebSocket stability
  - [ ] Reconnects after network interruption
  - [ ] Command queue survives brief disconnects

- [ ] Browser compatibility
  - [ ] Chrome/Edge (Chromium)
  - [ ] Firefox
  - [ ] Safari (if SharedArrayBuffer supported)

---

### Phase 8: Documentation & Cleanup 📚 PRIORITY 4

**Goal**: Update all documentation with new architecture

**Estimated Time**: 2-3 hours
**Complexity**: Low
**Dependencies**: All previous phases

#### 8.1 Update CLAUDE.md

- [ ] Document capability discovery system
- [ ] Update architecture diagrams (server/client modes)
- [ ] Add web deployment instructions
- [ ] Update animation workflow section
- [ ] Add troubleshooting guide

#### 8.2 Update README.md

- [ ] Add "Web Deployment" section
- [ ] Update quick start with both modes
- [ ] Add live demo link (once deployed)
- [ ] Update architecture diagram

#### 8.3 Create Additional Docs

- [ ] `docs/DEPLOYMENT.md` - Step-by-step cloud deployment
- [ ] `docs/ANIMATION_WORKFLOW.md` - Animation import guide
- [ ] `docs/TROUBLESHOOTING.md` - Common issues and solutions
- [ ] `docs/ARCHITECTURE.md` - Technical deep dive

#### 8.4 Code Cleanup

- [ ] Remove hardcoded ANIMATIONS constants (if fully dynamic)
- [ ] Add TypeScript type definitions
- [ ] Add GDScript type hints
- [ ] Add comprehensive comments
- [ ] Remove debug logging in production

---

## Implementation Timeline

### Week 1: Local Improvements (12-15 hours)

**Days 1-2**: ✅ Phase 1 + Phase 2 (5 hours) **COMPLETED**
- ✅ Dynamic animation discovery
- ✅ Fix MCP server build
- ✅ Test end-to-end

**Days 3-4**: Phase 3 (4 hours) **NEXT**
- Document animation workflow
- Create metadata system
- Test adding new animations

**Day 5**: Testing & Buffer (3 hours)

---

### Week 2: Web Deployment (12-15 hours)

**Days 1-2**: Phase 4 (6 hours)
- Reverse WebSocket architecture
- Implement dual modes
- Local testing

**Day 3**: Phase 5 (3 hours)
- HTML5 export
- SharedArrayBuffer configuration
- Local web testing

**Days 4-5**: Phase 6 + Phase 7 (6 hours)
- Cloud deployment
- End-to-end testing
- Performance tuning

---

### Week 3: Polish (5-8 hours)

**Days 1-2**: Phase 8 (5 hours)
- Documentation updates
- Code cleanup
- Final testing

**Day 3**: Buffer & Launch

---

## Success Criteria

### Phase 1 Success Metrics ✅ ACHIEVED
✅ Add animation in Godot → LLM can use it immediately (no code edits)
✅ MCP server tool schemas match actual Godot capabilities
✅ Invalid animation requests return helpful error messages

### Phase 2 Success Metrics ✅ ACHIEVED
✅ `npm run build` succeeds
✅ `npm start` runs MCP server correctly
✅ MCP server visible in Claude Desktop

### Phase 3 Success Metrics
✅ Clear documentation for animation import
✅ Metadata system operational (optional)
✅ Can add 5+ animations in under 1 hour

### Phase 4 Success Metrics
✅ Desktop mode works (backward compatible)
✅ Web mode works (Godot connects to MCP)
✅ Can switch modes via export variables

### Phase 5 Success Metrics
✅ HTML5 export runs in browser
✅ SharedArrayBuffer enabled
✅ WebSocket connects to localhost MCP

### Phase 6 Success Metrics
✅ MCP server deployed with public URL
✅ Godot HTML5 deployed with public URL
✅ End-to-end system works from Claude Desktop

---

## Risk Assessment

### High Risk
❗ **SharedArrayBuffer browser support** - Some browsers restrict usage
**Mitigation**: Test on target browsers early, provide fallback message

❗ **WebSocket cloud connectivity** - Firewall/proxy issues
**Mitigation**: Use WSS (TLS), provide connection diagnostics

❗ **Godot HTML5 performance** - May be slower than native
**Mitigation**: Optimize assets, use GL Compatibility renderer

### Medium Risk
⚠️ **Animation retargeting quality** - Mixamo → VRM may have artifacts
**Mitigation**: Manual cleanup in Blender, document best practices

⚠️ **Cloud hosting costs** - WebSocket connections may be expensive
**Mitigation**: Use free tiers initially (Railway, Vercel), optimize connection pooling

### Low Risk
ℹ️ **Multi-user avatar control** - Simultaneous Claude commands
**Mitigation**: Implement command queuing, or route by user session

---

## Future Enhancements (Post-Launch)

### Voice Integration
- Speech-to-text input
- Text-to-speech output with lip sync
- Voice cloning for character personality

### Advanced Animation
- Procedural animation blending
- IK (Inverse Kinematics) for natural poses
- Physics-based hair/clothing simulation

### Multi-Avatar System
- Switch between characters
- Multiple avatars in same scene
- Conversation between avatars

### Persistence & Memory
- Store conversation history
- Remember user preferences
- Character personality evolution

### Social Features
- Shareable avatar sessions
- Public avatar gallery
- Community animation library

---

## Maintenance Plan

### Weekly
- [ ] Monitor cloud service costs
- [ ] Check error logs (Godot + MCP)
- [ ] Review animation usage analytics

### Monthly
- [ ] Update dependencies (npm packages)
- [ ] Review and optimize animations
- [ ] User feedback review

### Quarterly
- [ ] Godot engine updates
- [ ] MCP protocol updates
- [ ] Security audit

---

## Appendix

### A. File Reference

**Key Files to Modify**:
```
scripts/VRoidWebSocketController.gd  [Phase 1, 4]
live-vroid-mcp/src/index.ts          [Phase 1, 4]
live-vroid-mcp/src/godot_connection.ts [Phase 1]
live-vroid-mcp/package.json          [Phase 2]
export_presets.cfg                   [Phase 5]
```

**Key Files to Create**:
```
live-vroid-mcp/src/websocket_server.ts     [Phase 4]
animations/animation_metadata.json          [Phase 3]
docs/ANIMATION_WORKFLOW.md                  [Phase 3]
docs/DEPLOYMENT.md                          [Phase 6]
builds/web/_headers                         [Phase 5]
```

### B. Command Reference

```bash
# Development
godot --path . res://scenes/model.scn       # Run Godot
cd live-vroid-mcp && npm run dev             # MCP dev mode
npm run build                                # Build MCP

# Testing
websocat ws://localhost:8080                 # Test WebSocket
DEBUG=* npm start                            # MCP with logging

# Deployment
railway up                                   # Deploy MCP to Railway
vercel --prod                                # Deploy Godot to Vercel
fly deploy                                   # Deploy MCP to Fly.io
```

### C. Environment Variables

```bash
# MCP Server
GODOT_WS_URL=ws://localhost:8080            # Godot WebSocket URL (client mode)
WS_MODE=server                               # WebSocket mode: 'client' or 'server'
PORT=8080                                    # Server port (server mode)
NODE_ENV=production                          # Environment

# Godot (set in export settings or scene)
connection_mode=client                       # 'server' or 'client'
server_url=wss://your-server.com:8080       # MCP server URL (client mode)
```

---

## Change Log

**2025-11-02**: Initial implementation plan created
- Comprehensive analysis of current system
- Phased approach prioritizing local workflow
- Web deployment roadmap
- Dynamic animation discovery design

**2025-11-02**: Phases 1 & 2 completed
- ✅ Dynamic capabilities discovery system implemented
- ✅ MCP server build configuration fixed
- ✅ Godot sends capabilities in welcome message
- ✅ MCP server dynamically generates tool schemas
- Git commit: 56be486 "feat: Implement dynamic capabilities discovery system (Phase 1 & 2)"

---

**Document Status**: ✅ In Progress - Phases 1-2 Complete
**Next Step**: Phase 3 - Improve Animation Workflow
**Review Date**: After Phase 3 completion
