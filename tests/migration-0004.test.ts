import { describe, expect, it } from 'vitest';
import sql from '../migrations/0004_progression_results.sql?raw';

// The in-memory D1 stub in tests/worker.test.ts never parses SQL, so the database-level contract is pinned on the migration text.
const statements = sql.split(';').map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length > 0);

describe('migration 0004_progression_results.sql', () => {
  it('adds the three progress columns with legacy defaults and CHECK constraints', () => {
    expect(statements).toEqual([
      'ALTER TABLE scores ADD COLUMN waves_completed INTEGER NOT NULL DEFAULT 0 CHECK (waves_completed BETWEEN 0 AND 500)',
      "ALTER TABLE scores ADD COLUMN outcome TEXT NOT NULL DEFAULT 'defeat' CHECK (outcome IN ('victory','defeat','siege-failed'))",
      'ALTER TABLE scores ADD COLUMN siege_bosses_defeated INTEGER NOT NULL DEFAULT 0 CHECK (siege_bosses_defeated BETWEEN 0 AND 7)'
    ]);
  });

  it('is additive: only ADD COLUMN, nothing dropped, deleted, renamed or rewritten', () => {
    expect(statements.every((s) => s.startsWith('ALTER TABLE scores ADD COLUMN '))).toBe(true);
    expect(sql).not.toMatch(/\b(DROP|DELETE|UPDATE|INSERT|RENAME)\b/i);
  });
});
