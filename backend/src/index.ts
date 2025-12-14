#!/usr/bin/env node

import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { createNodeWebSocket } from '@hono/node-ws';
import { GeminiAI } from './ai/gemini.js';
import { ConversationManager } from './lib/conversation.js';
import { createChatRoutes } from './routes/chat.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { GodotCapabilities, AvatarState, AvatarCommand } from './types/index.js';

// Get environment variables
const PORT = parseInt(process.env.PORT || '3000');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GOOGLE_GENERATIVE_AI_API_KEY) {
  console.error('[ERROR] GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Hono app
const app = new Hono();

// Initialize WebSocket support
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// CORS middleware for development
app.use('/api/*', cors({
  origin: [FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
}));

// Initialize AI and services
console.log('[Init] Initializing Gemini AI...');
const gemini = new GeminiAI(GOOGLE_GENERATIVE_AI_API_KEY);

console.log('[Init] Initializing conversation manager...');
const conversation = new ConversationManager(100);

// WebSocket state management
let godotClients = new Set<any>();
let frontendClients = new Set<any>();
let capabilities: GodotCapabilities | null = null;
let currentState: AvatarState = {
  animation: 'idle',
  emotion: 'neutral',
  lookAt: 'user',
};

// Helper to send avatar command to Godot clients
const sendAvatarCommand = (command: AvatarCommand): boolean => {
  if (godotClients.size === 0) {
    console.warn('[Godot WS] No clients connected');
    return false;
  }

  const message = {
    type: 'avatar_control',
    ...command,
  };

  let sent = false;
  godotClients.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify(message));
      sent = true;
      console.log('[Godot WS] Sent command:', command);
    }
  });

  if (sent) {
    // Update current state
    if (command.clip) currentState.animation = command.clip;
    if (command.emotion) currentState.emotion = command.emotion;
    if (command.lookAt) currentState.lookAt = command.lookAt;

    // Broadcast to frontend
    broadcastState(currentState);
  }

  return sent;
};

// Helper to broadcast state to frontend clients
const broadcastState = (state: AvatarState) => {
  const message = JSON.stringify({
    type: 'state_update',
    data: state,
  });

  frontendClients.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(message);
    }
  });
};

// Mock Godot WS object for chat routes
const godotWS = {
  sendAvatarCommand,
  getCapabilities: () => capabilities,
  getCurrentState: () => ({ ...currentState }),
  isConnected: () => godotClients.size > 0,
  getStatus: () => ({
    connected: godotClients.size > 0,
    clientCount: godotClients.size,
    hasCapabilities: capabilities !== null,
    currentState,
  }),
};

// WebSocket route for Godot client
app.get(
  '/godot',
  upgradeWebSocket((c) => {
    console.log('[Godot WS] Upgrade request');
    return {
      onOpen(event, ws) {
        console.log('[Godot WS] Client connected');
        godotClients.add(ws);

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'welcome',
          message: 'Connected to AI Girls Backend',
          state: currentState,
        }));
      },
      onMessage(event, ws) {
        try {
          const message = JSON.parse(event.data.toString());
          console.log('[Godot WS] Received:', message.type);

          if (message.type === 'capabilities') {
            capabilities = message.data;
            console.log('[Godot WS] Received capabilities:', capabilities);
            if (capabilities) {
              gemini.setCapabilities(capabilities);
            }
          } else if (message.type === 'state_update') {
            if (message.data) {
              currentState = { ...currentState, ...message.data };
              broadcastState(currentState);
            }
          }
        } catch (error) {
          console.error('[Godot WS] Parse error:', error);
        }
      },
      onClose(event, ws) {
        godotClients.delete(ws);
        console.log('[Godot WS] Client disconnected');
      },
      onError(event, ws) {
        console.error('[Godot WS] Error:', event);
      },
    };
  })
);

// WebSocket route for frontend state updates
app.get(
  '/ws/state',
  upgradeWebSocket((c) => {
    return {
      onOpen(event, ws) {
        console.log('[State WS] Frontend client connected');
        frontendClients.add(ws);

        // Send current state
        ws.send(JSON.stringify({
          type: 'state_update',
          data: currentState,
        }));
      },
      onMessage(event, ws) {
        // Frontend is read-only, no need to handle messages
      },
      onClose(event, ws) {
        frontendClients.delete(ws);
        console.log('[State WS] Frontend client disconnected');
      },
    };
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
console.log('[Init] Setting up API routes...');
const chatRoutes = createChatRoutes(gemini, conversation, godotWS as any);
app.route('/api/chat', chatRoutes);

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add Cross-Origin headers for Godot (required for SharedArrayBuffer)
app.use('/godot/*', async (c, next) => {
  c.header('Cross-Origin-Embedder-Policy', 'require-corp');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  await next();
});

// Serve Godot HTML5 build (production)
const godotBuildPath = path.join(__dirname, '../../godot-web-build');
app.use('/godot/*', serveStatic({
  root: godotBuildPath,
  rewriteRequestPath: (path) => path.replace(/^\/godot/, '')
}));

// Serve React frontend (production)
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
app.use('/*', serveStatic({ root: frontendBuildPath }));

// Fallback to index.html for client-side routing
app.get('/*', (c) => {
  return c.html('<h1>AI Girls Backend</h1><p>WebSocket server for Godot and React frontend</p>');
});

// Start HTTP server
console.log(`[Init] Starting server on port ${PORT}...`);
const server = serve({
  fetch: app.fetch,
  port: PORT,
});

// Inject WebSocket support
injectWebSocket(server);

console.log(`✅ Hono server running on http://localhost:${PORT}`);
console.log(`   - API: http://localhost:${PORT}/api/chat`);
console.log(`   - Health: http://localhost:${PORT}/health`);
console.log(`   - WebSocket (Godot): ws://localhost:${PORT}/godot`);
console.log(`   - WebSocket (State): ws://localhost:${PORT}/ws/state`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Shutdown] Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Shutdown] Shutting down gracefully...');
  process.exit(0);
});

export { app, gemini, conversation, godotWS };
