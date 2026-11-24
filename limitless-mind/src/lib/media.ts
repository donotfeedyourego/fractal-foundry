/**
 * Audio file storage: Local mode -> IndexedDB on this device; Cloud mode -> Supabase Storage
 * bucket "recordings" under <user_id>/..., protected by storage RLS policies.
 */
import { store } from './store';
import { supabase } from './supabase';
import { Recording } from './types';
import { uid } from './util';

const DB = 'limitless-mind-media';
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('blobs');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function idbOp<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction('blobs', mode); const req = fn(tx.objectStore('blobs'));
    req.onsuccess = () => res(req.result as T); req.onerror = () => rej(req.error);
  });
}

export async function saveAudio(blob: Blob, meta: { title: string; kind: Recording['kind']; duration_sec: number; session_id?: string | null }) {
  const id = uid();
  const ext = blob.type.includes('mpeg') ? 'mp3' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : blob.type.includes('wav') ? 'wav' : 'webm';
  let path: string;
  if (store.backend === 'cloud' && supabase) {
    path = `${store.userId}/${id}.${ext}`;
    const { error } = await supabase.storage.from('recordings').upload(path, blob, { contentType: blob.type });
    if (error) throw error;
  } else {
    path = `idb:${id}`;
    await idbOp('readwrite', (s) => s.put(blob, id));
  }
  return store.save('recordings', { id, title: meta.title, kind: meta.kind, duration_sec: meta.duration_sec, mime: blob.type, storage_path: path, session_id: meta.session_id ?? null });
}

export async function loadAudioURL(rec: Recording): Promise<string> {
  if (rec.storage_path.startsWith('idb:')) {
    const blob = await idbOp<Blob | undefined>('readonly', (s) => s.get(rec.storage_path.slice(4)));
    if (!blob) throw new Error('Audio not found on this device.');
    return URL.createObjectURL(blob);
  }
  const { data, error } = await supabase!.storage.from('recordings').createSignedUrl(rec.storage_path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteAudio(rec: Recording) {
  if (rec.storage_path.startsWith('idb:')) await idbOp('readwrite', (s) => s.delete(rec.storage_path.slice(4)));
  else if (supabase) await supabase.storage.from('recordings').remove([rec.storage_path]);
  await store.remove('recordings', rec.id);
}

export const recordingSupported = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

export function audioDuration(blob: Blob): Promise<number> {
  return new Promise((res) => {
    const a = new Audio(); a.preload = 'metadata';
    a.onloadedmetadata = () => res(isFinite(a.duration) ? Math.round(a.duration) : 0);
    a.onerror = () => res(0); a.src = URL.createObjectURL(blob);
  });
}

/** External TTS (server-side). Returns null when not configured. */
export async function synthesizeExternal(text: string, voice?: string): Promise<Blob | null> {
  if (!supabase) return null;
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
    body: JSON.stringify({ text, voice }),
  });
  if (r.status === 501) return null;
  if (!r.ok) throw new Error(`TTS failed (${r.status})`);
  return r.blob();
}
