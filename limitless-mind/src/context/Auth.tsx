import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isCloudConfigured, supabase } from '../lib/supabase';
import { store } from '../lib/store';

interface AuthState {
  ready: boolean;
  mode: 'none' | 'local' | 'cloud';
  email: string | null;
  userId: string | null;
  cloudAvailable: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<string>;
  magicLink(email: string): Promise<void>;
  useLocal(): void;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
}
const Ctx = createContext<AuthState>(null as never);
export const useAuth = () => useContext(Ctx);
const LOCAL_KEY = 'lm.localProfile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [local, setLocal] = useState<boolean>(() => { try { return localStorage.getItem(LOCAL_KEY) === '1'; } catch { return false; } });

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const mode: AuthState['mode'] = session ? 'cloud' : local ? 'local' : 'none';
  const userId = session ? session.user.id : local ? 'local' : null;

  // Configure the store synchronously during render so children never read another user's cache.
  if (store.userId !== userId || store.backend !== (mode === 'cloud' ? 'cloud' : 'local')) {
    store.configure(userId, mode === 'cloud' ? 'cloud' : 'local');
  }

  const value: AuthState = {
    ready, mode, userId, email: session?.user.email ?? null, cloudAvailable: isCloudConfigured,
    async signIn(email, password) {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password) {
      const { data, error } = await supabase!.auth.signUp({ email, password, options: { emailRedirectTo: location.href.split('#')[0] } });
      if (error) throw error;
      return data.session ? 'Account created.' : 'Check your inbox to confirm your email, then sign in.';
    },
    async magicLink(email) {
      const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split('#')[0] } });
      if (error) throw error;
    },
    useLocal() { try { localStorage.setItem(LOCAL_KEY, '1'); } catch { /* */ } setLocal(true); },
    async signOut() {
      if (session && supabase) await supabase.auth.signOut();
      try { localStorage.removeItem(LOCAL_KEY); } catch { /* */ }
      setLocal(false); setSession(null);
    },
    async deleteAccount() {
      await store.deleteAll();
      if (session && supabase) {
        // Removes the auth user via a SECURITY DEFINER function limited to auth.uid().
        await supabase.rpc('delete_my_account');
      }
      await value.signOut();
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
