"use client";

import { useCallback, useState } from "react";
import { AI_GATEWAY_MODELS, DEFAULT_MODEL } from "@/lib/models";
import { wrapForMemelord } from "@/lib/memelord";

type HeadlineVibe = {
  title: string;
  link: string;
  description?: string;
  categories?: string[];
  vibe: string;
};

const ROMAN = ["i", "ii", "iii", "iv", "v"] as const;

function ModelSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-xs text-[var(--muted)]">
      <span className="font-medium uppercase tracking-wider">AI Gateway model</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
      >
        {AI_GATEWAY_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Home() {
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [memeLoading, setMemeLoading] = useState(false);
  const [horoscopeError, setHoroscopeError] = useState<string | null>(null);
  const [memeError, setMemeError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | undefined>();
  const [forecast, setForecast] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<HeadlineVibe[] | null>(null);
  const [resolvedModel, setResolvedModel] = useState<string | null>(null);
  const [memeUrl, setMemeUrl] = useState<string | null>(null);

  const hasHoroscope = Boolean(forecast && headlines?.length);

  const readHoroscope = useCallback(async () => {
    setHoroscopeLoading(true);
    setHoroscopeError(null);
    setMemeError(null);
    setHint(undefined);
    setForecast(null);
    setHeadlines(null);
    setResolvedModel(null);
    setMemeUrl(null);

    try {
      const res = await fetch("/api/horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const data = (await res.json()) as {
        forecast?: string;
        headlines?: HeadlineVibe[];
        model?: string;
        error?: string;
        hint?: string;
      };

      if (!res.ok) {
        setHoroscopeError(data.error ?? `Request failed (${res.status})`);
        setHint(data.hint);
        return;
      }

      if (data.forecast && data.headlines?.length) {
        setForecast(data.forecast);
        setHeadlines(data.headlines);
        setResolvedModel(data.model ?? model);
      } else {
        setHoroscopeError("Unexpected response from server");
      }
    } catch (e) {
      setHoroscopeError(e instanceof Error ? e.message : "Network error");
    } finally {
      setHoroscopeLoading(false);
    }
  }, [model]);

  const generateMemeClick = useCallback(async () => {
    if (!forecast?.trim()) return;
    setMemeLoading(true);
    setMemeError(null);
    setHint(undefined);
    setMemeUrl(null);

    try {
      const res = await fetch("/api/meme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forecast }),
      });
      const data = (await res.json()) as {
        memeUrl?: string;
        error?: string;
        hint?: string;
      };

      if (!res.ok) {
        setMemeError(data.error ?? `Request failed (${res.status})`);
        setHint(data.hint);
        return;
      }

      if (data.memeUrl) {
        setMemeUrl(data.memeUrl);
      } else {
        setMemeError("Unexpected response from server");
      }
    } catch (e) {
      setMemeError(e instanceof Error ? e.message : "Network error");
    } finally {
      setMemeLoading(false);
    }
  }, [forecast]);

  const memelordPrompt = forecast ? wrapForMemelord(forecast) : null;

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-24 pt-14 sm:pt-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40"
        aria-hidden
      >
        <div className="absolute left-[12%] top-8 h-1 w-1 rounded-full bg-violet-200/80 animate-twinkle" />
        <div className="absolute right-[18%] top-16 h-0.5 w-0.5 rounded-full bg-indigo-200/70 animate-twinkle [animation-delay:1.2s]" />
        <div className="absolute left-[45%] top-24 h-1 w-1 rounded-full bg-fuchsia-200/60 animate-twinkle [animation-delay:0.4s]" />
      </div>

      <header className="animate-fade-in mb-12 text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">
          the daily tech horoscope
        </p>
        <h1 className="font-[family-name:var(--serif)] text-3xl font-normal italic leading-tight text-zinc-100 sm:text-4xl">
          today, you log on to
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          Five signals from the feed. One combined energy. One meme — when you
          are ready to spend a Memelord credit.
        </p>
      </header>

      <section className="animate-fade-in mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <ModelSelect
          id="model-top"
          value={model}
          onChange={setModel}
          disabled={horoscopeLoading}
        />
        <button
          type="button"
          onClick={readHoroscope}
          disabled={horoscopeLoading}
          className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {horoscopeLoading ? "Consulting the stars…" : "Read my horoscope"}
        </button>
      </section>

      {(horoscopeError || memeError) && (
        <div
          className="animate-fade-in mb-8 rounded-xl border border-red-900/40 bg-red-950/35 px-4 py-3 text-red-200"
          role="alert"
        >
          {horoscopeError && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-300/90">
                Horoscope
              </p>
              <p className="mt-1 text-sm">{horoscopeError}</p>
            </>
          )}
          {memeError && (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-red-300/90">
                Meme
              </p>
              <p className="mt-1 text-sm">{memeError}</p>
            </>
          )}
          {hint && (
            <p className="mt-2 text-xs text-red-100/75">{hint}</p>
          )}
        </div>
      )}

      {horoscopeLoading && (
        <div
          className="animate-fade-in mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-8 text-center backdrop-blur-sm"
          aria-busy
        >
          <p className="font-[family-name:var(--serif)] text-lg italic text-[var(--muted)]">
            consulting the stars…
          </p>
          <div className="mx-auto mt-6 h-1 max-w-xs overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-violet-500/50" />
          </div>
        </div>
      )}

      {hasHoroscope && !horoscopeLoading && (
        <div className="flex flex-col gap-12">
          <section className="animate-fade-in space-y-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
              signals from the feed
            </h2>
            <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm">
              {headlines!.map((h, i) => (
                <li
                  key={h.link}
                  className="space-y-2 px-5 py-5 first:rounded-t-2xl last:rounded-b-2xl sm:px-6"
                >
                  <div className="flex gap-3">
                    <span className="font-[family-name:var(--serif)] text-xs tabular-nums text-[var(--accent-dim)]">
                      {ROMAN[i]}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <a
                        href={h.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[15px] font-medium leading-snug text-zinc-100 underline decoration-violet-500/25 underline-offset-2 transition hover:text-white hover:decoration-violet-400/50"
                      >
                        {h.title}
                      </a>
                      <p className="font-[family-name:var(--serif)] text-sm italic leading-relaxed text-[var(--muted)]">
                        {h.vibe}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="animate-fade-in">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
              combined energy
            </h2>
            <blockquote className="relative border-l-2 border-violet-500/50 bg-[var(--surface)]/50 py-6 pl-6 pr-5 backdrop-blur-sm sm:pl-8 sm:pr-8">
              <p className="font-[family-name:var(--serif)] text-lg italic leading-relaxed text-zinc-100 sm:text-xl">
                {forecast}
              </p>
              {resolvedModel && (
                <footer className="mt-4 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  read with {resolvedModel.replace("/", " · ")}
                </footer>
              )}
            </blockquote>
          </section>

          <section className="animate-fade-in space-y-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
              full Memelord prompt
            </h2>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--border)] bg-[#0c0c14] p-4 font-mono text-[13px] leading-relaxed text-violet-100/90">
              {memelordPrompt}
            </pre>

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={readHoroscope}
                disabled={horoscopeLoading || memeLoading}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-violet-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Re-read
              </button>
              <button
                type="button"
                onClick={generateMemeClick}
                disabled={memeLoading || horoscopeLoading}
                className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/35 transition hover:from-fuchsia-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {memeLoading ? "Rendering your fate…" : "Generate meme"}
              </button>
            </div>
          </section>

          {memeLoading && (
            <div
              className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-10 text-center backdrop-blur-sm"
              aria-busy
            >
              <p className="font-[family-name:var(--serif)] text-lg italic text-[var(--muted)]">
                rendering your fate…
              </p>
              <div className="mx-auto mt-6 h-48 max-w-sm animate-pulse rounded-xl bg-[var(--border)]/40" />
            </div>
          )}

          {memeUrl && !memeLoading && (
            <section className="animate-fade-in space-y-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
                your day, illustrated
              </h2>
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-2 shadow-xl shadow-black/20 backdrop-blur-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={memeUrl}
                  alt="Your tech day horoscope meme"
                  className="w-full rounded-xl"
                />
              </div>
            </section>
          )}
        </div>
      )}

      <footer className="animate-fade-in mt-16 border-t border-[var(--border)]/80 pt-8 text-center text-[11px] leading-relaxed text-[var(--muted)]">
        <p>
          Reading the horoscope uses about six AI Gateway calls (no Memelord
          credit). Generating the meme uses{" "}
          <span className="text-zinc-400">one Memelord credit</span>.
        </p>
      </footer>
    </main>
  );
}
