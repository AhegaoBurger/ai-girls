# AI Girls

> **LLM-controlled VRoid avatars with real-time animations powered by Godot Engine and Model Context Protocol**

An AI companion system that brings virtual avatars to life through natural language conversations. The system uses VRoid Studio characters with Mixamo animations, controlled by Large Language Models via MCP (Model Context Protocol) for expressive, synchronized visual feedback.

![AI Girls Demo](vrm_samples/screenshot/vrm_sample_screenshot.png)

## 🎯 What is AI Girls?

AI Girls is a framework for creating **interactive AI companions** with visual presence. Unlike text-only chatbots, these companions express themselves through:

- **Animated body language**: Wave, jump, dance, sit, and more via Mixamo animations
- **Facial expressions**: Happy, sad, surprised, angry - synchronized with conversation tone
- **Gaze direction**: Look at the user, look away, look down - adding natural interaction cues
- **Real-time response**: Visual feedback happens instantly as the LLM processes conversation

### The Vision

Create AI companions that feel alive through the combination of:
1. Natural language understanding and conversation (LLM)
2. Expressive 3D avatars (VRoid + Godot)
3. Contextual animations and emotions (MCP bridge)

## 🏗️ Architecture

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────┐     ┌─────────────┐
│  User   │ ←→  │   LLM    │ ←→  │ MCP Server  │ ←→  │ WebSocket│ ←→  │   Godot     │
│         │     │ (Claude) │     │ (Node.js)   │     │          │     │ (VRoid)     │
└─────────┘     └──────────┘     └─────────────┘     └──────────┘     └─────────────┘
    Text          Decides              Tools            JSON           Animations
  conversation    expressions          API             commands        + Expressions
```

### Components

1. **Frontend (Godot 4.5)**
   - Renders VRM avatars with anime-style MToon shader
   - WebSocket server receives animation commands
   - Dual animation system: Global (expressions) + Locomotion (body)

2. **MCP Server (TypeScript)**
   - Implements Model Context Protocol for LLM integration
   - Three tools: `control_avatar`, `animate_from_text`, `sequence_animations`
   - Manages WebSocket connection to Godot with auto-reconnection

3. **LLM Layer (Claude, GPT, etc.)**
   - Converses naturally with users
   - Automatically calls MCP tools to control avatar
   - Synchronizes visual feedback with conversation context

## 🚀 Quick Start

### Prerequisites

- **Godot Engine 4.5+**
- **Node.js 18+** (with npm or pnpm)
- **LLM Client** supporting MCP (e.g., Claude Desktop)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-girls.git
   cd ai-girls
   ```

2. **Install MCP server dependencies**
   ```bash
   cd live-vroid-mcp
   npm install
   npm run build
   cd ..
   ```

3. **Open Godot project**
   ```bash
   godot --editor --path .
   ```

4. **Enable required plugins**
   - Project → Project Settings → Plugins
   - Enable "VRM" and "Godot-MToon-Shader"

### Running the System

**Terminal 1: Start Godot**
```bash
# Run the main scene (scenes/model.tscn) - WebSocket server starts automatically on port 8080
godot --path .

# Or run directly without opening editor:
godot --path . res://scenes/model.tscn
```

**Terminal 2: Start MCP Server**
```bash
cd live-vroid-mcp
npm run dev
```

**Configure your LLM Client**

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
```json
{
  "mcpServers": {
    "live-vroid": {
      "command": "node",
      "args": ["/absolute/path/to/ai-girls/live-vroid-mcp/build/index.js"]
    }
  }
}
```

**Start chatting!**
Open Claude Desktop and start a conversation. The AI will automatically control the avatar based on context.

## 🎮 Available Commands

### MCP Tools (for LLM)

**`control_avatar`** - Direct control over avatar state
```typescript
control_avatar({
  clip: "wave",        // Animation to play
  emotion: "happy",    // Facial expression
  lookAt: "user"       // Gaze direction
})
```

**`animate_from_text`** - Natural language interpretation
```typescript
animate_from_text({
  text: "wave happily at the user"
})
// Automatically interprets: wave + happy + looking at user
```

