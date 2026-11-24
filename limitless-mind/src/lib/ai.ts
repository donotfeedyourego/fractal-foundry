/**
 * AI integration layer. All model calls go through the Supabase Edge Function `architect`
 * (supabase/functions/architect), which holds the API key server-side. The browser never sees a key.
 * When no backend or key is configured, callers get an honest, clearly-labelled demo response.
 */
import { supabase } from './supabase';
import { demoReply } from './aiDemo';

export type AIPurpose = 'mentor' | 'tutor' | 'hypnosis' | 'reflect' | 'plan';
export interface AIMsg { role: 'user' | 'assistant'; content: string }
export interface AIResult { text: string; demo: boolean; notice?: string }

let status: 'unknown' | 'live' | 'demo' = 'unknown';
export const aiStatus = () => status;

export async function askAI(purpose: AIPurpose, messages: AIMsg[], context: Record<string, unknown> = {}): Promise<AIResult> {
  if (supabase) {
    const { data: s } = await supabase.auth.getSession();
    if (s.session) {
      try {
        const { data, error } = await supabase.functions.invoke('architect', { body: { purpose, messages, context } });
        if (error) throw error;
        if (data?.text) { status = 'live'; return { text: data.text, demo: false }; }
        if (data?.error === 'not_configured') {
          status = 'demo';
          return { ...demoReply(purpose, messages, context), notice: 'The AI backend is deployed but has no API key set. Showing demo mode.' };
        }
        throw new Error(data?.error || 'Empty response');
      } catch (e) {
        status = 'demo';
        return { ...demoReply(purpose, messages, context), notice: `AI unavailable (${(e as Error).message}). Showing demo mode.` };
      }
    }
  }
  status = 'demo';
  return demoReply(purpose, messages, context);
}

/** Pull the first JSON object out of a model reply (models sometimes wrap JSON in prose or fences). */
export function extractJSON<T>(text: string): T | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as T; } catch { return null; }
}
