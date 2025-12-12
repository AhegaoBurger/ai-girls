import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        <p>Start a conversation with your AI companion</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            'flex',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          <div
            className={cn(
              'max-w-[80%] rounded-lg px-4 py-2',
              message.role === 'user'
                ? 'bg-purple-600 text-white'
                : 'bg-white/20 text-white backdrop-blur-sm'
            )}
          >
            <p className="text-sm">{message.text}</p>
            <p className="text-xs opacity-60 mt-1">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
