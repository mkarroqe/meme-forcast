import { NextRequest, NextResponse } from "next/server";
import { generateMeme, wrapForMemelord } from "@/lib/memelord";
import { hintFromMessage, statusFromMessage } from "@/lib/routeErrors";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      forecast?: string;
    };
    const forecast =
      typeof body.forecast === "string" ? body.forecast.trim() : "";
    if (!forecast) {
      return NextResponse.json(
        { error: "forecast is required" },
        { status: 400 },
      );
    }

    const prompt = wrapForMemelord(forecast);
    const memeUrl = await generateMeme(prompt);

    return NextResponse.json({ memeUrl, memePrompt: prompt });
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
