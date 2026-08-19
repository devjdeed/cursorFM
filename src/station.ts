export const STATION = {
  id: "study",
  name: "Study",
  title: "Cursor FM",
} as const;

export const DEFAULT_DURATION_SECONDS = 7200;

export function livePosition(durationSeconds: number, nowMs = Date.now()): number {
  if (durationSeconds <= 0) {
    return 0;
  }
  return (nowMs / 1000) % durationSeconds;
}

export function parseDurationSeconds(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_DURATION_SECONDS;
  }
  return parsed;
}
