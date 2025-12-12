# AI Girls - Web MVP Deployment

🎭 An AI-powered companion system with VRM humanoid avatars controlled by Large Language Models, now ready for web deployment!

## 🌟 What's New in Web MVP

This deployment setup transforms the desktop AI Girls application into a **web-based MVP** with:

- ✅ **React Frontend** with Grok-style chat interface (shadcn/ui + Tailwind CSS)
- ✅ **Hono Backend** with server-side Gemini AI integration
- ✅ **Godot HTML5** canvas running in the browser
- ✅ **WebSocket Architecture** (inverted from desktop version)
- ✅ **Ubuntu VPS Deployment** configs for Hetzner or any Linux server

## 📁 Project Structure

```
ai-girls/
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/    # Chat UI components
│   │   ├── hooks/         # React hooks (useChat)
│   │   ├── lib/           # API client & utilities
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── backend/                # Hono + Gemini AI
│   ├── src/
│   │   ├── ai/           # Gemini client with tool calling
│   │   ├── websocket/    # Godot & state servers
│   │   ├── routes/       # Chat API endpoints
│   │   └── lib/          # Avatar control logic
│   └── package.json
│
├── godot/                  # Godot 4.5 project
│   ├── scripts/           # Godot scripts
│   │   └── VRoidWebSocketController.gd  # Now supports client mode!
│   ├── scenes/            # Godot scenes
│   ├── addons/            # VRM & MToon addons
│   ├── animations/        # Animation libraries
│   ├── project.godot      # Godot project file
│   └── export_presets.cfg # HTML5 export settings
│
├── godot-web-build/        # Godot HTML5 export (generated)
│
└── deployment/             # VPS deployment configs
    ├── nginx/             # Nginx reverse proxy config
    └── systemd/           # Systemd service file
```

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- Godot 4.5 (for exporting HTML5 build)
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
npm run dev  # Starts on http://localhost:3000
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173
```

### 3. Export Godot Project

1. Open the `godot/` folder in Godot 4.5
2. Go to **Project → Export**
3. Select **Web (HTML5)** preset
4. Click **Export Project**
5. Export to `../godot-web-build/index.html` (one level up from godot folder)

### 4. Test Locally

Open `http://localhost:5173` in your browser. You should see:
- Godot canvas (your VRM avatar) as the background
- Chat interface overlay at the bottom
- Type a message and watch the avatar animate!

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Browser                                │
│  ┌─────────────────────────────────┐   │
│  │  React Frontend                 │   │
│  │  • Chat Interface               │   │
│  │  • shadcn/ui components         │   │
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
│  Ubuntu VPS (Hetzner)                   │
│  ┌─────────────────────────────────┐   │
│  │  Hono Backend (:3000)           │   │
│  │  ┌──────────────────────────┐   │   │
│  │  │  Gemini AI Integration   │   │   │
│  │  │  • Server-side LLM calls │   │   │
│  │  │  • Tool calling          │   │   │
│  │  │  • control_avatar        │   │   │
│  │  └──────────────────────────┘   │   │
│  │  ┌──────────────────────────┐   │   │
│  │  │  WebSocket Servers       │   │   │
│  │  │  • /godot (Godot client) │   │   │
│  │  │  • /ws/state (Frontend)  │   │   │
│  │  └──────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Nginx Reverse Proxy                    │
│  • SSL termination (Let's Encrypt)      │
│  • WebSocket upgrade support            │
│  • Static file serving                  │
└─────────────────────────────────────────┘
```

### Key Architectural Changes from Desktop Version

| Component | Desktop (Old) | Web (New) |
|-----------|---------------|-----------|
| **Godot** | WebSocket SERVER | WebSocket CLIENT |
| **Connection** | MCP server connects to Godot | Godot connects to backend |
| **LLM Calls** | Desktop client (Claude Desktop) | Server-side (Hono + Gemini) |
| **Frontend** | N/A | React + Vite |
| **Deployment** | Local only | Web (Ubuntu VPS) |

## 🎮 How It Works

1. **User types message** in React chat interface
2. **Frontend sends** POST request to `/api/chat`
3. **Hono backend** calls Gemini AI with function calling enabled
4. **Gemini responds** with text + avatar control tool calls
5. **Backend sends** WebSocket commands to Godot client
6. **Godot animates** the VRM avatar (wave, smile, etc.)
7. **Frontend displays** AI response text

## 🎨 Avatar Control

The AI can control the avatar using these tools:

### `control_avatar`
Direct control over:
- **Animations**: idle, wave, sit, jump, dance, blow_kiss, clap, bow, nod
- **Emotions**: neutral, happy, sad, angry, surprised, relaxed
- **Gaze**: user, away, down, up, left, right

### `animate_from_text`
Natural language interpretation:
- "wave happily" → {clip: "wave", emotion: "happy"}
- "sit down sadly" → {clip: "sit", emotion: "sad"}

## 🌐 Deployment to VPS

Full deployment guide in [`deployment/README.md`](deployment/README.md).

### Quick Deployment

```bash
# On VPS
git clone https://github.com/yourusername/ai-girls.git
cd ai-girls

# Build backend
cd backend
npm install && npm run build

# Build frontend
cd ../frontend
npm install && npm run build

# Setup systemd service
sudo cp deployment/systemd/ai-girls.service /etc/systemd/system/
sudo systemctl enable ai-girls
sudo systemctl start ai-girls

# Setup Nginx
sudo cp deployment/nginx/ai-girls.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/ai-girls.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 📝 Development Workflow

### Adding New Animations

1. Add Mixamo animation to Godot AnimationPlayer
2. Update `animation_mappings` in `godot/scripts/VRoidWebSocketController.gd`
3. Re-export Godot HTML5 build
4. Deploy updated build

### Modifying AI Behavior

Edit the system prompt in `backend/src/ai/gemini.ts`:

```typescript
const DEFAULT_SYSTEM_PROMPT = `You are a friendly AI companion...`;
```

### Customizing UI

React components use Tailwind CSS and shadcn/ui:
- Main layout: `frontend/src/App.tsx`
- Chat interface: `frontend/src/components/ChatInterface.tsx`
- Styles: `frontend/src/index.css`

## 🔧 Configuration

### Backend Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### Frontend Environment Variables

```env
VITE_API_URL=  # Empty for same-origin (production)
```

## 🐛 Troubleshooting

### Godot Canvas Not Loading

- Check if files exist in `godot-web-build/`
- Verify COOP/COEP headers in Nginx config
- Check browser console for errors
- Ensure threading is enabled in export preset

### WebSocket Connection Failed

- Verify backend is running: `sudo systemctl status ai-girls`
- Check firewall rules: `sudo ufw status`
- Inspect browser console network tab
- Verify Nginx WebSocket upgrade configuration

### Gemini API Errors

- Check API key is set correctly
- Verify API quota/limits
- Check backend logs: `sudo journalctl -u ai-girls -f`

## 💰 Cost Estimate

- **Hetzner VPS (CX21)**: €5-10/month
- **Domain**: €10/year
- **Gemini API**: Free tier (60 req/min) or pay-as-you-go (~$0.001/request)
- **Total**: ~€15-20/month

## 📚 Documentation

- [Backend README](backend/README.md) - Hono server details
- [Frontend README](frontend/README.md) - React app details
- [Deployment Guide](deployment/README.md) - Full VPS deployment instructions
- [Original CLAUDE.md](CLAUDE.md) - Desktop version architecture

## 🎯 Next Steps

MVP is ready! Consider these enhancements:

1. **Voice Integration**: Add speech-to-text for voice input
2. **TTS Output**: Synchronize lip-sync with AI speech
3. **Persistence**: Add database for conversation history
4. **Multi-Avatar**: Support switching between characters
5. **Authentication**: Add user accounts and sessions

## 📄 License

MIT

## 🙏 Acknowledgments

- VRM addon by V-Sekai team
- Mixamo for animations
- shadcn/ui for components
- Hono for the backend framework
- Google Gemini for cost-effective AI

---

**Ready to deploy your AI companion to the web!** 🚀

For questions or issues, check the troubleshooting guides in each component's README.
