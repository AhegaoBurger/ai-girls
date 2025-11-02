#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GodotConnection } from "./godot_connection.js";

// Types
interface AvatarCommand {
  clip: string;
  emotion: string;
  lookAt: string;
}

interface AnimationStep {
  clip: string;
  emotion?: string;
  lookAt?: string;
  delay?: number;
}

interface EmotionKeywords {
  [key: string]: string[];
}

// Fallback defaults if Godot hasn't sent capabilities yet
const DEFAULT_ANIMATIONS = ["idle"] as const;
const DEFAULT_EMOTIONS = ["neutral"] as const;
const DEFAULT_LOOK_TARGETS = ["user"] as const;

// Singleton Godot connection instance
let godotConnection: GodotConnection | null = null;

function getGodotConnection(): GodotConnection {
  if (!godotConnection) {
    const url = process.env.GODOT_WS_URL || "ws://localhost:8080";
    godotConnection = new GodotConnection(url, 10000, 3, 2000);
  }
  return godotConnection;
}

// Get current capabilities from Godot or return defaults
function getCapabilities() {
  const godot = getGodotConnection();
  const caps = godot.getCapabilities();

  if (caps && caps.clips.length > 0) {
    return {
      animations: caps.clips,
      emotions: caps.emotions.length > 0 ? caps.emotions : [...DEFAULT_EMOTIONS],
      lookTargets:
        caps.lookTargets.length > 0 ? caps.lookTargets : [...DEFAULT_LOOK_TARGETS],
    };
  }

  // Return defaults if no capabilities received yet
  return {
    animations: [...DEFAULT_ANIMATIONS],
    emotions: [...DEFAULT_EMOTIONS],
    lookTargets: [...DEFAULT_LOOK_TARGETS],
  };
}

// Parse natural language to animation commands
function parseIntent(text: string): AvatarCommand {
  const lower = text.toLowerCase();
  const caps = getCapabilities();

  // Animation detection
  let clip: string = "idle";
  for (const anim of caps.animations) {
    if (lower.includes(anim)) {
      clip = anim;
      break;
    }
  }

  // Emotion detection
  let emotion: string = "neutral";
  const emotionMap: EmotionKeywords = {
    happy: ["happy", "joy", "glad", "pleased", "delighted", "cheerful"],
    sad: ["sad", "unhappy", "down", "depressed", "blue"],
    angry: ["angry", "mad", "furious", "annoyed", "irritated"],
    surprised: ["surprised", "shocked", "amazed", "astonished"],
    confused: ["confused", "puzzled", "perplexed", "bewildered"],
    excited: ["excited", "thrilled", "enthusiastic"],
    shy: ["shy", "bashful", "timid", "nervous"],
    confident: ["confident", "sure", "certain", "bold"],
    relaxed: ["relaxed", "calm", "peaceful", "tranquil"],
    bored: ["bored", "uninterested", "disengaged"],
  };

  for (const [emo, keywords] of Object.entries(emotionMap)) {
    if (
      keywords.some((keyword: string) => lower.includes(keyword)) &&
      caps.emotions.includes(emo)
    ) {
      emotion = emo;
      break;
    }
  }

  // Look direction
  let lookAt: string = "user";
  if (lower.includes("look away") || lower.includes("don't look")) {
    lookAt = "away";
  } else if (lower.includes("look down")) {
    lookAt = "down";
  } else if (lower.includes("look up")) {
    lookAt = "up";
  } else if (lower.includes("look left")) {
    lookAt = "left";
  } else if (lower.includes("look right")) {
    lookAt = "right";
  }

  return { clip, emotion, lookAt };
}

// Create MCP server
const server = new McpServer({
  name: "live-vroid-mcp",
  version: "1.0.0",
});

