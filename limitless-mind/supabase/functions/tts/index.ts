// Supabase Edge Function: "tts" — optional external text-to-speech provider.
// Returns 501 when not configured so the app can say so honestly.
// Configure ONE provider with secrets, e.g.:
//   supabase secrets set TTS_PROVIDER=elevenlabs ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=...
//   supabase secrets set TTS_PROVIDER=openai OPENAI_API_KEY=... (optional OPENAI_TTS_VOICE, OPENAI_TTS_MODEL)
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const err = (msg: string, status: number) => new Response(JSON.stringify({ error: msg }), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return err('unauthorized', 401);

  const { text, voice } = await req.json().catch(() => ({ text: '' }));
  if (!text || typeof text !== 'string') return err('no_text', 400);
  const input = text.slice(0, 4500);
  const provider = Deno.env.get('TTS_PROVIDER');

  let upstream: Response;
  if (provider === 'elevenlabs' && Deno.env.get('ELEVENLABS_API_KEY')) {
    const id = voice || Deno.env.get('ELEVENLABS_VOICE_ID');
    if (!id) return err('voice_not_configured', 501);
    upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}`, {
      method: 'POST', headers: { 'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY')!, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: input, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.6, similarity_boost: 0.7 } }),
    });
  } else if (provider === 'openai' && Deno.env.get('OPENAI_API_KEY')) {
    upstream = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: Deno.env.get('OPENAI_TTS_MODEL') ?? 'tts-1', voice: voice || Deno.env.get('OPENAI_TTS_VOICE') || 'alloy', input, response_format: 'mp3', speed: 0.9 }),
    });
  } else return err('not_configured', 501);

  if (!upstream.ok) return err(`provider_error_${upstream.status}`, 502);
  return new Response(upstream.body, { headers: { ...CORS, 'Content-Type': 'audio/mpeg' } });
});
