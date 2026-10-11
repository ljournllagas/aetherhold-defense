import { ALTERNATIVE_BRANCH, STARTER_BRANCH } from '../config/evolutions.ts';
import { TOWER_IDS } from '../config/towers.ts';
import type { BranchId, CombatTower } from '../../shared/progression.ts';

export const UNLOCK_STORAGE_KEY = 'aetherhold-unlocks-v1';
export const SAVE_FAILED_WARNING = 'Unlock earned, but progress could not be saved';
const UNREADABLE_WARNING = 'Saved progress could not be read. Unlocks earned now are kept for this session only.';
const NEWER_WARNING = 'Saved progress comes from a newer version. Unlocks earned now are kept for this session only.';
const UNAVAILABLE_WARNING = 'Progress storage is unavailable. Unlocks earned now are kept for this session only.';

export interface UnlockProfile { version: 1; earned: Partial<Record<BranchId, string>>; }
export interface UnlockView { profile: UnlockProfile; unsaved: ReadonlySet<BranchId>; warning: string | null; }

type Store = Pick<Storage, 'getItem' | 'setItem'>;
type ReadResult =
  | { kind: 'unavailable' | 'unreadable' | 'newer' }
  | { kind: 'absent' }
  | { kind: 'readable'; earned: Partial<Record<BranchId, string>> };

const RECOGNIZED: ReadonlySet<string> = new Set<string>(Object.values(ALTERNATIVE_BRANCH));

export function earnedBranches(waveCompleted: number, lives: number, towers: readonly CombatTower[], debugAssisted: boolean): BranchId[] {
  if (waveCompleted !== 20 || lives <= 0 || debugAssisted) return [];
  return TOWER_IDS
    .filter((id) => towers.some((t) => t.towerId === id && t.progression.branchId === STARTER_BRANCH[id] && (t.progression.rank ?? 0) >= 2))
    .map((id) => ALTERNATIVE_BRANCH[id]);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function classify(storage: Store | null): ReadResult {
  if (!storage) return { kind: 'unavailable' };
  let raw: string | null;
  try { raw = storage.getItem(UNLOCK_STORAGE_KEY); } catch { return { kind: 'unreadable' }; }
  if (raw === null) return { kind: 'absent' };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { kind: 'unreadable' }; }
  if (!isPlainObject(parsed)) return { kind: 'unreadable' };
  const version = parsed.version;
  if (version === 1) {
    const earned = parsed.earned;
    if (!isPlainObject(earned)) return { kind: 'unreadable' };
    const kept: Partial<Record<BranchId, string>> = {};
    for (const [id, value] of Object.entries(earned)) {
      if (!RECOGNIZED.has(id)) continue;
      if (!validTime(value)) return { kind: 'unreadable' };
      kept[id as BranchId] = value;
    }
    return { kind: 'readable', earned: kept };
  }
  if (typeof version === 'number' && Number.isInteger(version) && version > 1) return { kind: 'newer' };
  return { kind: 'unreadable' };
}

function mergeEarned(a: Partial<Record<BranchId, string>>, b: Partial<Record<BranchId, string>>): Partial<Record<BranchId, string>> {
  const merged: Partial<Record<BranchId, string>> = { ...a };
  for (const [id, time] of Object.entries(b) as [BranchId, string][]) {
    const existing = merged[id];
    if (existing === undefined || Date.parse(time) < Date.parse(existing)) merged[id] = time;
  }
  return merged;
}

function sortedEarned(earned: Partial<Record<BranchId, string>>): Partial<Record<BranchId, string>> {
  const out: Partial<Record<BranchId, string>> = {};
  for (const id of (Object.keys(earned) as BranchId[]).sort()) out[id] = earned[id];
  return out;
}

export class UnlockRepository {
  private readonly storage: Store | null;
  private readonly now: () => string;
  private memory: Partial<Record<BranchId, string>> = {};
  private persisted: Partial<Record<BranchId, string>> = {};
  private unsaved = new Set<BranchId>();

  applyCloud(earned: Partial<Record<BranchId, string>>): void {
    this.memory = mergeEarned(this.memory, earned);
    this.sync();
  }
  private warning: string | null = null;

  constructor(storage: Store | null, now: () => string = () => new Date().toISOString()) {
    this.storage = storage;
    this.now = now;
    this.sync();
  }

  view(): UnlockView {
    return { profile: { version: 1, earned: this.merged() }, unsaved: new Set(this.unsaved), warning: this.warning };
  }

  snapshotForRun(): ReadonlySet<BranchId> {
    this.sync();
    return new Set(Object.keys(this.merged()) as BranchId[]);
  }

  earn(branches: readonly BranchId[]): void {
    for (const id of branches) {
      if (RECOGNIZED.has(id) && this.memory[id] === undefined) this.memory[id] = this.now();
    }
    this.sync();
  }

  reconcile(): void {
    this.sync();
  }

  private merged(): Partial<Record<BranchId, string>> {
    return mergeEarned(this.persisted, this.memory);
  }

  private memoryIds(): BranchId[] {
    return Object.keys(this.memory) as BranchId[];
  }

  private missingFromPersisted(): Set<BranchId> {
    return new Set(this.memoryIds().filter((id) => this.persisted[id] === undefined));
  }

  private sync(): void {
    const read = classify(this.storage);
    if (read.kind === 'unavailable' || read.kind === 'unreadable' || read.kind === 'newer') {
      this.warning = read.kind === 'unavailable' ? UNAVAILABLE_WARNING : read.kind === 'newer' ? NEWER_WARNING : UNREADABLE_WARNING;
      this.unsaved = new Set(this.memoryIds());
      return;
    }
    const current = read.kind === 'readable' ? read.earned : {};
    this.persisted = current;
    const needsWrite = this.memoryIds().some((id) => {
      const stored = current[id];
      return stored === undefined || Date.parse(this.memory[id]!) < Date.parse(stored);
    });
    if (!needsWrite) {
      this.unsaved = this.missingFromPersisted();
      this.warning = null;
      return;
    }
    const merged = mergeEarned(current, this.memory);
    try {
      this.storage!.setItem(UNLOCK_STORAGE_KEY, JSON.stringify({ version: 1, earned: sortedEarned(merged) }));
    } catch {
      this.warning = SAVE_FAILED_WARNING;
      this.unsaved = this.missingFromPersisted();
      return;
    }
    const reread = classify(this.storage);
    this.persisted = reread.kind === 'readable' ? reread.earned : merged;
    this.unsaved = this.missingFromPersisted();
    this.warning = null;
  }
}

function browserStorage(): Store | null {
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    return storage ?? null;
  } catch {
    return null;
  }
}

export let unlockRepository: UnlockRepository = new UnlockRepository(browserStorage());
export function setUnlockAccountStorage(storage: Store | null): void { unlockRepository = new UnlockRepository(storage); }
