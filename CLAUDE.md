# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"AI Girls" is an **AI-powered companion system** that uses VRM (Virtual Reality Model) humanoid avatars controlled by Large Language Models. The goal is to create an interactive AI companion that can talk to users and express itself through animated 3D avatars in real-time.

The system consists of three layers:
1. **Frontend (Godot 4.5)**: Renders VRoid avatars with Mixamo animations in a web browser
2. **MCP Server (TypeScript/Node.js)**: Bridges LLM commands to avatar controls via WebSocket
3. **LLM Layer**: AI model (Claude, GPT, etc.) that uses MCP tools to control the avatar while conversing

## Key Technologies

- **Godot Engine 4.5** - Game engine with GL Compatibility renderer (HTML5 export target)
- **VRM Addon** - Full VRM 0.0 and 1.0 import/export support from V-Sekai team
- **MToon Shader** - Anime-style shader implementation for VRM models
- **Model Context Protocol (MCP)** - LLM-to-application communication standard
- **WebSocket API** - Real-time bidirectional communication between MCP server and Godot
- **TypeScript/Node.js** - MCP server implementation with Zod validation

## Development Commands

### Running the Complete System

**1. Start the Godot Frontend**
```bash
# Open project in Godot Editor
godot --editor --path /Users/bity/personal/ai-girls

# Run the project (WebSocket server starts automatically on port 8080)
godot --path /Users/bity/personal/ai-girls

# Run a specific scene
godot --path /Users/bity/personal/ai-girls res://vrm_samples/sample_scene.tscn
```

**2. Start the MCP Server**
```bash
cd live-vroid-mcp

# Install dependencies (first time only)
npm install
# or
pnpm install

# Development mode (with auto-restart)
npm run dev

# Production mode
npm start

# Build TypeScript
npm run build
```

**3. Configure LLM Client**
Add the MCP server to your Claude Desktop or compatible LLM client:
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

### Environment Variables (MCP Server)
```bash
# WebSocket URL for Godot connection (default: ws://localhost:8080)
export GODOT_WS_URL="ws://localhost:8080"

# Optional: Node environment
export NODE_ENV=production
```

### Git Workflow
The project uses `main` as the primary branch.

## Architecture

### System Flow

```
User ←→ LLM (Claude/GPT) ←→ MCP Server ←→ WebSocket ←→ Godot (VRoid Avatar)
         (conversation)      (tools)       (JSON)        (animations)
```

1. **User talks to LLM**: Natural language conversation
2. **LLM decides on expressions**: Based on context, chooses animations/emotions
3. **LLM calls MCP tools**: `control_avatar`, `animate_from_text`, or `sequence_animations`
4. **MCP Server translates**: Converts tool calls to WebSocket JSON commands
5. **Godot receives commands**: VRoidWebSocketController processes and applies animations
6. **Avatar responds**: Visual feedback synchronized with LLM conversation

### Core Components

**1. VRoidWebSocketController** (`scripts/VRoidWebSocketController.gd`)
- WebSocket server running on port 8080
- Receives JSON commands and applies them to AnimationPlayer
- Manages dual animation system:
  - **Global library**: State-based facial expressions (happy, sad, angry, surprised, relaxed, neutral) and look directions (up, down, left, right)
  - **Locomotion library**: Timeline-based Mixamo body animations (idle, sit, blow_kiss, jump, dance, etc.)
- Handles both MCP-style wrapped commands and direct JSON format
- Sends welcome message and state updates to clients

**2. MCP Server** (`live-vroid-mcp/src/index.ts`)
- Implements Model Context Protocol server using `@modelcontextprotocol/sdk`
- Provides three tools for LLM control:
  - `control_avatar`: Direct control (clip, emotion, lookAt)
  - `animate_from_text`: Natural language parsing ("wave happily at user")
  - `sequence_animations`: Chained animations with timing
- Uses StdioServerTransport for LLM communication
- Singleton GodotConnection instance manages WebSocket state

**3. GodotConnection** (`live-vroid-mcp/src/godot_connection.ts`)
- WebSocket client that connects to Godot server
- Manages connection lifecycle with automatic reconnection (3 retries, 2s delay)
- Command queue with timeout handling (10s default)
- Tracks pending commands by ID for request/response matching
- Graceful error handling and connection recovery

### Animation System Architecture

The project uses a sophisticated dual-library animation approach:

