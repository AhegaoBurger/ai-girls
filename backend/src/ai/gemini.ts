import { google } from "@ai-sdk/google";
import { generateText, streamText, tool } from "ai";
import { z } from "zod";
import type { AvatarCommand, GodotCapabilities } from "../types/index.js";
import { parseTextToCommand } from "../lib/avatar-controller.js";

/**
 * System prompt for the AI companion
 */
const DEFAULT_SYSTEM_PROMPT = `You are a friendly AI companion with a 3D avatar. You can express yourself through animations and emotions.

When appropriate, use the control_avatar function to:
- Change your body animation (wave, sit, jump, dance, etc.) to match your actions
- Express emotions through facial expressions (happy, sad, surprised, etc.) to match your feelings
- Direct your gaze (look at user, away, down, etc.) based on the context

Guidelines for using avatar control:
- Use it naturally as part of your responses, not every single message
- Match your animation and emotion to what you're saying
- For greetings: wave with a happy expression
- When thinking: use thinking animation
- When excited: jump or dance
- When sad or empathetic: show sad expression
- For emphasis: use gestures like pointing or clapping
- Look away when shy or embarrassed, look down when sad

Keep responses conversational, friendly, and concise (2-3 sentences typically). You're here to be a helpful, expressive companion.`;

/**
 * Avatar control tool for AI SDK
 */
const controlAvatarTool = tool({
  description:
    "Control the VRoid avatar's animation, facial expression, and gaze direction to express yourself physically",
  parameters: z.object({
    clip: z
      .string()
      .optional()
      .describe(
        "Body animation to play: idle, wave, sit, jump, dance, blow_kiss, clap, bow, nod, shake_head",
      ),
    emotion: z
      .string()
      .optional()
      .describe(
        "Facial expression to show: neutral, happy, sad, angry, surprised, relaxed",
      ),
    lookAt: z
      .string()
      .optional()
      .describe("Where to direct gaze: user, away, down, up, left, right"),
  }),
  execute: async ({ clip, emotion, lookAt }) => {
    // Return success - actual execution happens in the route handler
    return { success: true, clip, emotion, lookAt };
  },
});

/**
 * Animate from text tool for AI SDK
 */
const animateFromTextTool = tool({
  description:
    'Interpret natural language to control the avatar (e.g., "wave happily at user"). Use this when you want to describe an action in natural language.',
  parameters: z.object({
    text: z
      .string()
      .describe(
        'Natural language description of the action/emotion (e.g., "wave happily", "sit down sadly")',
      ),
  }),
  execute: async ({ text }) => {
    // Return success - actual parsing happens in the route handler
    return { success: true, text };
  },
});

export interface GeminiResponse {
  text: string;
  avatarCommands: AvatarCommand[];
}

/**
 * Gemini AI client using AI SDK
 */
export class GeminiAI {
  private model: any;
  private systemPrompt: string;
  private capabilities: GodotCapabilities | null = null;
  private conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [];

  constructor(apiKey: string, systemPrompt?: string) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }

    this.systemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;

    // Initialize Gemini model with AI SDK
    this.model = google("gemini-2.5-flash", {
      // Cost-effective model with good function calling
    });

    console.log(
      "[Gemini AI] Initialized with AI SDK and model: gemini-2.0-flash-exp",
    );
  }

  /**
   * Update capabilities from Godot
   */
  setCapabilities(capabilities: GodotCapabilities) {
    this.capabilities = capabilities;
    console.log("[Gemini AI] Capabilities updated:", capabilities);
  }

  /**
   * Send message and get response with avatar commands
   */
  async sendMessage(userMessage: string): Promise<GeminiResponse> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
      });

      // Build messages array for AI SDK
      const messages = this.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Generate response with tools
      const result = await generateText({
        model: this.model,
        system: this.systemPrompt,
        messages,
        tools: {
          control_avatar: controlAvatarTool,
          animate_from_text: animateFromTextTool,
        },
        maxSteps: 5, // Allow multiple tool calls
      });

      const avatarCommands: AvatarCommand[] = [];

      // Process tool calls from steps
      if (result.steps && result.steps.length > 0) {
        console.log("[Gemini AI] Total steps:", result.steps.length);

        for (const step of result.steps) {
          if (step.toolCalls && step.toolCalls.length > 0) {
            console.log("[Gemini AI] Tool calls in step:", step.toolCalls);

            for (const toolCall of step.toolCalls) {
              if (toolCall.toolName === "control_avatar") {
                const args = toolCall.args as {
                  clip?: string;
                  emotion?: string;
                  lookAt?: string;
                };
                avatarCommands.push({
                  clip: args.clip,
                  emotion: args.emotion,
                  lookAt: args.lookAt,
                });
              } else if (toolCall.toolName === "animate_from_text") {
                const args = toolCall.args as { text: string };
                // Parse text to avatar command
                const parsed = parseTextToCommand(args.text, this.capabilities);
                avatarCommands.push(parsed);
              }
            }
          }
        }
      }

      // Get the final text response
      const responseText = result.text;

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: responseText,
      });

      return {
        text: responseText,
        avatarCommands,
      };
    } catch (error) {
      console.error("[Gemini AI] Error:", error);
      throw new Error("Failed to get response from Gemini AI");
    }
  }

  /**
   * Stream message response (for future use)
   */
  async streamMessage(userMessage: string) {
    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    const messages = this.conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Use streamText for streaming responses
    const result = streamText({
      model: this.model,
      system: this.systemPrompt,
      messages,
      tools: {
        control_avatar: controlAvatarTool,
        animate_from_text: animateFromTextTool,
      },
      maxSteps: 5,
    });

    return result;
  }

  /**
   * Clear conversation history
   */
  resetChat() {
    this.conversationHistory = [];
    console.log("[Gemini AI] Chat session reset");
  }

  /**
   * Set custom system prompt
   */
  updateSystemPrompt(prompt: string) {
    this.systemPrompt = prompt;
    console.log("[Gemini AI] System prompt updated");
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return [...this.conversationHistory];
  }
}
