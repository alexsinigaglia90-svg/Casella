"use client";

import { useEffect, useState } from "react";

interface EmployeePreviewData {
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  inviteEmail: string | null;
  startDate: string | null;
}

interface Props {
  entityType: "employee";
  entityId: string;
}

interface RawPreviewResponse {
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  inviteEmail?: string | null;
  startDate?: string | null;
}

export function SearchPreview({ entityType, entityId }: Props) {
  const [data, setData] = useState<EmployeePreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entityType !== "employee") return;
    let cancelled = false;
    fetch(`/api/admin/employees/${entityId}`)
      .then(async (r) => {
        if (cancelled) return;
        if (!r.ok) {
          setLoading(false);
          return;
        }
        const json = (await r.json()) as RawPreviewResponse;
        if (!cancelled) {
          setData({
            firstName: json.firstName ?? null,
            lastName: json.lastName ?? null,
            jobTitle: json.jobTitle ?? null,
            inviteEmail: json.inviteEmail ?? null,
            startDate: json.startDate ?? null,
          });
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div
        className="w-72 p-4 text-sm"
        style={{ color: "var(--fg-tertiary)" }}
      >
        Laden…
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="w-72 p-4 text-sm"
        style={{ color: "var(--fg-tertiary)" }}
      >
        Niet gevonden.
      </div>
    );
  }

  const name =
    [data.firstName, data.lastName].filter(Boolean).join(" ") || "Medewerker";

  return (
    <div className="w-72 space-y-2 p-4">
      <h4
        className="text-base font-medium"
        style={{ color: "var(--fg-primary)" }}
      >
        {name}
      </h4>
      <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
        {data.jobTitle ?? "—"}
      </p>
      <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
        {data.inviteEmail ?? ""}
      </p>
      {data.startDate && (
        <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
          Sinds {new Date(data.startDate).toLocaleDateString("nl-NL")}
        </p>
      )}
    </div>
  );
}
