const KEY = 'aetherhold-campaign-crowns-v1';

// shortcut: crowns live only in this browser, not in the cloud save, whose strict 3-star schema and leaderboard SQL would need a version bump.
export function loadCrowns(storage: Pick<Storage, 'getItem'> | undefined = (globalThis as { localStorage?: Storage }).localStorage): ReadonlySet<number> {
  try {
    const value: unknown = JSON.parse(storage?.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((n): n is number => Number.isSafeInteger(n) && n >= 1 && n <= 100) : []);
  } catch { return new Set(); }
}

export function recordCrown(level: number, storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = (globalThis as { localStorage?: Storage }).localStorage): void {
  try { storage?.setItem(KEY, JSON.stringify([...new Set([...loadCrowns(storage), level])].sort((a, b) => a - b))); } catch { /* storage blocked: the crown is cosmetic */ }
}
