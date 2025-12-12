import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useChat } from '../hooks/useChat';
import { MessageList } from './MessageList';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage(input);
    setInput('');
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/20 shadow-2xl">
      <div className="p-4">
        {/* Messages */}
        <MessageList messages={messages} />

        {/* Input */}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Talk to your AI companion..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
