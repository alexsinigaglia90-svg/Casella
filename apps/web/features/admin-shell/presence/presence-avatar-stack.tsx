"use client";

import { usePathname } from "next/navigation";

import { useEntityPresence, type PresenceUser } from "./use-entity-presence";

const EMPLOYEE_DETAIL_RE = /^\/admin\/medewerkers\/([0-9a-f-]{36})/i;

interface Props {
  currentUserId: string;
}

export function PresenceAvatarStack({ currentUserId }: Props) {
  const pathname = usePathname();
  const m = pathname?.match(EMPLOYEE_DETAIL_RE);
  if (!m) return null;
  return <PresenceStackInner entityId={m[1]!} currentUserId={currentUserId} />;
}

function PresenceStackInner({
  entityId,
  currentUserId,
}: {
  entityId: string;
  currentUserId: string;
}) {
  const viewers = useEntityPresence("employee", entityId);
  if (viewers.length === 0) return null;

  const visible = viewers.slice(0, 3);
  const overflow = viewers.length - visible.length;

  return (
    <div
      className="flex items-center"
      aria-label={`${viewers.length} viewer${viewers.length === 1 ? "" : "s"}`}
    >
      {visible.map((v, i) => (
        <span key={v.userId} style={{ marginLeft: i === 0 ? 0 : "-8px" }}>
          <Avatar user={v} currentUserId={currentUserId} />
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="grid size-6 place-items-center rounded-full text-[10px]"
          style={{
            background: "var(--surface-deep)",
            color: "var(--fg-tertiary)",
            border: "2px solid var(--surface-base)",
            marginLeft: "-8px",
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

function Avatar({
  user,
  currentUserId,
}: {
  user: PresenceUser;
  currentUserId: string;
}) {
  const initials =
    user.name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const isSelf = user.userId === currentUserId;
  return (
    <span
      className="grid size-6 place-items-center rounded-full text-[10px] font-medium"
      style={{
        background: `linear-gradient(135deg, oklch(70% 0.18 ${user.avatarHue}), oklch(55% 0.20 ${(user.avatarHue + 60) % 360}))`,
        color: "#fff",
        border: "2px solid var(--surface-base)",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
      title={isSelf ? `${user.name} (jij)` : user.name}
      aria-hidden
    >
      {initials}
    </span>
  );
}