1. **Global Animation Library** (`[Global]/...`)
   - Facial expressions: Applied immediately via `advance(0.0)` for state-based control
   - Look directions: lookUp, lookDown, lookLeft, lookRight
   - Mouth shapes for lip sync: aa, ee, ih, oh, ou
   - Special animations: blink, RESET

2. **Locomotion Animation Library** (`locomotion/...`)
   - Body animations from Mixamo
   - Timeline-based playback
   - Automatic return to idle for one-shot animations (wave, jump, blow_kiss, clap, bow, nod, shake_head)

### WebSocket Protocol

**MCP Format** (from MCP server):
```json
{
  "type": "avatar_control",
  "params": {
    "clip": "wave",
    "emotion": "happy",
    "lookAt": "user"
  },
  "commandId": "cmd_123"
}
```

**Direct Format** (for testing/simple clients):
```json
{
  "clip": "sit",
  "emotion": "sad",
  "lookAt": "down"
}
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "animation": "wave",
    "emotion": "happy",
    "lookAt": "user"
  },
  "commandId": "cmd_123"
}
```

### MCP Tools API

**control_avatar**
- Direct, precise control over avatar state
- Parameters: `clip` (animation), `emotion` (expression), `lookAt` (gaze direction)
- All parameters have sensible defaults (idle, neutral, user)

**animate_from_text**
- Natural language interpretation for intuitive control
- Example: "wave happily at the user" → {clip: "wave", emotion: "happy", lookAt: "user"}
- Uses keyword matching for animations and emotion detection

**sequence_animations**
- Chain multiple animations with timing control
- Each step can specify clip, emotion, lookAt, and delay (in ms)
- Useful for complex multi-step reactions

### VRM Loading

**Runtime Loading** (`vrm_samples/load_at_runtime_scene.gd`)
- Demonstrates programmatic VRM model loading
- Uses `GLTFDocument` + `vrm_extension` for loading
- Supports drag-and-drop of `.vrm` and `.glb` files
- Important: Must generate tangent arrays for meshes with blend shapes (flag = 8)

**Static Scene Usage** (`vrm_samples/sample_script.gd`)
- Simple scene-embedded VRM models with looping animations

### Critical Addon Requirements

⚠️ **IMPORTANT**: The addon paths MUST NOT be renamed:
- `addons/vrm` - Referenced by generated VRM meta scripts
- `addons/Godot-MToon-Shader` - Referenced by generated materials

Both plugins must be enabled in Project Settings → Plugins.

### VRM Features & Limitations

**Supported**:
- VRM 0.0 and 1.0 import (0.0 converts to 1.0 naming)
- VRM 1.0 export
- MToon materials with HDR emissive
- Spring bones (needs optimization)
- Node constraints (buggy with retargeting)
- Humanoid skeleton retargeting via SkeletonProfileHumanoid
- Expressions (blend shapes, material color/UV offsets)
- First-person head hiding with multiple modes

**Known Issues**:
- VRMC_node_constraint: Buggy when combined with retargeting
- VRMC_springBone: Not supported in standalone .gltf export
- lookAt: Only creates animation tracks, app must create BlendSpace2D
- firstPerson: Head hiding requires camera layers or runtime script
- On Godot 4.3+: `update_secondary_fixed` no longer supported

**Not Yet Implemented**:
- VRMC_vrm_animation (planned for humanoid AnimationLibrary import/export)

### Main Scene

The main scene is `scenes/model.tscn`, which contains the VRoidWebSocketController with a fully configured VRM avatar and animation system. This is the active working scene that enables WebSocket communication on port 8080.

#### Current Main Scene Details

**File**: `scenes/model.tscn` (also available as binary `model.scn`)
- Text-based Godot scene format (.tscn) for version control
- Scene UID: `uid://bo3qpvbhglfr5`
- **Root Node**: "Model" (Node3D) with VRoidWebSocketController script attached (scripts/VRoidWebSocketController.gd:1_d1fkk)
- **VRM Character**: "testy" node with full VRM setup
  - GeneralSkeleton with humanoid rig
  - Face, Body, Hair meshes with MToon shaders
  - VRM spring bones for physics (hair, clothing)
  - VRM collider groups for cloth simulation
