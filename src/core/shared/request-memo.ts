/**
 * core/shared/request-memo.ts — reads shared within one request, without a
 * framework (ADR-0001). The app hands core a database marked as this
 * request's (`requestScoped`, once per request); a reader that many parts
 * of one page need (the sessions: the day page asked for them eight times,
 * ~1 MB from the database per render, 2026-10-24) loads once through
 * `memo` and the others reuse it. A write calls `forget`, so what the same
 * request renders after it is read again. An unmarked database (scripts,
 * tests) never memoises: every call reads, as before.
 */
const SCOPED = Symbol("lifeos.requestScoped");
const memos = new WeakMap<object, Map<string, Promise<unknown>>>();

/** A database of this request only: same queries, its own memo. */
export function requestScoped<T extends object>(db: T): T {
  const scoped = Object.create(db) as T & { [SCOPED]?: true };
  scoped[SCOPED] = true;
  return scoped;
}

/** Whether this database is one request's (memoising), not a script's or a test's. */
export function isRequestScoped(db: object): boolean {
  return Object.prototype.hasOwnProperty.call(db, SCOPED);
}

/** `load()` once per request and key; on an unmarked database, every time. */
export function memo<T>(db: object, key: string, load: () => Promise<T>): Promise<T> {
  if (!isRequestScoped(db)) return load();
  let m = memos.get(db);
  if (!m) memos.set(db, (m = new Map()));
  let p = m.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load();
    m.set(key, p);
    // A failed read is not kept: the next call tries again.
    p.catch(() => m.delete(key));
  }
  return p;
}

/** Drops what this request memoised under keys starting with `prefix`. */
export function forget(db: object, prefix: string): void {
  const m = memos.get(db);
  if (!m) return;
  for (const k of [...m.keys()]) if (k.startsWith(prefix)) m.delete(k);
}