// Register control_avatar tool with dynamic schema
server.registerTool(
  "control_avatar",
  {
    title: "Control Avatar",
    description: "Control the VRoid avatar's animation, emotion, and gaze",
    inputSchema: {
      clip: z
        .string()
        .describe("Animation clip to play (e.g., idle, wave, sit, dance)")
        .default("idle"),
      emotion: z
        .string()
        .describe(
          "Facial expression (e.g., neutral, happy, sad, angry, surprised)",
        )
        .default("neutral"),
      lookAt: z
        .string()
        .describe("Where to look (e.g., user, away, down, up, left, right)")
        .default("user"),
    },
  },
  async ({
    clip = "idle",
    emotion = "neutral",
    lookAt = "user",
  }: {
    clip?: string;
    emotion?: string;
    lookAt?: string;
  }) => {
    try {
      const godot = getGodotConnection();
      const caps = getCapabilities();

      // Validate against available capabilities
      if (!caps.animations.includes(clip)) {
        return {
          content: [
            {
              type: "text",
              text: `Animation "${clip}" not available. Available: ${caps.animations.join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      const command: AvatarCommand = { clip, emotion, lookAt };

      // Send command through the Godot connection
      const result = await godot.sendCommand("avatar_control", command);

      return {
        content: [
          {
            type: "text",
            text: `Avatar updated: ${command.clip} animation, ${command.emotion} emotion, looking at ${command.lookAt}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register animate_from_text tool
server.registerTool(
  "animate_from_text",
  {
    title: "Animate from Text",
    description:
      "Automatically parse text to control avatar based on context and emotion",
    inputSchema: {
      text: z
        .string()
        .describe("Natural language describing action, emotion, or both"),
    },
  },
  async ({ text }: { text: string }) => {
    try {
      const godot = getGodotConnection();
      const command = parseIntent(text);

      // Send command through the Godot connection
      const result = await godot.sendCommand("avatar_control", command);

      return {
        content: [
          {
            type: "text",
            text: `Interpreted "${text}" as: ${command.clip} animation, ${command.emotion} emotion, looking at ${command.lookAt}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register sequence_animations tool with dynamic validation
server.registerTool(
  "sequence_animations",
  {
    title: "Sequence Animations",
    description: "Play a sequence of animations with timing",
    inputSchema: {
      sequence: z
        .array(
          z.object({
            clip: z.string().describe("Animation clip name"),
            emotion: z.string().optional().describe("Facial expression"),
            lookAt: z.string().optional().describe("Where to look"),
            delay: z
              .number()
              .optional()
              .describe("Delay in ms before this animation"),
          }),
        )
        .describe("Array of animation commands with optional delays"),
    },
  },
  async ({ sequence }: { sequence: AnimationStep[] }) => {
    try {
      const godot = getGodotConnection();
      const caps = getCapabilities();
      const results: string[] = [];

      // Validate all clips in sequence before executing
      for (const step of sequence) {
        if (!caps.animations.includes(step.clip)) {
          return {
            content: [
              {
                type: "text",
                text: `Animation "${step.clip}" not available. Available: ${caps.animations.join(", ")}`,
              },
            ],
            isError: true,
          };
        }
      }

      // Execute sequence
      for (const step of sequence) {
        if (step.delay) {
          await new Promise((resolve) => setTimeout(resolve, step.delay));
        }

        const command: AvatarCommand = {
          clip: step.clip,
          emotion: step.emotion || "neutral",
          lookAt: step.lookAt || "user",
        };

        await godot.sendCommand("avatar_control", command);
        results.push(`${command.clip} (${command.emotion})`);
      }

      return {
        content: [
          {
            type: "text",
            text: `Executed animation sequence: ${results.join(" → ")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Start server
async function main(): Promise<void> {
  try {
    console.error("Live-Vroid MCP Server starting...");

    // Start MCP server first
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server connected successfully");

    // Try to connect to Godot
    try {
      const godot = getGodotConnection();
      await godot.connect();
      console.error("Successfully connected to Godot WebSocket server");
    } catch (error) {
      const err = error as Error;
      console.warn(`Could not connect to Godot: ${err.message}`);
      console.warn("Will retry connection when commands are executed");
    }

    console.error("Live-Vroid MCP Server ready");
  } catch (error) {
    console.error("Fatal error during server startup:", error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.error("Shutting down gracefully...");
  const godot = getGodotConnection();
  godot.disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Shutting down gracefully...");
  const godot = getGodotConnection();
  godot.disconnect();
  process.exit(0);
});

main().catch((error: Error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
