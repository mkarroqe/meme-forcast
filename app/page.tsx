"use client";

import { useCallback, useState } from "react";

type Headline = {
  title: string;
  link: string;
  description?: string;
  categories?: string[];
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | undefined>();
  const [memeUrl, setMemeUrl] = useState<string | null>(null);
  const [memePrompt, setMemePrompt] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<Headline[] | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHint(undefined);
    setMemeUrl(null);
    setMemePrompt(null);
    setHeadlines(null);

    try {
      const res = await fetch("/api/forecast", { method: "POST" });
      const data = (await res.json()) as {
        memeUrl?: string;
        memePrompt?: string;
        headlines?: Headline[];
        error?: string;
        hint?: string;
      };

      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        setHint(data.hint);
        return;
      }

      if (data.memeUrl && data.headlines) {
        setMemeUrl(data.memeUrl);
        setMemePrompt(data.memePrompt ?? null);
        setHeadlines(data.headlines);
      } else {
        setError("Unexpected response from server");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center px-4 py-16">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--muted)]">
        Meme forecast
      </p>
      <h1 className="mb-2 bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
        Today&apos;s tech vibe
      </h1>
      <p className="mb-10 max-w-md text-center text-[var(--muted)]">
        Top 5 TechCrunch headlines feed an AI Gateway prompt, then Memelord renders
        the vibe. Uses 1 Memelord credit per run plus one LLM call.
      </p>

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="mb-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Forecasting…" : "Generate my tech day forecast"}
      </button>

      {loading && (
        <div
          className="mb-8 h-72 w-full max-w-md animate-pulse rounded-2xl bg-[var(--surface)] ring-1 ring-[var(--border)]"
          aria-hidden
        />
      )}

      {error && (
        <div
          className="mb-8 w-full max-w-md rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-red-200"
          role="alert"
        >
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 text-sm opacity-90">{error}</p>
          {hint && (
            <p className="mt-2 text-sm text-red-100/80">{hint}</p>
          )}
        </div>
      )}

      {memeUrl && !loading && (
        <div className="w-full max-w-md space-y-8">
          {memePrompt && (
            <p className="text-center text-sm italic leading-relaxed text-[var(--muted)]">
              <span className="font-medium not-italic text-zinc-400">
                AI prompt:{" "}
              </span>
              {memePrompt}
            </p>
          )}
          <div className="overflow-hidden rounded-2xl bg-[var(--surface)] p-2 ring-1 ring-[var(--border)]">
            {/* Signed Memelord URLs may be any host; plain img avoids remotePatterns churn */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={memeUrl}
              alt="Your tech day forecast meme"
              className="w-full rounded-xl"
            />
          </div>

          {headlines && headlines.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                Headlines used
              </h2>
              <ul className="space-y-2 text-sm">
                {headlines.map((h) => (
                  <li key={h.link}>
                    <a
                      href={h.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 underline decoration-indigo-500/40 underline-offset-2 transition hover:text-indigo-200"
                    >
                      {h.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
