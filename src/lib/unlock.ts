/** Browser-side unlock for paid full scans */

const UNLOCK_KEY = "seohub-full-unlock-v1";
const UNLOCK_DAYS = 30;

export interface UnlockRecord {
  sessionId: string;
  hostname?: string;
  unlockedAt: string;
  expiresAt: string;
}

function read(): UnlockRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as UnlockRecord;
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(UNLOCK_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function getUnlock(): UnlockRecord | null {
  return read();
}

export function hasFullUnlock(): boolean {
  return Boolean(read()?.sessionId);
}

export function saveUnlock(sessionId: string, hostname?: string): UnlockRecord {
  const unlockedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + UNLOCK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const record: UnlockRecord = { sessionId, hostname, unlockedAt, expiresAt };
  try {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
  return record;
}

export function clearUnlock(): void {
  try {
    localStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}
