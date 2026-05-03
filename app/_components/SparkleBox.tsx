"use client";

import { useCallback, useRef, useState } from "react";
import { CosmicSpinner } from "./CosmicSpinner";

const SPARKLE_POSITIONS: { top: string; left: string; delay: string; scale: number }[] = [
  { top: "12%", left: "8%", delay: "0s", scale: 0.8 },
  { top: "22%", left: "78%", delay: "0.4s", scale: 1 },
  { top: "8%", left: "52%", delay: "0.8s", scale: 0.6 },
  { top: "55%", left: "6%", delay: "1.1s", scale: 0.9 },
  { top: "68%", left: "88%", delay: "0.2s", scale: 0.7 },
  { top: "42%", left: "92%", delay: "1.4s", scale: 0.85 },
  { top: "78%", left: "38%", delay: "0.6s", scale: 1 },
  { top: "88%", left: "72%", delay: "1.8s", scale: 0.75 },
  { top: "30%", left: "28%", delay: "1.2s", scale: 0.65 },
  { top: "52%", left: "48%", delay: "2s", scale: 0.55 },
];

type SparkleBoxProps = {
  forecast: string | null;
  memeUrl: string | null;
  memeLoading: boolean;
  onGenerateMeme: () => void;
};

export function SparkleBox({
  forecast,
  memeUrl,
  memeLoading,
  onGenerateMeme,
}: SparkleBoxProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    setMx(Math.max(-1, Math.min(1, nx)));
    setMy(Math.max(-1, Math.min(1, ny)));
  }, []);

  const onLeave = useCallback(() => {
    setMx(0);
    setMy(0);
  }, []);

  const canGenerate = Boolean(forecast?.trim()) && !memeLoading && !memeUrl;

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-[box-shadow] duration-300 hover:shadow-[inset_0_0_40px_rgba(167,139,250,0.08)]"
      style={
        {
          "--mx": mx,
          "--my": my,
        } as React.CSSProperties
      }
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-950/20 via-transparent to-indigo-950/25" />
      {SPARKLE_POSITIONS.map((p, i) => (
        <span
          key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-gradient-to-br from-white/70 to-violet-300/40 opacity-70 animate-drift animate-twinkle"
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            transform: `translate3d(calc(var(--mx, 0) * 14px), calc(var(--my, 0) * 14px), 0) scale(${p.scale})`,
            transition: "transform 0.2s ease-out",
          }}
        />
      ))}

      <div className="relative z-[1] flex min-h-[280px] flex-col items-center justify-center gap-4 px-5 py-8">
        {memeUrl ? (
          <div className="animate-fade-in w-full max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={memeUrl}
              alt="Your tech day horoscope meme"
              className="w-full rounded-xl ring-1 ring-white/10"
            />
          </div>
        ) : memeLoading ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CosmicSpinner className="h-10 w-10 text-violet-200" />
            <p className="font-[family-name:var(--serif)] text-base italic text-[var(--muted)]">
              rendering your fate…
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onGenerateMeme}
              disabled={!canGenerate}
              className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-fuchsia-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate meme
            </button>
            {!forecast?.trim() && (
              <p className="max-w-xs text-center text-xs text-[var(--muted)]">
                Read your horoscope first — the stars need context.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
