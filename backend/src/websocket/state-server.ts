import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { AvatarState } from '../types/index.js';

/**
 * WebSocket server for frontend state updates
 * Broadcasts avatar state changes to connected clients
 */
export class StateWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/state',
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[State WS] Client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('[State WS] Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('[State WS] Error:', error);
      });

      // Optional: Handle messages from frontend if needed
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('[State WS] Received from frontend:', message);
          // Handle frontend messages if needed
        } catch (error) {
          console.error('[State WS] Parse error:', error);
        }
      });
    });

    console.log('[State WS] Server initialized on path /ws/state');
  }

  /**
   * Broadcast avatar state to all connected frontends
   */
  public broadcastState(state: AvatarState) {
    const message = {
      type: 'state_update',
      state,
      timestamp: new Date().toISOString(),
    };

    const messageStr = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });

    console.log('[State WS] Broadcasted state to', this.clients.size, 'clients');
  }

  /**
   * Send message to all connected clients
   */
  public broadcast(message: any) {
    const messageStr = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Get number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }
}
