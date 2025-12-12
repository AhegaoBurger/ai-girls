import type { ChatMessage } from '../types/index.js';

/**
 * Simple in-memory conversation history manager
 * For MVP - can be extended to use database or Redis for persistence
 */
export class ConversationManager {
  private history: ChatMessage[] = [];
  private maxHistoryLength: number;

  constructor(maxHistoryLength: number = 100) {
    this.maxHistoryLength = maxHistoryLength;
  }

  /**
   * Add message to conversation history
   */
  addMessage(message: ChatMessage) {
    this.history.push(message);

    // Trim history if it exceeds max length
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  /**
   * Get recent messages
   */
  getRecent(count: number): ChatMessage[] {
    return this.history.slice(-count);
  }

  /**
   * Clear conversation history
   */
  clear() {
    this.history = [];
  }

  /**
   * Get history length
   */
  getLength(): number {
    return this.history.length;
  }

  /**
   * Format history for AI context
   * Returns array of { role, parts } for Gemini
   */
  formatForGemini(maxMessages: number = 20): Array<{ role: string; parts: Array<{ text: string }> }> {
    const recent = this.getRecent(maxMessages);
    return recent.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));
  }
}
