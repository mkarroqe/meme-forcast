import { generateText } from "ai";
import type { Headline } from "@/lib/techcrunch";

const MODEL = process.env.AI_GATEWAY_MODEL ?? "openai/gpt-5.4";

const SYSTEM = `You write short, punchy meme prompts.
You are given the top tech headlines of the day. Output ONE sentence
(<= 200 chars) describing the *vibe* of working in tech today as a meme prompt.
No emojis. No quotes. No mention of "meme". No hashtags. No headline copy-paste.
Lean into specific anxieties, absurdities, or jokes implied by the news.`;

/**
 * Uses Vercel AI Gateway (set AI_GATEWAY_API_KEY; model via AI_GATEWAY_MODEL).
 */
export async function buildMemePrompt(headlines: Headline[]): Promise<string> {
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key?.trim()) {
    throw new Error("AI_GATEWAY_API_KEY is not set");
  }

  const bullets = headlines
    .map((h, i) => {
      const bits = [`${i + 1}. ${h.title}`];
      if (h.description) bits.push(`— ${h.description}`);
      if (h.categories?.length)
        bits.push(`[${h.categories.join(", ")}]`);
      return bits.join(" ");
    })
    .join("\n");

  const { text } = await generateText({
    model: MODEL,
    system: SYSTEM,
    prompt: `Top TechCrunch headlines today:\n\n${bullets}\n\nWrite the meme prompt now.`,
    temperature: 0.9,
  });

  const cleaned = text
    .trim()
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ");
  return cleaned.length > 200 ? cleaned.slice(0, 197) + "..." : cleaned;
}
