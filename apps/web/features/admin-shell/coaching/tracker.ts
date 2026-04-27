"use client";

const STORAGE_KEY = "casellaCoachingState";
const OPT_OUT_KEY = "casellaCoachingOptedOut";

interface CoachingState {
  actions: Record<string, number>;
  dismissedTips: string[];
}

function load(): CoachingState {
  if (typeof window === "undefined") return { actions: {}, dismissedTips: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CoachingState>;
      return {
        actions: parsed.actions ?? {},
        dismissedTips: Array.isArray(parsed.dismissedTips) ? parsed.dismissedTips : [],
      };
    }
  } catch {
    // fall through
  }
  return { actions: {}, dismissedTips: [] };
}

function save(state: CoachingState): void {
  if (typeof window === "undefined") return;
  const trimmed: CoachingState = {
    actions: state.actions,
    dismissedTips: state.dismissedTips.slice(-50),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full / disabled — silently no-op
  }
}

export function trackAction(actionKey: string): void {
  if (isOptedOut()) return;
  const s = load();
  s.actions[actionKey] = (s.actions[actionKey] ?? 0) + 1;
  save(s);
}

export function getActionCount(actionKey: string): number {
  return load().actions[actionKey] ?? 0;
}

export function isTipDismissed(tipId: string): boolean {
  return load().dismissedTips.includes(tipId);
}

export function dismissTip(tipId: string): void {
  const s = load();
  if (!s.dismissedTips.includes(tipId)) {
    s.dismissedTips.push(tipId);
    save(s);
  }
}

export function isOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(OPT_OUT_KEY) === "true";
}

export function setOptedOut(v: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OPT_OUT_KEY, String(v));
}
