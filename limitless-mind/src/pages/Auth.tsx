import { FormEvent, useState } from 'react';
import { useAuth } from '../context/Auth';
import { Button, Field, Notice } from '../components/ui';
import { InfinityMark } from '../components/Logo';

export default function AuthPage() {
  const a = useAuth();
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ t: 'err', m: 'Enter a valid email address.' });
    if (pw.length < 8) return setMsg({ t: 'err', m: 'Password must be at least 8 characters.' });
    setBusy(true);
    try {
      if (tab === 'in') await a.signIn(email, pw);
      else setMsg({ t: 'ok', m: await a.signUp(email, pw) });
    } catch (err) { setMsg({ t: 'err', m: (err as Error).message }); }
    setBusy(false);
  };
  const magic = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ t: 'err', m: 'Enter your email first.' });
    setBusy(true);
    try { await a.magicLink(email); setMsg({ t: 'ok', m: 'Check your inbox for a sign-in link.' }); }
    catch (err) { setMsg({ t: 'err', m: (err as Error).message }); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-line relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(var(--gold)) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="relative text-[11px] tracking-[0.35em] text-muted">THE LIMITLESS MIND</div>
        <div className="relative">
          <InfinityMark className="w-40 h-20 mb-8" animated />
          <h1 className="text-5xl font-semibold leading-tight">Your mind is your<br /><span className="gold-text">greatest asset.</span></h1>
          <p className="text-muted mt-4 max-w-md">Think beyond limitations. Learn without boundaries. Build without permission.</p>
        </div>
        <div className="relative text-xs text-muted">Train your mind · Expand your knowledge · Build your wealth · Execute your vision</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm fade-in">
          <div className="lg:hidden text-center mb-8"><InfinityMark className="w-24 h-12 mx-auto mb-3" animated /><h1 className="text-3xl font-semibold">The Limitless Mind</h1><p className="text-muted text-sm mt-1">Your mind is your greatest asset.</p></div>
          {a.cloudAvailable ? (
            <>
              <div className="flex bg-raised rounded-xl p-1 mb-6">
                {(['in', 'up'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-sm ${tab === t ? 'bg-surface shadow' : 'text-muted'}`}>{t === 'in' ? 'Sign in' : 'Create account'}</button>)}
              </div>
              <form onSubmit={submit} className="space-y-4" noValidate>
                <Field label="Email"><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label="Password" hint={tab === 'up' ? 'At least 8 characters.' : undefined}><input type="password" autoComplete={tab === 'in' ? 'current-password' : 'new-password'} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
                {msg && <Notice tone={msg.t === 'err' ? 'bad' : 'gold'}>{msg.m}</Notice>}
                <Button className="w-full" size="lg" loading={busy}>{tab === 'in' ? 'Sign in' : 'Create account'}</Button>
                {tab === 'in' && <button type="button" onClick={magic} className="w-full text-sm text-muted hover:text-ink">Email me a sign-in link instead</button>}
              </form>
              <div className="flex items-center gap-3 my-6 text-xs text-muted"><div className="flex-1 h-px bg-line" />or<div className="flex-1 h-px bg-line" /></div>
            </>
          ) : (
            <Notice tone="muted">Cloud accounts are not configured for this installation, so the app runs in <strong>Local mode</strong>: everything is stored privately in this browser. See the README to enable Supabase sync.</Notice>
          )}
          <Button variant="outline" className="w-full mt-4" onClick={a.useLocal}>Continue on this device only</Button>
          <p className="text-[11px] text-muted mt-6 text-center leading-relaxed">The Limitless Mind is a self-development tool. Sessions and content are not a substitute for professional medical, psychological or financial advice.</p>
        </div>
      </div>
    </div>
  );
}
