import { XMLParser } from "fast-xml-parser";

const FEED_URL = "https://techcrunch.com/feed/";

export type Headline = {
  title: string;
  link: string;
  description?: string;
  categories?: string[];
};

type RssItem = {
  title?: string | { "#text"?: string };
  link?: string;
  description?: string | { "#text"?: string };
  category?: unknown;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function textFromField(
  field: string | { "#text"?: string } | undefined,
): string {
  if (field == null) return "";
  if (typeof field === "string") return stripHtml(field.trim());
  if (typeof field === "object" && "#text" in field && field["#text"]) {
    return stripHtml(String(field["#text"]).trim());
  }
  return stripHtml(String(field).trim());
}

function categoriesFromItem(category: unknown): string[] {
  if (category == null) return [];
  const out: string[] = [];

  const pushOne = (c: unknown) => {
    if (typeof c === "string") {
      const t = c.trim();
      if (t) out.push(t);
    } else if (c && typeof c === "object" && "#text" in c) {
      const t = String((c as { "#text"?: string })["#text"] ?? "").trim();
      if (t) out.push(t);
    }
  };

  if (Array.isArray(category)) {
    for (const c of category) pushOne(c);
  } else {
    pushOne(category);
  }

  return [...new Set(out)];
}

function normalizeItems(raw: unknown): RssItem[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as RssItem[];
  return [raw as RssItem];
}

/**
 * Fetches TechCrunch RSS and returns the first n headlines with links,
 * plus RSS description snippets and categories when present.
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
    const title = textFromField(item.title);
    const link = typeof item.link === "string" ? item.link.trim() : "";
    if (!title || !link) continue;

    const descriptionRaw = textFromField(item.description);
    const categories = categoriesFromItem(item.category);

    const headline: Headline = { title, link };
    if (descriptionRaw) headline.description = descriptionRaw;
    if (categories.length) headline.categories = categories;

    headlines.push(headline);
    if (headlines.length >= n) break;
  }

  if (headlines.length < n) {
    throw new Error(
      `Expected at least ${n} headlines with links, got ${headlines.length}`,
    );
  }

  return headlines;
}
