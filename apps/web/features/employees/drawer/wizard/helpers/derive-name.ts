export function deriveFirstFromEmail(email: string): string {
  if (!email.includes("@")) return "";
  const local = email.split("@")[0]!;
  const parts = local.split(/[._-]/);
  const first = parts[0] || "";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function deriveLastFromEmail(email: string): string {
  if (!email.includes("@")) return "";
  const local = email.split("@")[0]!;
  const parts = local.split(/[._-]/);
  if (parts.length < 2) return "";
  const last = parts.slice(1).join(" ");
  return last
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
