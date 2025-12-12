/**
 * Shared TypeScript types for AI Girls backend
 */

export interface AvatarCommand {
  clip?: string;
  emotion?: string;
  lookAt?: string;
}

export interface GodotCapabilities {
  clips: string[];
  emotions: string[];
  lookTargets: string[];
  mouthShapes: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  avatarCommands?: AvatarCommand[];
}

export interface AvatarState {
  animation: string;
  emotion: string;
  lookAt: string;
}

export interface GodotMessage {
  type: string;
  data?: any;
  commandId?: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  text: string;
  avatarCommands: AvatarCommand[];
  timestamp: string;
}
