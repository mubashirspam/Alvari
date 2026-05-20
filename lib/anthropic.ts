import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

export const DEFAULT_MODEL = env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local before generating content.",
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function isAnthropicConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}
