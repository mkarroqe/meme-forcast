# Tech vibe forecast (meme-forecast)

Pulls the **top 5 headlines** from the [TechCrunch RSS feed](https://techcrunch.com/feed/), sends them as a prompt to the [Memelord](https://www.memelord.com) **AI image meme** API, and shows one meme as a “forecast” for your day working in tech.

## Prerequisites

- Node.js 18+
- A Memelord API key ([Developer settings](https://www.memelord.com/settings/developer)) — new accounts get **50 free API credits**. Each forecast uses **1 credit** (`POST /api/v1/ai-meme`). Generated image URLs expire after **24 hours**.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local` and set `MEMELORD_API_KEY` to your full key (e.g. `mlord_live_...`).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Generate my tech day forecast**.

## How it works

1. Server fetches `https://techcrunch.com/feed/`, parses RSS, takes the first five items with title + link.
2. Server builds the prompt:  
   `{title1} | {title2} | … — forecast what my day working in tech will feel like as a meme.`
3. Server calls `POST https://www.memelord.com/api/v1/ai-meme` with `Authorization: Bearer <MEMELORD_API_KEY>`.
4. The UI displays the returned image URL and lists the five source headlines.

The Memelord key is **only** used on the server (`app/api/forecast/route.ts`); it is never sent to the browser.

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run start`| Production server  |
| `npm run lint` | ESLint             |

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) for RSS.
