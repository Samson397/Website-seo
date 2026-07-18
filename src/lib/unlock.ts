/** Browser-side unlock for a single paid full scan */

const UNLOCK_KEY = "seohub-full-unlock-v2";

export interface UnlockRecord {
  sessionId: string;
  hostname?: string;
  unlockedAt: string;
  /** True after the paid full scan has completed */
  used: boolean;
}

function read(): UnlockRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) {
      // Migrate away from old 30-day key
      localStorage.removeItem("seohub-full-unlock-v1");
      return null;
    }
    const data = JSON.parse(raw) as UnlockRecord;
    if (!data.sessionId) return null;
    return { ...data, used: Boolean(data.used) };
  } catch {
    return null;
  }
}

export function getUnlock(): UnlockRecord | null {
  return read();
}

/** True while a paid session can still run one full scan. */
export function hasFullUnlock(): boolean {
  const record = read();
  return Boolean(record?.sessionId && !record.used);
}

export function saveUnlock(sessionId: string, hostname?: string): UnlockRecord {
  const record: UnlockRecord = {
    sessionId,
    hostname,
    unlockedAt: new Date().toISOString(),
    used: false,
  };
  try {
    localStorage.removeItem("seohub-full-unlock-v1");
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
  return record;
}

/** Call after a successful paid full-site scan so another scan requires payment. */
export function markUnlockUsed(): void {
  const record = read();
  if (!record) return;
  try {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify({ ...record, used: true }));
  } catch {
    /* ignore */
  }
}

export function clearUnlock(): void {
  try {
    localStorage.removeItem(UNLOCK_KEY);
    localStorage.removeItem("seohub-full-unlock-v1");
  } catch {
    /* ignore */
  }
}
