#!/usr/bin/env node

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { GeminiAI } from './ai/gemini.js';
import { ConversationManager } from './lib/conversation.js';
import { GodotWebSocketServer } from './websocket/godot-server.js';
import { StateWebSocketServer } from './websocket/state-server.js';
import { createChatRoutes } from './routes/chat.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get environment variables
const PORT = parseInt(process.env.PORT || '3000');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('[ERROR] GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Hono app
const app = new Hono();

// CORS middleware for development
app.use('/api/*', cors({
  origin: [FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
}));

// Initialize AI and services
console.log('[Init] Initializing Gemini AI...');
const gemini = new GeminiAI(GEMINI_API_KEY);

console.log('[Init] Initializing conversation manager...');
const conversation = new ConversationManager(100);

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
const chatRoutes = createChatRoutes(gemini, conversation, {} as any); // Will be replaced after server starts
app.route('/api/chat', chatRoutes);

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve Godot HTML5 build (production)
const godotBuildPath = path.join(__dirname, '../../godot-web-build');
app.use('/godot/*', serveStatic({ root: godotBuildPath }));

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

console.log(`✅ Hono server running on http://localhost:${PORT}`);
console.log(`   - API: http://localhost:${PORT}/api/chat`);
console.log(`   - Health: http://localhost:${PORT}/health`);

// Initialize WebSocket servers after HTTP server is created
console.log('[Init] Initializing WebSocket servers...');
const godotWS = new GodotWebSocketServer(server);
const stateWS = new StateWebSocketServer(server);

// Wire up godot server to chat routes
// This is a workaround for circular dependency
(chatRoutes as any).godotWS = godotWS;

// Update chatRoutes to use the godotWS instance
const updatedChatRoutes = createChatRoutes(gemini, conversation, godotWS);
app.route('/api/chat', updatedChatRoutes);

// Connect Godot state changes to frontend state updates
godotWS.on('avatar_state_changed', (state) => {
  console.log('[Main] Avatar state changed:', state);
  stateWS.broadcastState(state);
});

// Update Gemini AI capabilities when Godot connects
godotWS.on('capabilities_received', (capabilities) => {
  console.log('[Main] Capabilities received from Godot:', capabilities);
  gemini.setCapabilities(capabilities);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Shutdown] Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Shutdown] Shutting down gracefully...');
  process.exit(0);
});

export { app, gemini, conversation, godotWS, stateWS };
