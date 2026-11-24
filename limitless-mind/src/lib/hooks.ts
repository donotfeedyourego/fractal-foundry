import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { store } from './store';
import { TableName, Tables } from './types';

export function useTable<T extends TableName>(t: T) {
  const rows = useSyncExternalStore(
    useCallback((l) => store.subscribe(t, l), [t]),
    () => store.peek(t),
  );
  const gen = store.generation;
  useEffect(() => { store.load(t); }, [t, gen, rows === undefined]);
  return {
    rows: (rows || EMPTY) as Tables[T][],
    loading: rows === undefined,
    error: store.errors.get(t) || null,
    save: (p: Partial<Tables[T]>) => store.save(t, p),
    remove: (id: string) => store.remove(t, id),
  };
}
const EMPTY: never[] = [];

export function useLocalState<V>(key: string, initial: V) {
  const [v, setV] = useState<V>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV] as const;
}
