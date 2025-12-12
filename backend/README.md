# AI Girls Backend

Hono backend server for AI Girls web application with Gemini AI integration.

## Features

- **Gemini AI Integration**: Server-side LLM calls with function calling for avatar control
- **WebSocket Server**: Handles connections from Godot HTML5 canvas
- **State Broadcasting**: Real-time avatar state updates to frontend
- **Chat API**: RESTful endpoints for chat messaging
- **Conversation History**: In-memory conversation tracking

## Setup

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## Development

```bash
npm run dev
```

Server will start on `http://localhost:3000` with hot reload enabled.

## Production

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

## API Endpoints

### Chat

- `POST /api/chat` - Send chat message
  - Request: `{ "message": "Hello!" }`
  - Response: `{ "text": "...", "avatarCommands": [...], "timestamp": "..." }`

- `GET /api/chat/history` - Get conversation history
- `DELETE /api/chat/history` - Clear conversation history
- `GET /api/chat/status` - Get system status

### Health

- `GET /health` - Health check

## WebSocket Endpoints

- `/godot` - WebSocket for Godot canvas connections
- `/ws/state` - WebSocket for frontend state updates

## Project Structure

```
src/
├── index.ts                 # Main server entry point
├── ai/
│   └── gemini.ts           # Gemini AI client
├── websocket/
│   ├── godot-server.ts     # Godot WebSocket server
│   └── state-server.ts     # Frontend state WebSocket
├── routes/
│   └── chat.ts             # Chat API routes
├── lib/
│   ├── avatar-controller.ts # Avatar command logic
│   └── conversation.ts      # Conversation history manager
└── types/
    └── index.ts            # TypeScript type definitions
```

## License

MIT
