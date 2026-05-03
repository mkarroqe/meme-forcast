# Tech vibe forecast (meme-forecast)

Pulls the **top 5 items** from the [TechCrunch RSS feed](https://techcrunch.com/feed/) (title, description snippet, categories), uses **[Vercel AI Gateway](https://vercel.com/docs/ai-gateway)** for a two-stage Co-Star-style horoscope (per-headline vibes + combined forecast), then optionally calls [Memelord](https://www.memelord.com) to render a meme from a wrapped prompt.

## Prerequisites

- Node.js 18+
- A **Memelord** API key ([Developer settings](https://www.memelord.com/settings/developer)) — new accounts get **50 free API credits**. Each **meme** uses **1 credit** (`POST /api/v1/ai-meme`). Generated image URLs expire after **24 hours**.
- **Vercel AI Gateway** — an API key from [AI Gateway API keys](https://vercel.com/docs/ai-gateway/getting-started/text#set-up-your-api-key) (or OIDC on Vercel). Reading the horoscope uses several LLM calls; no Memelord credit until you click **Generate meme**.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:

- `MEMELORD_API_KEY` — full key (e.g. `mlord_live_...`).
- `AI_GATEWAY_API_KEY` — from the Vercel dashboard (needed for **local** `npm run dev`).
- Optional: `AI_GATEWAY_MODEL` — defaults to `anthropic/claude-sonnet-4.6` (must match a curated id in `lib/models.ts` when used as fallback).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000): **Read my horoscope**, then **Generate meme** when you like the combined energy.

### Vercel production

If your project has **AI Gateway** enabled, `AI_GATEWAY_API_KEY` is typically **available at runtime** on Vercel without adding it manually. Still add `MEMELORD_API_KEY` in **Project → Settings → Environment Variables** if you have not already.

## How it works

1. **Home page (RSC)** — Loads the top 5 TechCrunch headlines on the server (`getTopHeadlines`) so they appear immediately.
2. **`POST /api/horoscope`** — Body: `{ "headlines": Headline[], "model"?: string }`. Streams **NDJSON** lines: `{ "type": "vibe", "index", "vibe" }` as each parallel headline call finishes, then `{ "type": "forecast", "forecast" }`. Optional `model` must be a curated id in [`lib/models.ts`](lib/models.ts) (else env / default).
3. The UI shows each headline with a cosmic spinner until its vibe line arrives, then the combined fate; **Generate meme** still sends `wrapForMemelord(forecast)` to Memelord on the server only.
4. **`POST /api/meme`** — Body: `{ "forecast": "..." }`. Server wraps the forecast, then `POST https://www.memelord.com/api/v1/ai-meme` with `Authorization: Bearer <MEMELORD_API_KEY>`.

API keys are **only** used on the server (`app/api/horoscope/route.ts`, `app/api/meme/route.ts`); they are never sent to the browser.

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run start`| Production server  |
| `npm run lint` | ESLint             |

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, [Vercel AI SDK](https://sdk.vercel.ai/docs) (`ai`) for AI Gateway, [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) for RSS.
