export interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AvatarCommand {
  clip?: string;
  emotion?: string;
  lookAt?: string;
}

export interface ChatResponse {
  text: string;
  avatarCommands: AvatarCommand[];
  timestamp: string;
}

export interface AvatarState {
  animation: string;
  emotion: string;
  lookAt: string;
}
