import { getTopHeadlines } from "@/lib/techcrunch";
import { HoroscopeClient } from "./_components/HoroscopeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const headlines = await getTopHeadlines(5);
  return <HoroscopeClient initialHeadlines={headlines} />;
}
