"use client";

import { useId } from "react";

/**
 * Co-Star-ish micro loader: orbiting dots + soft pulse.
 */
export function CosmicSpinner({ className = "h-5 w-5" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `cosmic-spark-${uid}`;
  const dots = 8;
  const r = 7;
  const cx = 12;
  const cy = 12;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-violet-300/90 ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-full w-full animate-spin-slow"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {Array.from({ length: dots }, (_, i) => {
          const angle = (i / dots) * Math.PI * 2 - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const op = 0.25 + (i % 3) * 0.2;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={1}
              fill="currentColor"
              fillOpacity={op}
              className="animate-twinkle"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          );
        })}
        <circle
          cx={cx + r * 0.35}
          cy={cy - r * 0.55}
          r={1.2}
          fill={`url(#${gradId})`}
          className="animate-twinkle"
          style={{ animationDuration: "1.2s" }}
        />
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#faf5ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.3" />
          </radialGradient>
        </defs>
      </svg>
    </span>
  );
}
