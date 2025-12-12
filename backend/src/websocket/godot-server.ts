import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import type { Server } from 'http';
import type { AvatarCommand, GodotCapabilities, AvatarState } from '../types/index.js';

/**
 * WebSocket server for Godot client connections
 * Handles avatar control commands and state management
 */
export class GodotWebSocketServer extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private capabilities: GodotCapabilities | null = null;
  private currentState: AvatarState = {
    animation: 'idle',
    emotion: 'neutral',
    lookAt: 'user',
  };

  constructor(server: Server) {
    super();

    this.wss = new WebSocketServer({
      server,
      path: '/godot',
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[Godot WS] Client connected');
      this.clients.add(ws);

      // Send welcome message
      this.sendWelcome(ws);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message, ws);
        } catch (error) {
          console.error('[Godot WS] Parse error:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('[Godot WS] Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('[Godot WS] Error:', error);
      });
    });

    console.log('[Godot WS] Server initialized on path /godot');
  }

  private sendWelcome(ws: WebSocket) {
    const welcomeMessage = {
      type: 'welcome',
      message: 'Connected to AI Girls Backend',
      state: this.currentState,
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(welcomeMessage));
    }
  }

  private handleMessage(message: any, ws: WebSocket) {
    console.log('[Godot WS] Received:', message.type);

    if (message.type === 'capabilities') {
      this.capabilities = message.data;
      console.log('[Godot WS] Received capabilities:', this.capabilities);
      this.emit('capabilities_received', this.capabilities);
    } else if (message.type === 'state_update') {
      // Handle state updates from Godot
      if (message.data) {
        this.currentState = { ...this.currentState, ...message.data };
        this.emit('avatar_state_changed', this.currentState);
      }
    }
  }

  /**
   * Send avatar control command to Godot client
   */
  public sendAvatarCommand(command: AvatarCommand): boolean {
    if (this.clients.size === 0) {
      console.warn('[Godot WS] No clients connected');
      return false;
    }

    const message = {
      type: 'avatar_control',
      ...command,
    };

    const messageStr = JSON.stringify(message);
    let sent = false;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
        sent = true;
        console.log('[Godot WS] Sent command:', command);
      }
    });

    if (sent) {
      // Update current state
      if (command.clip) this.currentState.animation = command.clip;
      if (command.emotion) this.currentState.emotion = command.emotion;
      if (command.lookAt) this.currentState.lookAt = command.lookAt;

      // Emit state change for frontend
      this.emit('avatar_state_changed', this.currentState);
    }

    return sent;
  }

  /**
   * Get current capabilities from Godot
   */
  public getCapabilities(): GodotCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get current avatar state
   */
  public getCurrentState(): AvatarState {
    return { ...this.currentState };
  }

  /**
   * Check if Godot client is connected
   */
  public isConnected(): boolean {
    return this.clients.size > 0;
  }

  /**
   * Get connection status
   */
  public getStatus() {
    return {
      connected: this.isConnected(),
      clientCount: this.clients.size,
      hasCapabilities: this.capabilities !== null,
      currentState: this.currentState,
    };
  }
}
