/**
 * Template-based personal session generator. Works offline without AI.
 * When the AI backend is connected, the Studio can request an AI-written version instead.
 */
import type { Chapter } from '../lib/types';

export interface GenInput { improve: string; behaviour: string; achieve: string; minutes: number; tone: 'calm' | 'warm' | 'direct' | 'gentle'; style: 'relaxing' | 'motivational' | 'reflective' | 'confidence' }

const toneWords = {
  calm: { open: 'Take your time', you: 'you', verb: 'allow' },
  warm: { open: 'Welcome. You are in a safe place', you: 'you', verb: 'let' },
  direct: { open: 'Let’s begin', you: 'you', verb: 'choose to' },
  gentle: { open: 'Softly now, settle in', you: 'you', verb: 'invite' },
};

const clean = (s: string) => s.trim().replace(/\.$/, '');

export function generateSession(i: GenInput): { title: string; chapters: Chapter[]; reflection: string[] } {
  const w = toneWords[i.tone];
  const improve = clean(i.improve) || 'my focus and consistency';
  const behaviour = clean(i.behaviour) || 'putting things off';
  const achieve = clean(i.achieve) || 'finishing what matters';
  const long = i.minutes >= 15;
  const extraPauses = i.minutes >= 20 ? ' [pause] [pause]' : i.minutes >= 10 ? ' [pause]' : '';
  const styleLine = {
    relaxing: 'There is no rush. Each breath makes the body softer and the mind quieter.',
    motivational: 'Feel a steady energy gathering in your chest, the energy of someone ready to act.',
    reflective: 'Let your mind become clear water, so you can see what lies beneath the surface.',
    confidence: 'Notice your posture changing: taller, steadier, more certain of your own capability.',
  }[i.style];

  const chapters: Chapter[] = [
    { title: 'Personal Introduction', text: `${w.open}. This session was created for you, to support you with ${improve}. [pause]
It is a self-development exercise. You stay aware and in control throughout, and you can open your eyes at any time. Please do not listen while driving.` },
    { title: 'Relaxation', text: `Find a comfortable position and ${w.verb} your eyes to close. [pause]
Breathe in slowly for four. [pause] And out for six.${extraPauses} [pause]
Again, in for four. [pause] And out for six, letting your shoulders drop.${extraPauses}
${styleLine} [pause]
Relax your forehead. Your jaw. Your shoulders. Your hands. Let the relaxation move down through your body to your feet.${extraPauses}
${long ? 'Counting down from five to one, drifting deeper with each number. Five. Four. Three. Two. One. [pause]' : ''}` },
    { title: 'Guided Visualisation', text: `Imagine a quiet, beautiful place that feels completely yours. Notice the light, the temperature, the sounds. [pause]
In this place you can see clearly. You can see the pattern of ${behaviour}, as if it were a path you have walked many times. [pause]
Notice, without judgement, what that path has given you, and what it has cost you.${extraPauses}
Now see a new path beside it. It leads towards ${achieve}. It is not perfect or effortless, but it is clear. [pause]
Step onto it.` },
    { title: 'Personal Affirmations', text: `Repeat silently after me. [pause]
I am building ${improve}, one day at a time. [pause]
When I notice ${behaviour}, I pause, breathe and choose again. [pause]
I am capable of ${achieve}. [pause]
I keep small promises to myself. [pause]
Progress matters more than perfection.` },
    { title: 'Behavioural Suggestions', text: `Here is a practical plan your mind can remember. [pause]
When you notice the first sign of ${behaviour}, take one slow breath. [pause] Ask: what is the smallest useful action right now? [pause] Then do that action for just two minutes.${extraPauses}
Each time you do this, it becomes a little more automatic. A new habit is simply a choice repeated until it feels natural. [pause]
Tomorrow, you will find one moment to practise this. Notice when it happens.` },
    { title: 'Future-Self Visualisation', text: `Now imagine yourself some months from now. You have been practising. [pause]
See this future version of you. How do they stand? How do they speak? How do they spend their mornings? [pause]
They have made real progress towards ${achieve}. Not by magic, but by many small actions.${extraPauses}
Notice what they want to tell you. Listen. [pause]
Thank them, and know that every action you take today brings you closer to becoming them.` },
    { title: 'Gentle Return', text: i.style === 'relaxing' && i.minutes >= 20
      ? 'If you are listening before sleep, you may simply stay in this calm state and drift into natural sleep. [pause] Otherwise, gently take a deeper breath, move your fingers and toes, and open your eyes when you are ready.'
      : `In a moment I will count from one to five, and you will return fully alert. [pause]
One. Feeling the weight of your body. Two. Hearing the room around you. [pause] Three. Energy returning to your arms and legs. Four. Taking a deeper breath. [pause] Five. Eyes open, clear and refreshed.` },
  ];
  return {
    title: `Personal Session: ${improve.charAt(0).toUpperCase() + improve.slice(1)}`.slice(0, 70),
    chapters,
    reflection: [`What did you notice about ${behaviour}?`, `What is one small action towards ${achieve} you will take tomorrow?`, 'What did your future self want to tell you?'],
  };
}
