import { NextRequest, NextResponse } from "next/server";
import { resolveHoroscopeModel } from "@/lib/models";
import { streamHoroscopeEvents } from "@/lib/promptBuilder";
import type { Headline } from "@/lib/techcrunch";

function isHeadlineArray(x: unknown): x is Headline[] {
  if (!Array.isArray(x) || x.length !== 5) return false;
  return x.every(
    (h) =>
      h != null &&
      typeof h === "object" &&
      typeof (h as Headline).title === "string" &&
      typeof (h as Headline).link === "string",
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => (null))) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as { headlines?: unknown; model?: string };
  if (!isHeadlineArray(b.headlines)) {
    return NextResponse.json(
      { error: "body.headlines must be an array of exactly 5 headline objects" },
      { status: 400 },
    );
  }

  const model = resolveHoroscopeModel(b.model);
  const headlines = b.headlines;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
      };

      try {
        await streamHoroscopeEvents(headlines, model, send);
      } catch (e) {
        send({
          type: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
