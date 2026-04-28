import { oklchEmphasis, oklchPrimary, oklchSubtleBg } from "@/lib/design/oklch";

interface SealStampProps {
  centerLabel: string;
  centerValue: string;
  centerSub?: string;
  ringText: string;
  hue: number;
  size?: number;
  pillText?: string;
}

export function SealStamp({
  centerLabel,
  centerValue,
  centerSub,
  ringText,
  hue,
  size = 220,
  pillText,
}: SealStampProps) {
  const primary = oklchPrimary(hue);
  const emphasis = oklchEmphasis(hue);
  const tinted = oklchSubtleBg(hue);
  const sealId = `seal-circle-${hue}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 220 220"
        width={size}
        height={size}
        className="absolute inset-0"
      >
        <defs>
          <path
            id={sealId}
            d="M 110,110 m -88,0 a 88,88 0 1,1 176,0 a 88,88 0 1,1 -176,0"
          />
        </defs>
        <circle
          cx="110"
          cy="110"
          r="100"
          fill="none"
          stroke="rgba(14,22,33,0.15)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        <circle
          cx="110"
          cy="110"
          r="92"
          fill="none"
          stroke={primary}
          strokeWidth="1.5"
        />
        <circle
          cx="110"
          cy="110"
          r="86"
          fill="none"
          stroke={primary}
          strokeWidth="0.5"
          strokeOpacity="0.4"
        />
        <text
          fontSize="9"
          fontFamily="var(--font-geist-mono), monospace"
          letterSpacing="3"
          fill={primary}
        >
          <textPath href={`#${sealId}`} startOffset="2%">
            {ringText}
          </textPath>
        </text>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div
          className="font-mono uppercase tracking-[0.2em]"
          style={{ fontSize: 9, color: "var(--fg-tertiary)" }}
        >
          {centerLabel}
        </div>
        <div
          className="mt-1 font-display leading-none"
          style={{
            fontSize: 44,
            fontWeight: 500,
            color: emphasis,
          }}
        >
          {centerValue}
        </div>
        {centerSub && (
          <div
            className="mt-2 font-mono"
            style={{ fontSize: 10, color: "var(--fg-secondary)" }}
          >
            {centerSub}
          </div>
        )}
        {pillText && (
          <div
            className="mt-3 rounded-full px-2 py-0.5 font-mono uppercase tracking-wider"
            style={{
              fontSize: 9,
              background: tinted,
              color: emphasis,
            }}
          >
            {pillText}
          </div>
        )}
      </div>
    </div>
  );
}
