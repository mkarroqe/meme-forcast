import { generateText } from "ai";
import {
  DEFAULT_MODEL,
  isGatewayModelId,
  type GatewayModelId,
} from "@/lib/models";
import type { Headline } from "@/lib/techcrunch";

export type HeadlineVibe = Headline & { vibe: string };

export type Horoscope = {
  forecast: string;
  headlinesWithVibes: HeadlineVibe[];
};

const VIBE_SYSTEM = `You write Co-Star-style vibe lines for tech workers.
Given ONE tech headline, output ONE sentence (<=120 chars) describing the
cosmic energy it brings to a workday. Second person. Punchy, declarative,
slightly aloof. Mildly cryptic. No emojis, no quotes, no hashtags, no
naming the company or the headline text literally.`;

const SYNTH_SYSTEM = `You write Co-Star-style daily horoscopes for people
working in tech. Given 5 vibe lines drawn from today's tech headlines,
synthesize ONE forecast in 2-3 sentences (<=280 chars) describing what
the day at work will feel like. Second person. Punchy, declarative,
slightly aloof, mildly cryptic. No emojis, no quotes, no hashtags, no
naming the headlines.`;

function resolveModel(model?: GatewayModelId): string {
  if (model) return model;
  const fromEnv = process.env.AI_GATEWAY_MODEL?.trim();
  if (fromEnv && isGatewayModelId(fromEnv)) return fromEnv;
  return DEFAULT_MODEL;
}

export function cleanLine(text: string, max: number): string {
  const cleaned = text
    .trim()
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ");
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, Math.max(0, max - 3)) + "...";
}

async function vibeFor(h: Headline, model: string): Promise<string> {
  const ctx = [h.title, h.description, h.categories?.join(", ")]
    .filter(Boolean)
    .join(" — ");

  const { text } = await generateText({
    model,
    system: VIBE_SYSTEM,
    prompt: `Headline:\n${ctx}\n\nWrite the vibe line now.`,
    temperature: 0.95,
  });

  return cleanLine(text, 120);
}

async function synthesizeForecast(
  items: HeadlineVibe[],
  model: string,
): Promise<string> {
  const bullets = items.map((h, i) => `${i + 1}. ${h.vibe}`).join("\n");

  const { text } = await generateText({
    model,
    system: SYNTH_SYSTEM,
    prompt: `Today's vibe lines from tech headlines:\n\n${bullets}\n\nWrite the daily forecast now.`,
    temperature: 0.9,
  });

  return cleanLine(text, 280);
}

/**
 * Two-stage horoscope: parallel per-headline vibes, then one synthesis.
 * Uses Vercel AI Gateway (AI_GATEWAY_API_KEY).
 */
export async function buildHoroscope(
  headlines: Headline[],
  model?: GatewayModelId,
): Promise<Horoscope> {
  if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
    throw new Error("AI_GATEWAY_API_KEY is not set");
  }

  const m = resolveModel(model);
  const vibes = await Promise.all(headlines.map((h) => vibeFor(h, m)));
  const headlinesWithVibes: HeadlineVibe[] = headlines.map((h, i) => ({
    ...h,
    vibe: vibes[i] ?? "",
  }));
  const forecast = await synthesizeForecast(headlinesWithVibes, m);

  return { forecast, headlinesWithVibes };
}
