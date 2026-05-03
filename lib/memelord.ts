const MEMELORD_URL = "https://www.memelord.com/api/v1/ai-meme";

type MemelordResult = {
  success?: boolean;
  url?: string;
  results?: Array<{ success?: boolean; url?: string }>;
  message?: string;
  error?: string;
};

/**
 * Sends a finished prompt to the Memelord image meme API.
 */
export async function generateMeme(prompt: string): Promise<string> {
  const key = process.env.MEMELORD_API_KEY;
  if (!key?.trim()) {
    throw new Error("MEMELORD_API_KEY is not set");
  }

  const res = await fetch(MEMELORD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const body = (await res.json().catch(() => ({}))) as MemelordResult;

  if (!res.ok) {
    const msg =
      body.message ||
      body.error ||
      (typeof body === "object" && body !== null
        ? JSON.stringify(body)
        : res.statusText);
    throw new Error(`Memelord API error (${res.status}): ${msg}`);
  }

  const first = body.results?.[0];
  const url = first?.url ?? body.url;
  if (!url) {
    throw new Error(
      body.message ||
        "Memelord returned no image URL. Check credits and API response.",
    );
  }

  return url;
}