- **AnimationPlayer**: Located at `testy/AnimationPlayer`
  - Includes locomotion library (res://animations/locomotion.res:13_mwlj6)
  - Includes facial expressions from VRM blend shapes
  - Blink animations (res://animations/blinkRight.res:12_hmcfp)
- **Camera3D** and **DirectionalLight3D** for scene rendering
- WebSocket server runs on port 8080 when scene is launched
- This is the actively working scene for local development

## Working with VRM Models

### Importing VRM Models
1. Place `.vrm` files in the project directory
2. Godot will auto-import them using the VRM addon
3. Configure import settings for head hiding mode if needed
4. Models are automatically converted to Godot scenes

### Animation Mapping
When adding new animations to VRoidWebSocketController:
1. Add Mixamo FBX animations to your VRM model's AnimationPlayer
2. Update `animation_mappings` dictionary with MCP name → Godot animation name
3. Determine if animation is one-shot (returns to idle) or looping
4. Test via WebSocket API

### Facial Expressions
VRM expressions are implemented as animation tracks intended for BlendTree Add2 nodes. The controller applies them immediately using `animation_player.advance(0.0)` for instant state changes.

## Supported Animations & Emotions

### Animation Clips
**Available**: idle, wave, jump, walk, run, dance, sit, stand, nod, shake_head, laugh, think, point, clap, bow

**One-shot** (auto-return to idle): wave, jump, blow_kiss, clap, bow, nod, shake_head

**Looping**: idle, sit, walk, run, dance, think, point

### Emotions (Facial Expressions)
neutral, happy, sad, angry, surprised, relaxed, confused, excited, bored, shy, confident

### Look Directions
user (forward), away, down, up, left, right

## Project Structure

```
ai-girls/
├── addons/
│   ├── vrm/                    # VRM addon (DO NOT RENAME)
│   │   ├── 1.0/               # VRM 1.0 extensions
│   │   ├── node_constraint/   # Bone constraints
│   │   └── import_vrm.gd      # Main importer
│   └── Godot-MToon-Shader/    # MToon shader (DO NOT RENAME)
├── scripts/
│   └── VRoidWebSocketController.gd  # Main WebSocket controller
├── vrm_samples/               # Example scenes and VRM models
│   ├── sample_scene.tscn      # Static scene example
│   ├── load_at_runtime_scene.tscn  # Dynamic loading example
│   └── *.vrm                  # Sample VRM models
├── vroid_models/              # VRoid Studio models
├── mixamo_models/             # Mixamo animations
├── live-vroid-mcp/            # MCP server for LLM control
│   ├── src/
│   │   ├── index.ts          # Main MCP server with tool definitions
│   │   └── godot_connection.ts  # WebSocket client for Godot
│   ├── build/                # Compiled JavaScript output
│   ├── package.json          # Dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
└── project.godot              # Main project configuration
```

## Godot 4.3+ Considerations

The VRM addon uses SkeletonModifier3D for spring bones and node constraints. On Godot 4.3+:
- The Skeleton node determines physics vs idle processing (not the modifier)
- `update_secondary_fixed` is no longer supported
- Internal nodes are created as children of Skeleton3D for processing

## Development Workflow

### Adding New Animations
1. Export animation from Mixamo (FBX format)
2. Import FBX into Blender with your VRM model
3. Merge and cleanup animations in Blender
4. Export as glTF/glb
5. Import into Godot (will auto-detect animations)
6. Update `animation_mappings` in VRoidWebSocketController.gd
7. Determine if animation is one-shot or looping
8. Test via direct WebSocket commands or MCP tools

### Testing the System

**Direct WebSocket Testing** (without MCP):
```bash
# Use websocat or similar WebSocket client
websocat ws://localhost:8080

# Send test command
{"clip": "wave", "emotion": "happy", "lookAt": "user"}
```

**MCP Testing** (with LLM):
1. Start Godot (WebSocket server on port 8080)
2. Start MCP server: `cd live-vroid-mcp && npm run dev`
3. Configure your LLM client to use the MCP server
4. Ask the LLM to control the avatar (it will use the tools automatically)

**Debugging**:
- Godot console shows received commands and animation playback
- MCP server logs to stderr (connection status, commands sent)
- Check WebSocket connection status in both logs

## Future Development Plans

### Next Steps for AI Companion
1. **Voice Integration**: Add speech-to-text for voice input
2. **TTS Output**: Synchronize lip-sync with AI speech
3. **Context Memory**: Maintain conversation history across sessions
4. **Personality System**: Define avatar personality traits that influence responses
5. **Multi-Avatar Support**: Switch between different characters
6. **Deployment**: Export Godot to HTML5, deploy MCP server to cloud

### Current Limitations
- No lip-sync (mouth shapes exist but not connected to speech)
- Limited animation library (expandable via Mixamo)
- Single avatar at a time
- Local-only (no cloud deployment yet)
- Text-based conversation only (no voice)
