"use client";

import { useEffect, useState } from "react";

import { oklchPrimary } from "@/lib/design/oklch";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  hue: number;
  size: number;
}

interface ConfettiBurstProps {
  trigger: number;
  count?: number;
  hues?: number[];
}

const DEFAULT_HUES = [50, 145, 165, 240, 280, 25];

export function ConfettiBurst({
  trigger,
  count = 24,
  hues = DEFAULT_HUES,
}: ConfettiBurstProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const next: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
      id: trigger * 1000 + i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 50,
      rotation: Math.random() * 360,
      hue: hues[Math.floor(Math.random() * hues.length)] ?? 145,
      size: 6 + Math.random() * 6,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 1800);
    return () => clearTimeout(t);
  }, [trigger, count, hues]);

  if (pieces.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((p) => {
        const dx = (Math.random() - 0.5) * 600;
        const dy = -200 - Math.random() * 400;
        const rot = p.rotation + (Math.random() - 0.5) * 720;
        return (
          <span
            key={p.id}
            className="confetti-piece absolute"
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size * 0.4,
                background: oklchPrimary(p.hue),
                borderRadius: 2,
                transform: `rotate(${p.rotation}deg)`,
                "--dx": `${dx}px`,
                "--dy": `${dy}px`,
                "--rot": `${rot}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
