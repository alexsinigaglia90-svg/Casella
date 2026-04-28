interface WatermarkGlyphProps {
  glyph: string;
  size?: number;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
}

const POSITION_STYLES: Record<
  NonNullable<WatermarkGlyphProps["position"]>,
  React.CSSProperties
> = {
  "top-right": { right: -48, top: -32 },
  "bottom-right": { right: -40, bottom: -80 },
  "top-left": { left: -48, top: -32 },
  "bottom-left": { left: -40, bottom: -80 },
};

export function WatermarkGlyph({
  glyph,
  size = 280,
  position = "top-right",
}: WatermarkGlyphProps) {
  return (
    <div
      className="absolute select-none font-display"
      style={{
        ...POSITION_STYLES[position],
        fontSize: size,
        fontStyle: "italic",
        fontWeight: 400,
        color: "rgba(14, 22, 33, 0.04)",
        letterSpacing: "-0.04em",
        lineHeight: 1,
      }}
    >
      {glyph}
    </div>
  );
}
