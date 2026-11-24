/**
 * Data layer. One API, two backends:
 *  - Local mode: rows in localStorage, namespaced per local profile (device only).
 *  - Cloud mode: Supabase Postgres; Row Level Security restricts each user to their own rows.
 * An in-memory cache with subscriptions makes every table reactive in React.
 */
import { supabase } from './supabase';
import { Row, TableName, Tables, TABLES } from './types';
import { uid } from './util';

type Listener = () => void;
export type Backend = 'local' | 'cloud';

class Store {
  userId: string | null = null;
  backend: Backend = 'local';
  private cache = new Map<TableName, Row[]>();
  private loading = new Map<TableName, Promise<void>>();
  private listeners = new Map<TableName, Set<Listener>>();
  errors = new Map<TableName, string>();
  /** Increments whenever the user/backend changes, so hooks know to reload. */
  generation = 0;

  configure(userId: string | null, backend: Backend) {
    this.userId = userId; this.backend = backend; this.generation++;
    this.cache.clear(); this.loading.clear(); this.errors.clear();
    this.listeners.forEach((set) => set.forEach((l) => l()));
  }

  private key(t: TableName) { return `lm.${this.userId}.${t}`; }
  private readLocal(t: TableName): Row[] {
    try { return JSON.parse(localStorage.getItem(this.key(t)) || '[]'); } catch { return []; }
  }
  private writeLocal(t: TableName, rows: Row[]) {
    try { localStorage.setItem(this.key(t), JSON.stringify(rows)); }
    catch { this.errors.set(t, 'Device storage is full. Export your data and remove old entries.'); }
  }

  subscribe(t: TableName, l: Listener) {
    if (!this.listeners.has(t)) this.listeners.set(t, new Set());
    this.listeners.get(t)!.add(l);
    return () => { this.listeners.get(t)!.delete(l); };
  }
  private emit(t: TableName) { this.listeners.get(t)?.forEach((l) => l()); }

  peek<T extends TableName>(t: T): Tables[T][] | undefined { return this.cache.get(t) as Tables[T][] | undefined; }

  load(t: TableName): Promise<void> {
    if (!this.userId) return Promise.resolve();
    if (this.cache.has(t)) return Promise.resolve();
    if (this.loading.has(t)) return this.loading.get(t)!;
    const p = (async () => {
      try {
        if (this.backend === 'cloud' && supabase) {
          const { data, error } = await supabase.from(t).select('*').order('created_at', { ascending: true });
          if (error) throw error;
          this.cache.set(t, data as Row[]);
        } else {
          this.cache.set(t, this.readLocal(t));
        }
        this.errors.delete(t);
      } catch (e) {
        this.errors.set(t, (e as Error).message || 'Could not load data');
        this.cache.set(t, []);
      } finally {
        this.loading.delete(t);
        this.emit(t);
      }
    })();
    this.loading.set(t, p);
    return p;
  }

  async all<T extends TableName>(t: T): Promise<Tables[T][]> { await this.load(t); return (this.cache.get(t) || []) as Tables[T][]; }

  /** Insert or update. Pass a partial row; missing id = insert. Returns the saved row. */
  async save<T extends TableName>(t: T, patch: Partial<Tables[T]>): Promise<Tables[T]> {
    await this.load(t);
    const rows = [...(this.cache.get(t) || [])];
    const now = new Date().toISOString();
    const idx = patch.id ? rows.findIndex((r) => r.id === patch.id) : -1;
    const row = (idx >= 0
      ? { ...rows[idx], ...patch, updated_at: now }
      : { id: uid(), created_at: now, ...patch, updated_at: now, user_id: this.backend === 'cloud' ? this.userId! : undefined }) as Tables[T];
    if (this.backend === 'cloud') (row as Row).user_id = this.userId!;
    const prev = rows.slice();
    if (idx >= 0) rows[idx] = row; else rows.push(row);
    this.cache.set(t, rows); this.emit(t); // optimistic
    try {
      if (this.backend === 'cloud' && supabase) {
        const { error } = await supabase.from(t).upsert(row as never);
        if (error) throw error;
      } else this.writeLocal(t, rows);
      this.errors.delete(t);
    } catch (e) {
      this.cache.set(t, prev); this.errors.set(t, (e as Error).message); this.emit(t);
      throw e;
    }
    return row;
  }

  async remove(t: TableName, id: string) {
    await this.load(t);
    const prev = this.cache.get(t) || [];
    const rows = prev.filter((r) => r.id !== id);
    this.cache.set(t, rows); this.emit(t);
    try {
      if (this.backend === 'cloud' && supabase) {
        const { error } = await supabase.from(t).delete().eq('id', id);
        if (error) throw error;
      } else this.writeLocal(t, rows);
    } catch (e) { this.cache.set(t, prev); this.emit(t); throw e; }
  }

  async removeWhere<T extends TableName>(t: T, pred: (r: Tables[T]) => boolean) {
    const rows = await this.all(t);
    for (const r of rows.filter(pred)) await this.remove(t, r.id);
  }

  async exportAll() {
    const out: Record<string, unknown> = { app: 'The Limitless Mind', exported_at: new Date().toISOString(), backend: this.backend };
    for (const t of TABLES) out[t] = await this.all(t);
    return out;
  }

  async importAll(data: Record<string, unknown>) {
    for (const t of TABLES) {
      const rows = data[t];
      if (!Array.isArray(rows)) continue;
      for (const r of rows) {
        const { user_id: _ignored, ...rest } = r as Row; void _ignored;
        await this.save(t, rest as never);
      }
    }
  }

  /** Permanently deletes every record for the current user in the current backend. */
  async deleteAll() {
    for (const t of TABLES) {
      if (this.backend === 'cloud' && supabase) {
        const { error } = await supabase.from(t).delete().eq('user_id', this.userId!);
        if (error) throw error;
      } else localStorage.removeItem(this.key(t));
      this.cache.set(t, []); this.emit(t);
    }
  }
}

export const store = new Store();
