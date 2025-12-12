import type { AvatarCommand, GodotCapabilities } from '../types/index.js';

/**
 * Emotion keyword mappings for natural language parsing
 */
interface EmotionKeywords {
  [key: string]: string[];
}

const EMOTION_MAP: EmotionKeywords = {
  happy: ['happy', 'joy', 'glad', 'pleased', 'delighted', 'cheerful', 'smile', 'smiling'],
  sad: ['sad', 'unhappy', 'down', 'depressed', 'blue', 'cry', 'crying'],
  angry: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'upset'],
  surprised: ['surprised', 'shocked', 'amazed', 'astonished', 'wow'],
  confused: ['confused', 'puzzled', 'perplexed', 'bewildered'],
  excited: ['excited', 'thrilled', 'enthusiastic'],
  shy: ['shy', 'bashful', 'timid', 'nervous'],
  confident: ['confident', 'sure', 'certain', 'bold'],
  relaxed: ['relaxed', 'calm', 'peaceful', 'tranquil', 'chill'],
  bored: ['bored', 'uninterested', 'disengaged'],
};

/**
 * Parse natural language text to avatar control command
 * Ported from live-vroid-mcp/src/index.ts:parseIntent()
 */
export function parseTextToCommand(
  text: string,
  capabilities?: GodotCapabilities | null
): AvatarCommand {
  const lower = text.toLowerCase();

  // Default animations (fallback)
  const availableAnimations = capabilities?.clips || [
    'idle',
    'wave',
    'sit',
    'jump',
    'dance',
    'blow_kiss',
    'clap',
    'bow',
    'nod',
    'shake_head',
  ];

  const availableEmotions = capabilities?.emotions || [
    'neutral',
    'happy',
    'sad',
    'angry',
    'surprised',
    'relaxed',
  ];

  // Animation detection - scan for animation names in text
  let clip = 'idle';
  for (const anim of availableAnimations) {
    if (lower.includes(anim.replace('_', ' '))) {
      clip = anim;
      break;
    }
  }

  // Emotion detection - use keyword mapping
  let emotion = 'neutral';
  for (const [emo, keywords] of Object.entries(EMOTION_MAP)) {
    if (
      keywords.some((keyword) => lower.includes(keyword)) &&
      availableEmotions.includes(emo)
    ) {
      emotion = emo;
      break;
    }
  }

  // Look direction detection
  let lookAt = 'user';
  if (lower.includes('look away') || lower.includes("don't look")) {
    lookAt = 'away';
  } else if (lower.includes('look down')) {
    lookAt = 'down';
  } else if (lower.includes('look up')) {
    lookAt = 'up';
  } else if (lower.includes('look left')) {
    lookAt = 'left';
  } else if (lower.includes('look right')) {
    lookAt = 'right';
  }

  return { clip, emotion, lookAt };
}

/**
 * Validate avatar command against capabilities
 */
export function validateCommand(
  command: AvatarCommand,
  capabilities: GodotCapabilities | null
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!capabilities) {
    warnings.push('Capabilities not available, cannot validate command');
    return { valid: true, errors, warnings };
  }

  if (command.clip && !capabilities.clips.includes(command.clip)) {
    warnings.push(
      `Animation "${command.clip}" not in capabilities. Available: ${capabilities.clips.join(', ')}`
    );
  }

  if (command.emotion && !capabilities.emotions.includes(command.emotion)) {
    warnings.push(
      `Emotion "${command.emotion}" not in capabilities. Available: ${capabilities.emotions.join(', ')}`
    );
  }

  if (command.lookAt && !capabilities.lookTargets.includes(command.lookAt)) {
    warnings.push(
      `Look target "${command.lookAt}" not in capabilities. Available: ${capabilities.lookTargets.join(', ')}`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Create default avatar command with sensible defaults
 */
export function createDefaultCommand(): AvatarCommand {
  return {
    clip: 'idle',
    emotion: 'neutral',
    lookAt: 'user',
  };
}

/**
 * Merge partial command with defaults
 */
export function mergeWithDefaults(partial: AvatarCommand): AvatarCommand {
  const defaults = createDefaultCommand();
  return {
    clip: partial.clip || defaults.clip,
    emotion: partial.emotion || defaults.emotion,
    lookAt: partial.lookAt || defaults.lookAt,
  };
}
