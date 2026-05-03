import { XMLParser } from "fast-xml-parser";

const FEED_URL = "https://techcrunch.com/feed/";

export type Headline = {
  title: string;
  link: string;
};

type RssItem = {
  title?: string | { "#text"?: string };
  link?: string;
};

function textFromTitle(title: RssItem["title"]): string {
  if (title == null) return "";
  if (typeof title === "string") return title.trim();
  if (typeof title === "object" && "#text" in title && title["#text"])
    return String(title["#text"]).trim();
  return String(title).trim();
}

function normalizeItems(raw: unknown): RssItem[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as RssItem[];
  return [raw as RssItem];
}

/**
 * Fetches TechCrunch RSS and returns the first n headlines with links.
 */
export async function getTopHeadlines(n = 5): Promise<Headline[]> {
  const res = await fetch(FEED_URL, {
    cache: "no-store",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  });

  if (!res.ok) {
    throw new Error(`TechCrunch feed failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
    cdataPropName: "#text",
  });

  const doc = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
    feed?: { entry?: unknown };
  };

  const channel = doc.rss?.channel;
  if (!channel) {
    throw new Error("Unexpected RSS shape: missing rss.channel");
  }

  const items = normalizeItems(channel.item);
  const headlines: Headline[] = [];

  for (const item of items) {
    const title = textFromTitle(item.title);
    const link = typeof item.link === "string" ? item.link.trim() : "";
    if (title && link) {
      headlines.push({ title, link });
      if (headlines.length >= n) break;
    }
  }

  if (headlines.length < n) {
    throw new Error(
      `Expected at least ${n} headlines with links, got ${headlines.length}`,
    );
  }

  return headlines;
}