**`sequence_animations`** - Chain multiple animations
```typescript
sequence_animations({
  sequence: [
    { clip: "wave", emotion: "happy", delay: 0 },
    { clip: "jump", emotion: "excited", delay: 2000 },
    { clip: "bow", emotion: "shy", delay: 1000 }
  ]
})
```

### Animation Clips
`idle`, `wave`, `jump`, `walk`, `run`, `dance`, `sit`, `stand`, `nod`, `shake_head`, `laugh`, `think`, `point`, `clap`, `bow`

### Emotions
`neutral`, `happy`, `sad`, `angry`, `surprised`, `relaxed`, `confused`, `excited`, `bored`, `shy`, `confident`

### Look Directions
`user`, `away`, `down`, `up`, `left`, `right`

## 🛠️ Development

### Adding New Animations

1. **Get animation from Mixamo**
   - Upload your VRM model to Mixamo
   - Select and download animation (FBX format)

2. **Import to Blender**
   - Import VRM model + animation FBX
   - Merge and cleanup animations
   - Export as glTF/glb

3. **Import to Godot**
   - Drag glTF into project
   - Godot auto-imports animations

4. **Update controller**
   - Edit `scripts/VRoidWebSocketController.gd`
   - Add mapping in `animation_mappings` dictionary
   - Specify if one-shot or looping

### Testing WebSocket Directly

```bash
# Install websocat
brew install websocat  # macOS
# or: cargo install websocat

# Connect and send commands
websocat ws://localhost:8080
{"clip": "wave", "emotion": "happy", "lookAt": "user"}
```

### Project Structure

```
ai-girls/
├── addons/
│   ├── vrm/                    # VRM 0.0/1.0 importer (V-Sekai)
│   └── Godot-MToon-Shader/     # Anime shader for VRM
├── scripts/
│   └── VRoidWebSocketController.gd  # Main animation controller
├── vrm_samples/                # Example scenes and models
├── live-vroid-mcp/             # MCP server for LLM
│   ├── src/
│   │   ├── index.ts           # MCP server & tools
│   │   └── godot_connection.ts # WebSocket client
│   └── package.json
└── project.godot
```

## 🎨 Asset Pipeline

```
VRoid Studio → Mixamo (auto-rig) → Blender (merge) → glTF → Godot
   Character      Animations         Cleanup        Export   Import
```

## 🔮 Future Plans

- [ ] **Voice Integration**: Speech-to-text for voice input
- [ ] **TTS + Lip Sync**: Synchronized mouth movements with AI speech
- [ ] **Context Memory**: Remember past conversations
- [ ] **Personality System**: Define character traits that influence responses
- [ ] **Multi-Avatar Support**: Switch between different characters
- [ ] **HTML5 Export**: Deploy as web application
- [ ] **Cloud Deployment**: Host MCP server publicly

## 🤝 Credits & Acknowledgments

### Core Technologies
- **[Godot Engine](https://godotengine.org/)** - Open-source 3D engine
- **[VRM Specification](https://vrm.dev/)** - VR avatar standard
- **[V-Sekai VRM Addon](https://github.com/V-Sekai/godot-vrm)** - VRM import/export for Godot
- **[VRoid Studio](https://vroid.com/)** - Character creation tool
- **[Mixamo](https://www.mixamo.com/)** - Animation library
- **[Model Context Protocol](https://github.com/modelcontextprotocol)** - LLM integration standard

### VRM Addon Contributors (V-Sekai Team)
- [@aaronfranke](https://github.com/aaronfranke) and [The Mirror team](https://www.themirror.space/)
- [@fire](https://github.com/fire)
- [@TokageItLab](https://github.com/TokageItLab)
- [@lyuma](https://github.com/lyuma)
- [@SaracenOne](https://github.com/SaracenOne)

### VRM Tooling
- [VRM Consortium](https://github.com/vrm-c)
- [@Santarh](https://github.com/Santarh)
- [@ousttrue](https://github.com/ousttrue)
- [@saturday06](https://github.com/saturday06)
- [@FMS-Cat](https://github.com/FMS-Cat)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues & Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/yourusername/ai-girls/issues).

For questions about VRM addon functionality, refer to the [VRM addon documentation](addons/vrm/README.md).

---

**Made with ❤️ for the future of interactive AI companions**
