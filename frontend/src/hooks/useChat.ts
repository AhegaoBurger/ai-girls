import { useState, useCallback } from 'react';
import { sendChatMessage } from '../lib/api';
import type { Message } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    // Add user message
    const userMessage: Message = {
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    try {
      const response = await sendChatMessage(text);

      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        text: response.text,
        timestamp: response.timestamp,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
  };
}
