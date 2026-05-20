import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { DEFAULT_MODEL, getAnthropicClient } from "@/lib/anthropic";
import { BRAND_VOICE, buildUserPrompt } from "./prompts";
import type { ContentTopic } from "./topics";

const GeneratedPostSchema = z
  .object({
    title: z.string().describe("Final post title, ≤70 characters, no quotes."),
    slug: z
      .string()
      .describe(
        "URL slug in kebab-case, lowercase, ASCII only, 3–8 words. Must be unique-feeling.",
      ),
    excerpt: z
      .string()
      .describe(
        "1–2 sentence summary, 140–200 characters, written to make a reader click.",
      ),
    metaTitle: z
      .string()
      .describe("SEO title tag, ≤60 characters. May differ from the post title."),
    metaDescription: z
      .string()
      .describe(
        "Meta description, ≤160 characters. Plain prose, no quotes, must contain at least one target keyword naturally.",
      ),
    contentMarkdown: z
      .string()
      .describe(
        "The full article body in Markdown. 700–1100 words. Starts with a 1–2 sentence lede, then ## H2 sections. Do NOT include the title as an H1.",
      ),
    tags: z
      .array(z.string())
      .describe("3–6 lowercase, kebab-case tags. Reuse target keywords where they fit."),
    readingMinutes: z
      .number()
      .int()
      .describe("Estimated reading time in whole minutes, between 3 and 8."),
  })
  .strict();

export type GeneratedPost = z.infer<typeof GeneratedPostSchema>;

export type GenerationResult = {
  post: GeneratedPost;
  usage: {
    model: string;
    inputTokens: number;
    outputTokens: number;
  };
};

export async function generateBlogPost(
  topic: ContentTopic,
): Promise<GenerationResult> {
  const client = getAnthropicClient();

  const response = await client.messages.parse({
    model: DEFAULT_MODEL,
    max_tokens: 16000,
    system: BRAND_VOICE,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(GeneratedPostSchema),
    },
    messages: [{ role: "user", content: buildUserPrompt(topic) }],
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error(
      `Blog generation failed: model did not return a parseable response (stop_reason=${response.stop_reason}).`,
    );
  }

  return {
    post: parsed,
    usage: {
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
