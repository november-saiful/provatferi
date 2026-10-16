/**
 * Standalone Supabase Realtime subscription manager.
 *
 * Provides ref-counted channel subscriptions so that multiple consumers can
 * subscribe to the same table without creating duplicate channels (which
 * would trigger Supabase's "cannot add callbacks after subscribe" error).
 *
 * This module has **no React dependency** — it can be used in server-side
 * edge functions, Workers, or any JS runtime that has the Supabase client.
 *
 * The React-specific hook (`useRealtimeInvalidate`) lives in `lib/queries.ts`
 * and wraps `subscribeTable` / `unsubscribeTable` from this module.
 */

import { supabase } from './supabase/client';

// ---------------------------------------------------------------------------
// Dev-mode helpers
// ---------------------------------------------------------------------------

const IS_DEV = process.env.NODE_ENV !== 'production';

function debugLog(msg: string, detail?: Record<string, unknown>) {
  if (!IS_DEV) return;
  // eslint-disable-next-line no-console
  console.log(`%c[Realtime] ${msg}`, 'color:#8b5cf6;font-weight:600', detail ?? '');
}

// ---------------------------------------------------------------------------
// Subscription state
// ---------------------------------------------------------------------------

interface TableSubscription {
  refCount: number;
  queryKeys: Set<string>; // serialized JSON query keys
  channel: ReturnType<typeof supabase.channel>;
}

/** Module-level singleton — one entry per table. */
const activeSubscriptions = new Map<string, TableSubscription>();

// ---------------------------------------------------------------------------
// Debugging API (exposed on `window` in dev mode)
// ---------------------------------------------------------------------------

/**
 * Prints a snapshot of all active subscriptions to the console.
 * Call from the browser DevTools: `window.__realtimeDebug()`
 */
export function dumpSubscriptions() {
  const rows = Array.from(activeSubscriptions.entries()).map(([table, sub]) => ({
    table,
    refCount: sub.refCount,
    queryKeys: Array.from(sub.queryKeys).map((k) => JSON.parse(k))
  }));
  // eslint-disable-next-line no-console
  console.table(rows);
  return rows;
}

/**
 * Returns a read-only snapshot of all active subscriptions (useful for tests
 * and programmatic inspection — no console side-effect).
 */
export function getActiveSubscriptions() {
  return Array.from(activeSubscriptions.entries()).map(([table, sub]) => ({
    table,
    refCount: sub.refCount,
    queryKeys: Array.from(sub.queryKeys).map((k) => JSON.parse(k) as Array<string | number>)
  }));
}

if (IS_DEV && typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__realtimeDebug = dumpSubscriptions;
}

// ---------------------------------------------------------------------------
// Core subscribe / unsubscribe
// ---------------------------------------------------------------------------

/**
 * Callback invoked when any of the subscribed tables receive a change.
 * Receives the serialized query keys that should be invalidated.
 *
 * The React wrapper passes `(keys) => keys.forEach(k => qc.invalidateQueries({ queryKey: JSON.parse(k) }))`.
 * A non-React consumer can pass any function — e.g. a cache-buster, a logger,
 * or a custom state updater.
 */
export type OnTableChange = (queryKeys: string[]) => void;

/**
 * Subscribe to Supabase Realtime changes on `table`.
 *
 * If another consumer already subscribed to the same table the channel is
 * reused — only a new query-key entry and an incremented ref-count are added.
 *
 * @param table      - Postgres table name (must be in `supabase_realtime` publication)
 * @param queryKey   - React Query–style key array, serialized internally
 * @param onChanges  - Called when the table changes; receives serialized query keys
 */
export function subscribeTable(
  table: string,
  queryKey: Array<string | number>,
  onChanges: OnTableChange
) {
  const keyStr = JSON.stringify(queryKey);

  let sub = activeSubscriptions.get(table);
  if (sub) {
    sub.refCount++;
    sub.queryKeys.add(keyStr);
    debugLog(`[+${table}] refCount=${sub.refCount} (added key)`, { queryKey, keys: Array.from(sub.queryKeys) });
    return;
  }

  // First subscriber for this table — create the channel.
  const serializedKeys = new Set<string>();
  serializedKeys.add(keyStr);

  const channel = supabase
    .channel(`realtime-${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => {
        const entry = activeSubscriptions.get(table);
        if (!entry) return;
        onChanges(Array.from(entry.queryKeys));
      }
    )
    .subscribe();

  activeSubscriptions.set(table, {
    refCount: 1,
    queryKeys: serializedKeys,
    channel
  });

  debugLog(`[NEW ${table}] channel subscribed`, { queryKey, active: activeSubscriptions.size });
}

/**
 * Unsubscribe from a previously subscribed table.
 *
 * When the ref-count reaches 0 the underlying Supabase channel is torn down
 * and the entry is removed from the map.
 */
export function unsubscribeTable(table: string, queryKey: Array<string | number>) {
  const sub = activeSubscriptions.get(table);
  if (!sub) return;

  sub.queryKeys.delete(JSON.stringify(queryKey));
  sub.refCount--;

  if (sub.refCount <= 0) {
    supabase.removeChannel(sub.channel);
    activeSubscriptions.delete(table);
  }

  debugLog(`[-${table}] refCount=${sub.refCount} (removed key)`, {
    remaining: sub.refCount,
    active: activeSubscriptions.size
  });
}
