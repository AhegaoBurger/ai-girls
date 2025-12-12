import { Hono } from 'hono';
import type { GeminiAI } from '../ai/gemini.js';
import type { ConversationManager } from '../lib/conversation.js';
import type { GodotWebSocketServer } from '../websocket/godot-server.js';
import type { ChatRequest, ChatResponse, ChatMessage } from '../types/index.js';

/**
 * Create chat routes
 * Requires dependency injection of gemini, conversation manager, and godot server
 */
export function createChatRoutes(
  gemini: GeminiAI,
  conversation: ConversationManager,
  godotWS: GodotWebSocketServer
) {
  const app = new Hono();

  /**
   * POST /api/chat - Send chat message
   */
  app.post('/', async (c) => {
    try {
      const body = await c.req.json<ChatRequest>();
      const { message } = body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return c.json({ error: 'Message is required and must be a non-empty string' }, 400);
      }

      console.log('[Chat API] User message:', message);

      // Add user message to conversation
      const userMessage: ChatMessage = {
        role: 'user',
        text: message,
        timestamp: new Date().toISOString(),
      };
      conversation.addMessage(userMessage);

      // Get AI response with avatar commands
      const { text, avatarCommands } = await gemini.sendMessage(message);

      console.log('[Chat API] AI response:', text);
      console.log('[Chat API] Avatar commands:', avatarCommands);

      // Send avatar commands to Godot
      for (const command of avatarCommands) {
        const sent = godotWS.sendAvatarCommand(command);
        if (!sent) {
          console.warn('[Chat API] Godot not connected, avatar command not sent:', command);
        }
      }

      // Add assistant message to conversation
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text,
        timestamp: new Date().toISOString(),
        avatarCommands,
      };
      conversation.addMessage(assistantMessage);

      // Prepare response
      const response: ChatResponse = {
        text,
        avatarCommands,
        timestamp: assistantMessage.timestamp,
      };

      return c.json(response);
    } catch (error) {
      console.error('[Chat API] Error:', error);
      return c.json(
        {
          error: 'Failed to process message',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  /**
   * GET /api/chat/history - Get conversation history
   */
  app.get('/history', (c) => {
    try {
      const history = conversation.getHistory();
      return c.json({
        history,
        length: history.length,
      });
    } catch (error) {
      console.error('[Chat API] Error fetching history:', error);
      return c.json({ error: 'Failed to fetch conversation history' }, 500);
    }
  });

  /**
   * DELETE /api/chat/history - Clear conversation history
   */
  app.delete('/history', (c) => {
    try {
      conversation.clear();
      gemini.resetChat();
      console.log('[Chat API] Conversation history cleared');
      return c.json({ success: true, message: 'History cleared' });
    } catch (error) {
      console.error('[Chat API] Error clearing history:', error);
      return c.json({ error: 'Failed to clear history' }, 500);
    }
  });

  /**
   * GET /api/chat/status - Get chat system status
   */
  app.get('/status', (c) => {
    try {
      const godotStatus = godotWS.getStatus();
      const status = {
        godot: godotStatus,
        conversation: {
          messageCount: conversation.getLength(),
        },
      };
      return c.json(status);
    } catch (error) {
      console.error('[Chat API] Error getting status:', error);
      return c.json({ error: 'Failed to get status' }, 500);
    }
  });

  return app;
}
