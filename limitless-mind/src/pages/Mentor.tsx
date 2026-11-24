import { useEffect, useRef, useState } from 'react';
import { Copy, Download, MessageSquarePlus, Send, Sparkles, Star, Trash2, Check } from 'lucide-react';
import { Badge, Button, Card, Markdown, Notice, PageHeader, Spinner } from '../components/ui';
import { useTable } from '../lib/hooks';
import { askAI } from '../lib/ai';
import { usePrefs } from '../lib/prefs';
import { cx, download, fmtDate } from '../lib/util';
import { store } from '../lib/store';

const PROMPTS = [
  'Challenge my plan: I want to quit my job and go all in on a business next month.',
  'Help me prioritise my week. I have too many goals.',
  'Explain compound interest and why time matters so much.',
  'I keep procrastinating on my most important project. What should I do?',
  'Help me validate a business idea before I build it.',
  'What patterns do you notice in my recent journal entries?',
  'Write a short self-hypnosis script for confidence before a presentation.',
  'How does psychology connect to marketing?',
];

export default function Mentor() {
  const convs = useTable('ai_conversations'); const msgs = useTable('ai_messages');
  const { prefs } = usePrefs(); const journal = useTable('journal_entries'); const goals = useTable('goals');
  const [active, setActive] = useState<string | null>(null);
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const thread = msgs.rows.filter((m) => m.conversation_id === active).sort((a, b) => a.created_at.localeCompare(b.created_at));
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.length, busy]);
  const sorted = [...convs.rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const send = async (text = q) => {
    const content = text.trim(); if (!content || busy) return;
    setQ(''); setBusy(true); setNotice(null);
    let cid = active;
    if (!cid) { const c = await convs.save({ title: content.slice(0, 60), saved: false }); cid = c.id; setActive(cid); }
    await msgs.save({ conversation_id: cid, role: 'user', content, demo: false });
    const history = [...thread.map((m) => ({ role: m.role, content: m.content })), { role: 'user' as const, content }].slice(-20);
    const context: Record<string, unknown> = {
      name: prefs.display_name, tone: prefs.coaching_tone, objectives: prefs.objectives, financial_ambition: prefs.financial_ambition,
      active_goals: goals.rows.filter((g) => g.status === 'active').slice(0, 8).map((g) => ({ title: g.title, deadline: g.deadline, category: g.category })),
    };
    if (prefs.journal_ai_consent) context.recent_journal = journal.rows.filter((e) => !e.is_private).sort((a, b) => b.entry_date.localeCompare(a.entry_date)).slice(0, 10)
      .map((e) => ({ date: e.entry_date, kind: e.kind, title: e.title, mood: e.mood, text: (Object.values(e.answers).join(' ') + ' ' + e.body).slice(0, 600) }));
    const r = await askAI('mentor', history, context);
    await msgs.save({ conversation_id: cid, role: 'assistant', content: r.text, demo: r.demo });
    await store.save('ai_conversations', { id: cid });
    if (r.notice) setNotice(r.notice);
    setBusy(false);
  };
  const removeConv = async (id: string) => { if (!confirm('Delete this conversation?')) return; for (const m of msgs.rows.filter((x) => x.conversation_id === id)) await msgs.remove(m.id); await convs.remove(id); if (active === id) setActive(null); };
  const exportConv = () => { const c = convs.rows.find((x) => x.id === active); if (!c) return; download(`architect-${c.title.slice(0, 30).replace(/\W+/g, '-')}.md`, `# ${c.title}\n_${fmtDate(c.created_at)}_\n\n` + thread.map((m) => `**${m.role === 'user' ? 'You' : 'The Architect'}:**\n\n${m.content}`).join('\n\n---\n\n'), 'text/markdown'); };
  const copy = (id: string, text: string) => { navigator.clipboard?.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 1500); }); };
  const anyDemo = thread.some((m) => m.demo);

  return (
    <div>
      <PageHeader eyebrow="AI Mentor" title="The Architect" subtitle="An honest thinking partner for learning, wealth, goals and reflection. It will challenge you, not flatter you." />
      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <Card className="p-3 h-fit lg:sticky lg:top-6">
          <Button className="w-full" onClick={() => { setActive(null); setNotice(null); }}><MessageSquarePlus className="w-4 h-4" />New conversation</Button>
          <div className="mt-3 space-y-0.5 max-h-[50vh] overflow-y-auto">
            {sorted.map((c) => (
              <div key={c.id} className={cx('group flex items-center gap-1 rounded-lg', active === c.id ? 'bg-raised' : 'hover:bg-raised/50')}>
                <button onClick={() => setActive(c.id)} className="flex-1 text-left px-2.5 py-2 text-sm truncate">{c.saved && <Star className="w-3 h-3 inline mr-1 text-gold fill-gold" />}{c.title}</button>
                <button onClick={() => removeConv(c.id)} className="p-1.5 text-muted hover:text-bad opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Delete conversation"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>))}
            {!sorted.length && <p className="text-xs text-muted p-2">Conversations are saved to your account.</p>}
          </div>
        </Card>
        <Card className="flex flex-col min-h-[65vh] p-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-line">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold" /><span className="text-sm">{active ? convs.rows.find((c) => c.id === active)?.title : 'New conversation'}</span>{anyDemo && <Badge>Demo mode</Badge>}</div>
            {active && <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => { const c = convs.rows.find((x) => x.id === active)!; convs.save({ id: c.id, saved: !c.saved }); }}><Star className="w-4 h-4" />{convs.rows.find((c) => c.id === active)?.saved ? 'Saved' : 'Save'}</Button><Button size="sm" variant="ghost" onClick={exportConv}><Download className="w-4 h-4" />Export</Button></div>}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!active && (
              <div className="py-6">
                <div className="text-center mb-6"><div className="w-14 h-14 rounded-full bg-gold/10 mx-auto grid place-items-center"><Sparkles className="w-6 h-6 text-gold" /></div><p className="text-muted text-sm mt-3 max-w-md mx-auto">Ask anything about learning, business, money, goals or your own patterns. {prefs.journal_ai_consent ? 'Journal pattern recognition is on (private notes excluded).' : 'Journal pattern recognition is off; enable it in Settings.'}</p></div>
                <div className="grid sm:grid-cols-2 gap-2">{PROMPTS.map((p) => <button key={p} onClick={() => send(p)} className="text-left text-sm p-3 rounded-xl border border-line hover:border-gold/50 text-muted hover:text-ink">{p}</button>)}</div>
              </div>
            )}
            {thread.map((m) => (
              <div key={m.id} className={cx('max-w-[92%] md:max-w-[80%]', m.role === 'user' ? 'ml-auto' : '')}>
                <div className={cx('rounded-2xl px-4 py-3 text-[15px]', m.role === 'user' ? 'bg-gold/15' : 'bg-raised/60')}>{m.role === 'assistant' ? <Markdown text={m.content} /> : <p className="whitespace-pre-wrap">{m.content}</p>}</div>
                {m.role === 'assistant' && <button onClick={() => copy(m.id, m.content)} className="text-xs text-muted hover:text-ink mt-1 flex items-center gap-1">{copied === m.id ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}</button>}
              </div>))}
            {busy && <Spinner label="The Architect is thinking" />}
            <div ref={endRef} />
          </div>
          {notice && <div className="px-5"><Notice tone="muted">{notice}</Notice></div>}
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-4 border-t border-line flex gap-2">
            <textarea rows={1} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Message The Architect…" className="resize-none" aria-label="Message" />
            <Button disabled={busy || !q.trim()} aria-label="Send"><Send className="w-4 h-4" /></Button>
          </form>
        </Card>
      </div>
      <p className="text-[11px] text-muted mt-4">The Architect can make mistakes. Verify important facts, and use qualified professionals for medical, legal, financial or mental health decisions.</p>
    </div>
  );
}
