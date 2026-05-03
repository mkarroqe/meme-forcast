# Tech vibe forecast (meme-forecast)

Pulls the **top 5 items** from the [TechCrunch RSS feed](https://techcrunch.com/feed/) (title, description snippet, categories), uses **[Vercel AI Gateway](https://vercel.com/docs/ai-gateway)** to turn that into a short “tech worker day” vibe prompt, then calls the [Memelord](https://www.memelord.com) **AI image meme** API. The UI shows the generated prompt, the meme, and the source headlines.

## Prerequisites

- Node.js 18+
- A **Memelord** API key ([Developer settings](https://www.memelord.com/settings/developer)) — new accounts get **50 free API credits**. Each forecast uses **1 credit** (`POST /api/v1/ai-meme`). Generated image URLs expire after **24 hours**.
- **Vercel AI Gateway** — an API key from [AI Gateway API keys](https://vercel.com/docs/ai-gateway/getting-started/text#set-up-your-api-key) (or OIDC on Vercel). One LLM call per forecast.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:

- `MEMELORD_API_KEY` — full key (e.g. `mlord_live_...`).
- `AI_GATEWAY_API_KEY` — from the Vercel dashboard (needed for **local** `npm run dev`).
- Optional: `AI_GATEWAY_MODEL` — defaults to `openai/gpt-5.4` (any [gateway model id](https://vercel.com/docs/ai-gateway/models-and-providers) works).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Generate my tech day forecast**.

### Vercel production

If your project has **AI Gateway** enabled, `AI_GATEWAY_API_KEY` is typically **available at runtime** on Vercel without adding it manually. Still add `MEMELORD_API_KEY` in **Project → Settings → Environment Variables** if you have not already.

## How it works

1. Server fetches `https://techcrunch.com/feed/`, parses RSS, takes the first five items with title + link (+ description + categories when present).
2. Server calls `generateText` from the `ai` SDK with your gateway model; the model returns one short meme-oriented prompt (no full article scraping — RSS snippets only).
3. Server calls `POST https://www.memelord.com/api/v1/ai-meme` with that prompt and `Authorization: Bearer <MEMELORD_API_KEY>`.
4. The UI shows **AI prompt**, the meme image, and the five headline links.

API keys are **only** used on the server (`app/api/forecast/route.ts`); they are never sent to the browser.

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run start`| Production server  |
| `npm run lint` | ESLint             |

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, [Vercel AI SDK](https://sdk.vercel.ai/docs) (`ai`) for AI Gateway, [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) for RSS.
