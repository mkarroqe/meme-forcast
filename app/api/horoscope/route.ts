import { NextRequest, NextResponse } from "next/server";
import { resolveHoroscopeModel } from "@/lib/models";
import { buildHoroscope } from "@/lib/promptBuilder";
import { hintFromMessage, statusFromMessage } from "@/lib/routeErrors";
import { getTopHeadlines } from "@/lib/techcrunch";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { model?: string };
    const model = resolveHoroscopeModel(body.model);
    const headlines = await getTopHeadlines(5);
    const { forecast, headlinesWithVibes } = await buildHoroscope(
      headlines,
      model,
    );

    return NextResponse.json({
      headlines: headlinesWithVibes,
      forecast,
      model,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      {
        error: message,
        hint: hintFromMessage(message),
      },
      { status: statusFromMessage(message) },
    );
  }
}
