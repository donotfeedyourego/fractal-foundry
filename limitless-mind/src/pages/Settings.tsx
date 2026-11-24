import { useState } from 'react';
import { Download, LogOut, Moon, Sun, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../context/Auth';
import { CURRENCIES, usePrefs } from '../lib/prefs';
import { store } from '../lib/store';
import { aiStatus, askAI } from '../lib/ai';
import { Badge, Button, Card, Field, Notice, PageHeader, SectionTitle, Toggle } from '../components/ui';
import { download, today } from '../lib/util';
import { isCloudConfigured } from '../lib/supabase';

export default function Settings() {
  const auth = useAuth(); const { prefs, update } = usePrefs();
  const [name, setName] = useState(prefs.display_name);
  const [aiTest, setAiTest] = useState<string | null>(null); const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const exportAll = async () => download(`limitless-mind-export-${today()}.json`, JSON.stringify(await store.exportAll(), null, 2));
  const importAll = async (f?: File) => {
    if (!f) return;
    try { const data = JSON.parse(await f.text()); if (data.app !== 'The Limitless Mind') throw new Error('This is not a Limitless Mind export file.'); await store.importAll(data); setMsg('Import complete.'); }
    catch (e) { setMsg((e as Error).message); }
  };
  const testAI = async () => { setTesting(true); const r = await askAI('mentor', [{ role: 'user', content: 'Reply with one short sentence confirming you are connected.' }]); setAiTest(r.demo ? `Demo mode. ${r.notice || (isCloudConfigured ? 'Sign in with a cloud account and deploy the architect function.' : 'No backend configured.')}` : `Connected: ${r.text.slice(0, 160)}`); setTesting(false); };
  const deleteData = async () => { if (prompt('This permanently deletes all your data in this workspace. Type DELETE to confirm.') !== 'DELETE') return; await store.deleteAll(); location.hash = '#/'; location.reload(); };
  const deleteAccount = async () => { if (prompt('This permanently deletes your account and all data. Type DELETE to confirm.') !== 'DELETE') return; await auth.deleteAccount(); };

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader eyebrow="Profile & Settings" title="Your workspace." />
      <Card className="space-y-4">
        <SectionTitle>Profile</SectionTitle>
        <div className="text-sm text-muted">{auth.mode === 'cloud' ? <>Signed in as <span className="text-ink">{auth.email}</span> · data synced to your account</> : <>Local mode · data is stored only in this browser on this device</>}</div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); update({ display_name: name.trim() }); }}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" aria-label="Display name" maxLength={40} /><Button variant="outline">Save</Button></form>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5" role="group" aria-label="Theme"><span className="text-sm text-muted">Theme</span><div className="flex gap-2"><Button variant={prefs.theme === 'dark' ? 'gold' : 'outline'} size="sm" onClick={() => update({ theme: 'dark' })}><Moon className="w-4 h-4" />Dark</Button><Button variant={prefs.theme === 'light' ? 'gold' : 'outline'} size="sm" onClick={() => update({ theme: 'light' })}><Sun className="w-4 h-4" />Light</Button></div></div>
          <Field label="Currency"><select value={prefs.currency} onChange={(e) => update({ currency: e.target.value })}>{Object.keys(CURRENCIES).map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Coaching tone"><select value={prefs.coaching_tone} onChange={(e) => update({ coaching_tone: e.target.value })}><option value="direct">Direct and challenging</option><option value="warm">Warm and encouraging</option><option value="calm">Calm and reflective</option><option value="analytical">Analytical and precise</option></select></Field>
          <Field label={`Preferred session length: ${prefs.session_length} min`}><input type="range" min={5} max={45} step={5} value={prefs.session_length} onChange={(e) => update({ session_length: +e.target.value })} /></Field>
        </div>
        <Button variant="ghost" size="sm" onClick={() => update({ onboarded: false })}>Redo onboarding questions</Button>
      </Card>

      <Card className="space-y-3">
        <SectionTitle>AI · The Architect</SectionTitle>
        <div className="flex items-center gap-2 text-sm">Status: <Badge tone={aiStatus() === 'live' ? 'good' : 'muted'}>{aiStatus() === 'live' ? 'Connected' : aiStatus() === 'demo' ? 'Demo mode' : 'Not tested'}</Badge></div>
        <p className="text-sm text-muted">AI runs through a secure server-side function so no API key ever reaches your browser. Without it, the app uses a clearly labelled demo mode. Setup steps are in the project README (Supabase Edge Function <code>architect</code> + <code>ANTHROPIC_API_KEY</code> secret).</p>
        <Button size="sm" variant="outline" onClick={testAI} loading={testing}>Test AI connection</Button>
        {aiTest && <Notice tone="muted">{aiTest}</Notice>}
        <Toggle checked={prefs.journal_ai_consent} onChange={(v) => update({ journal_ai_consent: v })} label="Allow The Architect to read recent non-private journal entries to recognise patterns" />
      </Card>

      <Card className="space-y-3">
        <SectionTitle>Your data</SectionTitle>
        <p className="text-sm text-muted">You own your data. Export everything as JSON at any time, or import a previous export.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportAll}><Download className="w-4 h-4" />Export all data</Button>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line hover:border-gold/60 cursor-pointer text-sm"><Upload className="w-4 h-4" />Import<input type="file" accept="application/json" className="hidden" onChange={(e) => importAll(e.target.files?.[0])} /></label>
        </div>
        {msg && <Notice>{msg}</Notice>}
        <div className="pt-3 border-t border-line flex flex-wrap gap-2">
          <Button variant="danger" onClick={deleteData}><Trash2 className="w-4 h-4" />Delete all my data</Button>
          {auth.mode === 'cloud' && <Button variant="danger" onClick={deleteAccount}><Trash2 className="w-4 h-4" />Delete account</Button>}
        </div>
        <p className="text-xs text-muted">Voice recordings are stored {auth.mode === 'cloud' ? 'in private cloud storage' : 'in this browser (IndexedDB)'}; delete them individually from the Audio library.</p>
      </Card>

      <Card className="space-y-2">
        <SectionTitle>About</SectionTitle>
        <p className="text-sm text-muted">The Limitless Mind is a personal development tool. Hypnosis sessions are self-development exercises, not medical or psychological treatment. Financial content is educational, not advice. No results are guaranteed.</p>
        <Button variant="outline" onClick={auth.signOut}><LogOut className="w-4 h-4" />{auth.mode === 'cloud' ? 'Sign out' : 'Leave local mode'}</Button>
        {auth.mode === 'local' && <p className="text-xs text-muted">Leaving local mode keeps your data on this device; continue on this device again to return to it.</p>}
      </Card>
    </div>
  );
}
