"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AI_GATEWAY_MODELS, DEFAULT_MODEL } from "@/lib/models";
import type { Headline } from "@/lib/techcrunch";
import { CosmicSpinner } from "./CosmicSpinner";
import { SparkleBox } from "./SparkleBox";

const ROMAN = ["i", "ii", "iii", "iv", "v"] as const;

const MAX_HOROSCOPE_FILL_ATTEMPTS = 4;

type StreamEvent =
  | { type: "vibe"; index: number; vibe: string }
  | { type: "forecast"; forecast: string }
  | { type: "error"; index?: number; message: string };

async function consumeNdjsonStream(
  res: Response,
  onEvent: (e: StreamEvent) => void,
): Promise<void> {
  if (!res.ok) {
    const text = await res.text();
    try {
      const j = JSON.parse(text) as { error?: string; hint?: string };
      throw new Error(j.error ?? `Request failed (${res.status})`);
    } catch {
      if (text) throw new Error(text);
      throw new Error(`Request failed (${res.status})`);
    }
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      try {
        onEvent(JSON.parse(t) as StreamEvent);
      } catch {
        /* skip malformed chunk */
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    try {
      onEvent(JSON.parse(tail) as StreamEvent);
    } catch {
      /* ignore trailing garbage */
    }
  }
}

export function HoroscopeClient({
  initialHeadlines,
}: {
  initialHeadlines: Headline[];
}) {
  const n = initialHeadlines.length;
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [memeLoading, setMemeLoading] = useState(false);
  const [horoscopeError, setHoroscopeError] = useState<string | null>(null);
  const [memeError, setMemeError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | undefined>();
  const [vibes, setVibes] = useState<(string | undefined)[]>(() =>
    Array(n).fill(undefined),
  );
  const [forecast, setForecast] = useState<string | null>(null);
  /** Model id used for the LLM run that produced `forecast` (not the live dropdown). */
  const [forecastModel, setForecastModel] = useState<string | null>(null);
  const [memeUrl, setMemeUrl] = useState<string | null>(null);
  const [horoscopeRunOnce, setHoroscopeRunOnce] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [horoscopeAutoFillStuck, setHoroscopeAutoFillStuck] = useState(false);
  const modelMenuRef = useRef<HTMLSpanElement>(null);
  const horoscopeFillAttemptsRef = useRef(0);

  const currentModelShort = useMemo(
    () => AI_GATEWAY_MODELS.find((m) => m.id === model)?.short ?? model,
    [model],
  );

  useEffect(() => {
    if (horoscopeLoading) setModelMenuOpen(false);
  }, [horoscopeLoading]);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (
        modelMenuRef.current &&
        !modelMenuRef.current.contains(e.target as Node)
      ) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [modelMenuOpen]);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModelMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modelMenuOpen]);

  useEffect(() => {
    if (!showModelPicker) setModelMenuOpen(false);
  }, [showModelPicker]);

  const readHoroscope = useCallback(async (opts?: { resetAutoFill?: boolean }) => {
    if (opts?.resetAutoFill) {
      horoscopeFillAttemptsRef.current = 0;
      setHoroscopeAutoFillStuck(false);
    }
    const modelForThisRun = model;
    setHoroscopeLoading(true);
    setHoroscopeError(null);
    setMemeError(null);
    setHint(undefined);
    setForecast(null);
    setForecastModel(null);
    setMemeUrl(null);
    setVibes(Array(n).fill(undefined));

    try {
      const res = await fetch("/api/horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headlines: initialHeadlines,
          model: modelForThisRun,
        }),
      });

      await consumeNdjsonStream(res, (ev) => {
        if (ev.type === "vibe") {
          setVibes((prev) => {
            const next = [...prev];
            next[ev.index] = ev.vibe;
            return next;
          });
        } else if (ev.type === "forecast") {
          setForecast(ev.forecast);
          setForecastModel(modelForThisRun);
        } else if (ev.type === "error") {
          const idx = ev.index;
          if (typeof idx === "number") {
            setVibes((prev) => {
              const next = [...prev];
              next[idx] = `… (${ev.message})`;
              return next;
            });
          } else {
            setHoroscopeError(ev.message);
          }
        }
      });
    } catch (e) {
      setHoroscopeError(e instanceof Error ? e.message : "Network error");
    } finally {
      setHoroscopeLoading(false);
      setHoroscopeRunOnce(true);
    }
  }, [initialHeadlines, model, n]);

  const hasHoroscopeContent = useMemo(() => {
    if (Boolean(forecast?.trim())) return true;
    if (vibes.length !== n) return false;
    return vibes.every((v) => typeof v === "string" && v.trim().length > 0);
  }, [forecast, vibes, n]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (horoscopeLoading) return;
    if (horoscopeError != null) return;
    if (hasHoroscopeContent) {
      horoscopeFillAttemptsRef.current = 0;
      setHoroscopeAutoFillStuck(false);
      return;
    }
    if (horoscopeFillAttemptsRef.current >= MAX_HOROSCOPE_FILL_ATTEMPTS) {
      setHoroscopeAutoFillStuck(true);
      return;
    }
    horoscopeFillAttemptsRef.current += 1;
    void readHoroscope();
  }, [readHoroscope, horoscopeLoading, horoscopeError, hasHoroscopeContent]);

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

  const showRowSpinner = (i: number) =>
    horoscopeLoading && vibes[i] === undefined;

  const showHoroscopeNavWhenPickerOff =
    horoscopeLoading ||
    horoscopeError != null ||
    horoscopeAutoFillStuck;

  const showHoroscopeNav =
    showModelPicker ||
    (!showModelPicker && showHoroscopeNavWhenPickerOff);

  return (
    <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-14 sm:pt-20">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <button
          type="button"
          role="switch"
          aria-checked={showModelPicker}
          aria-label="Show custom model picker"
          onClick={() => setShowModelPicker((v) => !v)}
          className="group flex max-w-[min(100%,calc(100vw-5rem))] cursor-pointer flex-wrap items-center justify-end gap-2 border-none bg-transparent p-0 text-right text-[10px] tracking-wide text-zinc-600 transition hover:text-zinc-300"
        >
          <span className="whitespace-nowrap">custom model</span>
          <span
            className={
              showModelPicker
                ? "relative h-3 w-6 rounded-full bg-violet-500/70 transition"
                : "relative h-3 w-6 rounded-full bg-zinc-700 transition"
            }
          >
            <span
              className={`absolute top-0.5 h-2 w-2 rounded-full bg-zinc-100 transition-[left] ${showModelPicker ? "left-[14px]" : "left-0.5"}`}
            />
          </span>
        </button>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40"
        aria-hidden
      >
        <div className="absolute left-[12%] top-8 h-1 w-1 rounded-full bg-violet-200/80 animate-twinkle" />
        <div className="absolute right-[18%] top-16 h-0.5 w-0.5 rounded-full bg-indigo-200/70 animate-twinkle [animation-delay:1.2s]" />
        <div className="absolute left-[45%] top-24 h-1 w-1 rounded-full bg-fuchsia-200/60 animate-twinkle [animation-delay:0.4s]" />
      </div>

      <header className="animate-fade-in mb-3 text-center lg:mb-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">
          the daily tech horoscope
        </p>
        <h1 className="font-[family-name:var(--serif)] text-3xl font-normal italic leading-tight text-zinc-100 sm:text-4xl">
          today, you log on to:
        </h1>
      </header>

      {showHoroscopeNav ? (
      <nav
        className={`animate-fade-in mb-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-[var(--muted)] ${modelMenuOpen && showModelPicker ? "relative z-[9999]" : ""}`}
        aria-label="Horoscope controls"
      >
        <button
          type="button"
          onClick={() => void readHoroscope({ resetAutoFill: true })}
          disabled={horoscopeLoading || memeLoading}
          className="cursor-pointer border-none bg-transparent p-0 underline decoration-white/20 underline-offset-[5px] transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {showModelPicker
            ? horoscopeLoading
              ? "Consulting the stars…"
              : horoscopeRunOnce
                ? "Read again"
                : "Read my horoscope"
            : horoscopeLoading
              ? "Consulting the stars…"
              : "Try again"}
        </button>
        {showModelPicker ? (
          <>
            <span className="select-none text-zinc-600">with</span>
            <span ref={modelMenuRef} className="relative inline-flex items-baseline">
          <button
            type="button"
            id="horoscope-model-trigger"
            disabled={horoscopeLoading}
            aria-expanded={modelMenuOpen}
            aria-haspopup="listbox"
            aria-label="AI Gateway model"
            onClick={() => {
              if (!horoscopeLoading) setModelMenuOpen((o) => !o);
            }}
            className="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-sm text-[var(--muted)] underline decoration-white/20 underline-offset-[5px] transition hover:text-zinc-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="inline-block">{currentModelShort}</span>
            <svg
              className={`h-[1em] w-[1em] shrink-0 text-zinc-400 transition-transform duration-200 ${modelMenuOpen ? "rotate-180" : ""}`}
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M2.5 4.25L6 7.75L9.5 4.25"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {modelMenuOpen ? (
            <ul
              role="listbox"
              aria-labelledby="horoscope-model-trigger"
              className="absolute left-0 top-[calc(100%+0.35rem)] z-10 min-w-[9.5rem] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 py-0.5 shadow-xl shadow-black/40 backdrop-blur-md"
            >
              {AI_GATEWAY_MODELS.map((m) => (
                <li key={m.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={m.id === model}
                    className={
                      m.id === model
                        ? "w-full cursor-pointer border-none bg-violet-500/10 px-2 py-1 text-left text-sm font-normal leading-tight text-zinc-100"
                        : "w-full cursor-pointer border-none bg-transparent px-2 py-1 text-left text-sm font-normal leading-tight text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-zinc-100"
                    }
                    onClick={() => {
                      setModel(m.id);
                      setModelMenuOpen(false);
                    }}
                  >
                    <span className="block leading-tight">{m.short}</span>
                    <span className="mt-px block text-[10px] font-normal leading-tight text-zinc-500/90">
                      {m.label.replace(/\s*\(default\)\s*$/, "")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
            </span>
          </>
        ) : null}
      </nav>
      ) : null}

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

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-12">
        <div className="min-w-0 space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
            signals from the feed
          </h2>
          <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm">
            {initialHeadlines.map((h, i) => (
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
                    <div className="flex min-h-[1.5rem] items-start gap-2">
                      {showRowSpinner(i) ? (
                        <CosmicSpinner />
                      ) : vibes[i] != null ? (
                        <p className="font-[family-name:var(--serif)] text-sm italic leading-relaxed text-[var(--muted)] animate-fade-in">
                          {vibes[i]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
                combined fate
              </h2>
              <blockquote className="relative min-h-[5rem] border-l-2 border-violet-500/50 bg-[var(--surface)]/50 py-6 pl-6 pr-5 backdrop-blur-sm sm:pl-8 sm:pr-8">
                {forecast ? (
                  <>
                    <p className="font-[family-name:var(--serif)] text-lg italic leading-relaxed text-zinc-100 animate-fade-in sm:text-xl">
                      {forecast}
                    </p>
                    {forecastModel ? (
                      <footer className="mt-4 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                        read with {forecastModel.replace("/", " · ")}
                      </footer>
                    ) : null}
                  </>
                ) : horoscopeLoading ? (
                  <p className="font-[family-name:var(--serif)] text-base italic leading-relaxed text-[var(--muted)]">
                    The veil lifts as each signal arrives…
                  </p>
                ) : (
                  <p className="font-[family-name:var(--serif)] text-sm italic text-[var(--muted)]">
                    Your combined energy will appear here after you read the
                    horoscope.
                  </p>
                )}
              </blockquote>
            </div>

            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
                conjure
              </h3>
              <SparkleBox
                forecast={forecast}
                memeUrl={memeUrl}
                memeLoading={memeLoading}
                onGenerateMeme={generateMemeClick}
              />
              {memeUrl && !memeLoading && (
                <p className="mt-3 text-center font-[family-name:var(--serif)] text-xs italic text-[var(--muted)]">
                  your day, illustrated
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="animate-fade-in mt-16 border-t border-[var(--border)]/80 pt-8 text-center text-[11px] leading-relaxed text-[var(--muted)]">
        <p>
          Streaming the horoscope uses about six AI Gateway calls (no Memelord
          credit). Generating the meme uses{" "}
          <span className="text-zinc-400">one Memelord credit</span>.
        </p>
      </footer>
    </main>
  );
}
