import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, migrateDatabase } from '@/services/database';

/**
 * Minimal fake `SQLiteDatabase` for migration-idempotency tests. Records every SQL
 * statement executed, tracks `user_version`, and runs `withTransactionAsync` bodies
 * inline. Only the methods `migrateDatabase` actually calls are implemented — every
 * other member throws so a future migration cannot silently pass by leaning on an
 * unimplemented API.
 */
class FakeMigrationDb {
  private userVersionValue: number;
  readonly executed: string[] = [];
  transactionCount = 0;

  constructor(initialUserVersion = 0) {
    this.userVersionValue = initialUserVersion;
  }

  get userVersion(): number {
    return this.userVersionValue;
  }

  getFirstAsync = async <T>(sql: string): Promise<T | null> => {
    if (/^\s*PRAGMA\s+user_version\s*$/i.test(sql)) {
      return { user_version: this.userVersionValue } as T;
    }
    throw new Error(`FakeMigrationDb.getFirstAsync received unsupported sql: ${sql}`);
  };

  execAsync = async (sql: string): Promise<void> => {
    this.executed.push(sql);
    const match = sql.match(/PRAGMA\s+user_version\s*=\s*(\d+)/i);
    if (match) {
      this.userVersionValue = Number(match[1]);
    }
  };

  withTransactionAsync = async (fn: () => Promise<void>): Promise<void> => {
    this.transactionCount += 1;
    await fn();
  };
}

function asDb(fake: FakeMigrationDb): SQLiteDatabase {
  return fake as unknown as SQLiteDatabase;
}

describe('migrateDatabase', () => {
  it('exposes DATABASE_VERSION = 3 after ADR-30', () => {
    expect(DATABASE_VERSION).toBe(3);
  });

  it('runs V1 → V2 → V3 on a fresh database and lands at user_version = 3', async () => {
    const fake = new FakeMigrationDb(0);
    const result = await migrateDatabase(asDb(fake));

    expect(result).toBe(3);
    expect(fake.userVersion).toBe(3);
    expect(fake.transactionCount).toBe(3);

    const joined = fake.executed.join('\n');
    expect(joined).toMatch(/CREATE TABLE IF NOT EXISTS sleep_sessions/);
    expect(joined).toMatch(/CREATE TABLE IF NOT EXISTS snore_events/);
    expect(joined).toMatch(/CREATE TABLE IF NOT EXISTS session_buckets/);
    expect(joined).toMatch(/ALTER TABLE snore_events ADD COLUMN confidence/);
    expect(joined).toMatch(/ALTER TABLE snore_events ADD COLUMN class_label/);
    expect(joined).toMatch(/ALTER TABLE snore_events ADD COLUMN spectral_peak_hz/);
    expect(joined).toMatch(/ALTER TABLE sleep_sessions ADD COLUMN score_version/);
    expect(joined).toMatch(/DELETE FROM session_buckets/);
    expect(joined).toMatch(/DELETE FROM snore_events/);
    expect(joined).toMatch(/DELETE FROM sleep_sessions/);
    expect(joined).toMatch(/CREATE TABLE IF NOT EXISTS app_settings/);
  });

  it('applies V2 then V3 (no V1 recreate) when upgrading from v1', async () => {
    const fake = new FakeMigrationDb(1);
    const result = await migrateDatabase(asDb(fake));

    expect(result).toBe(3);
    expect(fake.userVersion).toBe(3);
    expect(fake.transactionCount).toBe(2);

    const joined = fake.executed.join('\n');
    expect(joined).not.toMatch(/CREATE TABLE IF NOT EXISTS sleep_sessions/);
    expect(joined).toMatch(/ALTER TABLE snore_events ADD COLUMN confidence/);
    expect(joined).toMatch(/DELETE FROM sleep_sessions/);
    expect(joined).toMatch(/CREATE TABLE IF NOT EXISTS app_settings/);
  });

  it('applies only the additive V3 (no wipe) when upgrading from v2', async () => {
    const fake = new FakeMigrationDb(2);
    const result = await migrateDatabase(asDb(fake));

    expect(result).toBe(3);
    expect(fake.userVersion).toBe(3);
    expect(fake.transactionCount).toBe(1);

    const joined = fake.executed.join('\n');
    // Existing nights must survive the public-release upgrade (ADR-30): no data wipe.
    expect(joined).not.toMatch(/DELETE FROM sleep_sessions/);
    expect(joined).toMatch(/CREATE TABLE IF NOT EXISTS app_settings/);
  });

  it('is a no-op when the database is already at the current version', async () => {
    const fake = new FakeMigrationDb(3);
    const result = await migrateDatabase(asDb(fake));

    expect(result).toBe(3);
    expect(fake.userVersion).toBe(3);
    expect(fake.executed).toEqual([]);
    expect(fake.transactionCount).toBe(0);
  });

  it('is idempotent when called twice on a fresh database', async () => {
    const fake = new FakeMigrationDb(0);
    await migrateDatabase(asDb(fake));
    const executedAfterFirst = fake.executed.length;
    const transactionsAfterFirst = fake.transactionCount;

    const second = await migrateDatabase(asDb(fake));

    expect(second).toBe(3);
    expect(fake.executed.length).toBe(executedAfterFirst);
    expect(fake.transactionCount).toBe(transactionsAfterFirst);
  });

  it('wraps each version step in its own transaction', async () => {
    const fake = new FakeMigrationDb(0);
    await migrateDatabase(asDb(fake));
    // One transaction per version (V1, V2, V3). The trailing PRAGMA write is outside a
    // transaction — a bare PRAGMA set is atomic in SQLite.
    expect(fake.transactionCount).toBe(3);
  });
});
