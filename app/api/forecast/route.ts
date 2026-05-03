import { NextResponse } from "next/server";
import { generateMeme } from "@/lib/memelord";
import { buildMemePrompt } from "@/lib/promptBuilder";
import { getTopHeadlines } from "@/lib/techcrunch";

function statusFromMessage(message: string): number {
  if (message.includes("AI_GATEWAY_API_KEY is not set")) return 500;
  if (message.includes("Memelord API error") && message.includes("(401)"))
    return 401;
  if (message.includes("Memelord API error") && message.includes("(402)"))
    return 402;
  if (message.includes("Memelord API error") && message.includes("(429)"))
    return 429;
  if (
    !message.includes("Memelord") &&
    (message.includes("Unauthorized") ||
      /\b401\b/.test(message) ||
      message.includes("invalid api key"))
  )
    return 401;
  if (
    !message.includes("Memelord") &&
    (/\b429\b/.test(message) || /rate limit/i.test(message))
  )
    return 429;
  return 500;
}

function hintFromMessage(message: string): string | undefined {
  if (message.includes("MEMELORD_API_KEY")) {
    return "Copy .env.local.example to .env.local and set MEMELORD_API_KEY from memelord.com/settings/developer";
  }
  if (message.includes("AI_GATEWAY_API_KEY")) {
    return "Set AI_GATEWAY_API_KEY in Vercel project env (or .env.local locally) from vercel.com → AI Gateway → API keys";
  }
  return undefined;
}

export async function POST() {
  try {
    const headlines = await getTopHeadlines(5);
    const memePrompt = await buildMemePrompt(headlines);
    const memeUrl = await generateMeme(memePrompt);

    return NextResponse.json({
      memeUrl,
      headlines,
      memePrompt,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = statusFromMessage(message);

    return NextResponse.json(
      {
        error: message,
        hint: hintFromMessage(message),
      },
      { status },
    );
  }
}
