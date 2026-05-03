import { NextResponse } from "next/server";
import { generateMeme } from "@/lib/memelord";
import { getTopHeadlines } from "@/lib/techcrunch";

export async function POST() {
  try {
    const headlines = await getTopHeadlines(5);
    const titles = headlines.map((h) => h.title);
    const memeUrl = await generateMeme(titles);

    return NextResponse.json({
      memeUrl,
      headlines,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const isKey = message.includes("MEMELORD_API_KEY");
    const status =
      message.includes("Memelord API error") && message.includes("(401)")
        ? 401
        : message.includes("Memelord API error") && message.includes("(402)")
          ? 402
          : message.includes("Memelord API error") && message.includes("(429)")
            ? 429
            : 500;

    return NextResponse.json(
      {
        error: message,
        hint: isKey
          ? "Copy .env.local.example to .env.local and set MEMELORD_API_KEY from memelord.com/settings/developer"
          : undefined,
      },
      { status },
    );
  }
}
