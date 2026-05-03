export function statusFromMessage(message: string): number {
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

export function hintFromMessage(message: string): string | undefined {
  if (message.includes("MEMELORD_API_KEY")) {
    return "Copy .env.local.example to .env.local and set MEMELORD_API_KEY from memelord.com/settings/developer";
  }
  if (message.includes("AI_GATEWAY_API_KEY")) {
    return "Set AI_GATEWAY_API_KEY in Vercel project env (or .env.local locally) from vercel.com → AI Gateway → API keys";
  }
  return undefined;
}
