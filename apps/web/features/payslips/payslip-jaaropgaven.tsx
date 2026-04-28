import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";

export interface PayslipJaaropgavenProps {
  skipped?: string;
}

export function PayslipJaaropgaven({ skipped }: PayslipJaaropgavenProps) {
  return (
    <section>
      <div className="mb-5">
        <div
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--fg-tertiary)",
          }}
        >
          Belastingjaar
        </div>
        <h2
          className="mt-1.5 font-display"
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: "var(--fg-primary)",
          }}
        >
          Jaaropgaven
        </h2>
        <div
          className="mt-1"
          style={{ fontSize: 12, color: "var(--fg-secondary)" }}
        >
          Voor de aangifte inkomstenbelasting bij de Belastingdienst.
        </div>
      </div>

      <div
        className="rounded-2xl border p-7"
        style={{
          borderColor: "var(--border-subtle)",
          background: skipped
            ? "var(--surface-lift)"
            : oklchSubtleBg(DOMAIN_HUES.cloud),
        }}
      >
        {skipped ? (
          <div>
            <div
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                color: "var(--fg-tertiary)",
              }}
            >
              Niet beschikbaar
            </div>
            <div
              className="mt-2 font-display"
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: "var(--fg-primary)",
              }}
            >
              Beschikbaar zodra Nmbrs gekoppeld is
            </div>
            <p
              className="mt-2"
              style={{ fontSize: 13, color: "var(--fg-secondary)" }}
            >
              Jaaropgaven worden via Nmbrs opgehaald. Zodra de loonadministratie
              gekoppeld is verschijnen ze hier in januari na elk belastingjaar.
            </p>
          </div>
        ) : (
          <div>
            <div
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                color: oklchEmphasis(DOMAIN_HUES.cloud),
              }}
            >
              In opbouw
            </div>
            <div
              className="mt-2 font-display"
              style={{ fontSize: 22, fontWeight: 500 }}
            >
              Jaaropgaven verschijnen hier in januari
            </div>
            <p
              className="mt-2"
              style={{ fontSize: 13, color: "var(--fg-secondary)" }}
            >
              Jaaropgaven over voltooide belastingjaren worden via Nmbrs
              opgehaald en als PDF beschikbaar gesteld.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
