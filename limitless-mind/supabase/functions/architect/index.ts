// Supabase Edge Function: "architect"
// Server-side gateway to Claude. The API key lives only in the function's secrets:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Optional: ARCHITECT_MODEL (defaults to claude-opus-5-5).
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const BASE = `You are The Architect, the AI mentor inside "The Limitless Mind", a personal development app covering learning, wealth education, discipline, goals, journaling and self-hypnosis.
Principles:
- Be honest, practical and specific. Do not simply agree. Challenge unrealistic assumptions, point out contradictions, and say plainly when something is unlikely or risky.
- Encourage evidence-based thinking. Distinguish established facts from interpretation or speculation. Never invent sources, studies or statistics.
- Prioritise: end with one or two concrete next actions where useful.
- Money: educational only, never personalised investment advice; never promise returns; flag scams and get-rich-quick thinking.
- Health: you are not a therapist or doctor. If someone describes crisis, self-harm or serious distress, respond with care and encourage professional or emergency help.
- Hypnosis: describe sessions as relaxation and self-development exercises; never claim guaranteed results, unlimited intelligence or control over others.
- Use concise Markdown (short paragraphs, bullet lists, **bold** sparingly). No headings larger than bold text.`;

const PURPOSE: Record<string, string> = {
  mentor: 'Act as a mentor and thinking partner. Use the user context (goals, objectives, and journal excerpts only if provided) to personalise. If journal excerpts are present, you may point out recurring patterns, labelled as observations, not diagnoses.',
  tutor: 'Act as a patient tutor. Start simple, use analogies and a worked example, then offer to go deeper. Match the requested level. If unsure of a fact, say so.',
  reflect: 'Help the user reflect on a journal entry. Offer 3–5 thoughtful questions and, if appropriate, possible interpretations clearly labelled as possibilities, not facts. For dreams, note that dream meanings are not scientifically established.',
  plan: 'Break the idea or goal into 6–12 realistic, concrete steps. Respond with ONLY JSON: {"steps":[{"stage":"research|validation|planning|execution|review","title":"..."}]}.',
  hypnosis: 'Write an original, safe self-hypnosis script from the JSON brief (improve, behaviour, achieve, minutes, tone, style). Include: personal introduction, relaxation, guided visualisation, personalised affirmations, behavioural suggestions, future-self visualisation, gentle return (or drift to sleep for relaxing sessions over 20 minutes). Use "[pause]" for silences. Length should suit the requested minutes at ~120 words per minute. Respond with ONLY JSON: {"title":"...","chapters":[{"title":"...","text":"..."}],"reflection":["...","..."]}.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Require a signed-in Supabase user.
  const auth = req.headers.get('Authorization') ?? '';
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'not_configured' });

  let body: { purpose?: string; messages?: { role: 'user' | 'assistant'; content: string }[]; context?: Record<string, unknown> };
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const purpose = PURPOSE[body.purpose ?? ''] ? body.purpose! : 'mentor';
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20).map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length) return json({ error: 'no_messages' }, 400);

  const system = `${BASE}\n\nTask: ${PURPOSE[purpose]}\n\nUser context (JSON, may be partial):\n${JSON.stringify(body.context ?? {}).slice(0, 6000)}`;
  const client = new Anthropic({ apiKey });
  try {
    const res = await client.beta.messages.create({
      model: Deno.env.get('ARCHITECT_MODEL') ?? 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: purpose === 'mentor' || purpose === 'tutor' ? 'medium' : 'low' },
      system,
      messages,
    } as never);
    // deno-lint-ignore no-explicit-any
    const r = res as any;
    if (r.stop_reason === 'refusal') return json({ text: 'I can’t help with that request. If you are struggling, please reach out to a qualified professional or local support service.' });
    // deno-lint-ignore no-explicit-any
    const text = (r.content as any[]).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return json({ text: text || '…' });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'rate_limited' }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'bad_api_key' }, 500);
    if (e instanceof Anthropic.APIError) return json({ error: `api_error_${e.status}` }, 502);
    return json({ error: 'upstream_failed' }, 502);
  }
});
