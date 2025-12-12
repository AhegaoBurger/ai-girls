import type { ChatResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

export async function getChatHistory() {
  const response = await fetch(`${API_BASE}/api/chat/history`);

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
}

export async function clearChatHistory() {
  const response = await fetch(`${API_BASE}/api/chat/history`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to clear history');
  }

  return response.json();
}
