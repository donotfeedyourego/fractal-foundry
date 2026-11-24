/**
 * Built-in guided sessions. Original content written for The Limitless Mind.
 * "[pause]" marks a 3-second silence for the voice engine.
 * These are self-development exercises, not medical or psychological treatment.
 */
import type { Chapter } from '../lib/types';

export interface Programme {
  id: string; title: string; subtitle?: string; category: string; objective: string;
  intro: string; breathing: string; visualisation: string; suggestions: string[];
  returnText: string; reflection: string[]; chapters: Chapter[]; minutes: number;
}

const STANDARD_RETURN = `In a moment I will count from one to five. With each number you will become more awake, more alert, and you will bring back with you everything that is useful from this session. [pause]
One. Becoming aware of the surface beneath you, the weight of your body. [pause]
Two. Noticing the sounds of the room around you. Feeling the air on your skin. [pause]
Three. Energy returning to your arms and legs. Take a deeper breath. [pause]
Four. Gently move your fingers and toes. Roll your shoulders. [pause]
Five. Open your eyes. Fully awake, clear headed and ready for whatever comes next. Take a moment before standing up.`;

function build(p: Omit<Programme, 'chapters' | 'minutes'> & { script: string; extraChapters?: Chapter[] }): Programme {
  const chapters: Chapter[] = p.extraChapters ?? [
    { title: 'Introduction', text: p.intro },
    { title: 'Breathing', text: p.breathing },
    { title: 'Guided Session', text: p.script },
    { title: 'Visualisation', text: p.visualisation },
    { title: 'Suggestions', text: p.suggestions.join(' [pause]\n') },
    { title: 'Return to Alertness', text: p.returnText },
  ];
  const words = chapters.reduce((n, c) => n + c.text.split(/\s+/).length, 0);
  const pauses = chapters.reduce((n, c) => n + (c.text.match(/\[pause\]/gi) || []).length, 0);
  const { script: _s, extraChapters: _e, ...rest } = p; void _s; void _e;
  return { ...rest, chapters, minutes: Math.max(3, Math.round(words / 120 + (pauses * 3) / 60)) };
}

const BREATH_446 = `Let's begin with the breath. Breathe in slowly through your nose for a count of four. [pause] Hold gently for a count of four. [pause] And breathe out through your mouth for a count of six, letting the shoulders drop. [pause]
Again. In for four. [pause] Hold. [pause] Out for six, slow and smooth. [pause]
One more time, letting the out-breath be the longest part. [pause]
Now let the breath return to its own natural rhythm. There is nothing to do except notice it.`;

const PROGRESSIVE_INDUCTION = `Allow your eyes to close, or rest your gaze softly on a point in front of you. [pause]
Bring your attention to the top of your head, and imagine a wave of relaxation beginning there. Let it soften your forehead. The muscles around your eyes. Your jaw. Let your teeth part slightly. [pause]
The wave flows down through your neck and shoulders. Let them become heavy. Down through your arms, all the way to the tips of your fingers. [pause]
It moves through your chest, your stomach, your lower back. Each breath out carries a little more tension away. [pause]
Through your hips, your thighs, your knees, your calves, your feet. Your whole body is supported. Nothing needs your effort right now. [pause]
In a moment I will count down from ten to one. With each number, allow yourself to drift a little deeper into calm, focused attention. You remain aware and in control the whole time. You can open your eyes whenever you choose. [pause]
Ten. Nine. Letting go. Eight. Seven. Deeper and calmer. Six. Five. Four. Settling. Three. Two. One. [pause]
Here, in this calm and focused state, your mind is open to useful ideas.`;

export const SESSION_001: Programme = build({
  id: 'lm-001', title: 'The Architect of Your Reality', subtitle: 'The Limitless Mind — Session 001', category: 'Flagship',
  objective: 'Develop a mindset centred on knowledge acquisition, financial intelligence, discipline, creative thinking and execution.',
  intro: '', breathing: '', visualisation: '', script: '',
  suggestions: [],
  returnText: STANDARD_RETURN,
  reflection: [
    'Which part of the session felt most true for you, and why?',
    'What is one thing you will learn this week?',
    'What is one financial decision you will make more deliberately?',
    'What will you complete in the next 24 hours?',
  ],
  extraChapters: [
    { title: '1. Induction', text: `Welcome to The Limitless Mind, Session 001: The Architect of Your Reality.
Find a comfortable position where you will not be disturbed for the next twenty minutes. Do not listen to this while driving or operating anything that requires your attention. [pause]
${BREATH_446}
${PROGRESSIVE_INDUCTION}` },
    { title: '2. Reprogramming Your Identity', text: `Imagine you are standing at the entrance of a quiet, beautifully designed building. This is the place where you design your life. You are the architect here. [pause]
Step inside. Notice the calm. The light. The sense that everything here has been built with intention. [pause]
On a table in front of you are the plans for the person you have been. Look at them without judgement. Some parts were drawn by you. Some were drawn by circumstances, by other people, by old fears. [pause]
Every plan can be revised. An architect does not argue with an old drawing. They pick up a pencil and improve it. [pause]
Take a fresh sheet. Write across the top, in your own handwriting: I am someone who learns, builds and follows through. [pause]
You do not need to believe it completely yet. Identity is built by evidence, one action at a time. Each small promise you keep to yourself is a brick. Each lesson learned is a beam. Each finished task is a foundation stone. [pause]
Say silently to yourself: I build my identity through what I do each day. [pause]
I am patient with the process and serious about the work.` },
    { title: '3. Wealth Conditioning', text: `Now walk to a room in this building where the walls are lined with tools. This is the room of financial intelligence. [pause]
Here you understand something clearly. Wealth is not luck and it is not a feeling. It is the result of decisions repeated over time: earning, spending wisely, saving, investing thoughtfully and creating value for other people. [pause]
Notice how calm you feel when you look at your numbers honestly. There is power in knowing exactly where you stand. [pause]
See yourself checking your income and expenses each week, without fear, with curiosity. See yourself pausing before a purchase and asking: does this move me towards what I truly want? [pause]
Imagine the quiet confidence of having savings set aside. The freedom of choices that come from patience. [pause]
Notice that the most valuable asset in this room is not money. It is your ability to learn, to solve problems and to create something useful. That asset grows every time you use it. [pause]
Say silently: I make money decisions with clarity and patience. [pause]
I create value, and I manage what I earn with intelligence.` },
    { title: '4. Intellectual Expansion', text: `Now climb a staircase to the library at the top of the building. The shelves rise higher than you can see. Mathematics and physics. History and philosophy. Psychology, economics, technology and art. [pause]
You do not need to know everything. You only need to be the kind of person who keeps learning. [pause]
Choose a book. Notice how easily you open it, how naturally curiosity pulls you forward. Learning feels like exploring, not like a chore. [pause]
See lines of light connecting the books. Mathematics connects to engineering. Psychology connects to business. History connects to the decisions you will make tomorrow. Every idea you learn makes the next one easier to understand. [pause]
When something is difficult, you slow down, break it into parts and ask better questions. Confusion is simply the feeling of your mind growing. [pause]
Say silently: I am curious. I learn every day. [pause]
I connect ideas, and my understanding compounds over time.` },
    { title: '5. The Execution Identity', text: `Return to the main hall. In the centre is a large table with a single plan on it. This is something you want to build. A project, a goal, a better version of your life. [pause]
Look at it closely. Now see it broken into steps. Not one giant leap, but a clear path of small, achievable actions. [pause]
Notice the very first step. It is small. It is obvious. It can be done today. [pause]
See yourself doing it. You sit down, you remove distractions, and you begin before you feel ready. Motivation follows action. [pause]
When resistance appears, and it will, you notice it calmly, the way you would notice weather. You do the next step anyway. [pause]
At the end of the day you review what you did. You are honest about what worked and what did not. Then you plan tomorrow. [pause]
This is the rhythm of an architect: plan, build, review, improve. [pause]
Say silently: I start before I feel ready. [pause]
I finish what matters. [pause]
I build my vision one deliberate action at a time.` },
    { title: '6. Return', text: `Take a final look around the building you have designed. It will be here whenever you return. Every time you come back, it becomes a little clearer and a little stronger. [pause]
Before you leave, choose one action you will take in the next twenty-four hours. One thing to learn, one thing to improve financially, or one thing to complete. Hold it clearly in your mind. [pause]
${STANDARD_RETURN}
Before you move on, take a moment to write down the action you chose in your journal.` },
  ],
});

const P = (o: Omit<Programme, 'chapters' | 'minutes' | 'returnText'> & { script: string; returnText?: string }) =>
  build({ returnText: STANDARD_RETURN, ...o });

export const PROGRAMMES: Programme[] = [
  SESSION_001,
  P({ id: 'wealth-mindset', title: 'Wealth Mindset', category: 'Wealth Mindset',
    objective: 'Replace scarcity-driven money thinking with calm, long-term, value-creating habits of mind.',
    intro: 'This session explores your relationship with money. It does not promise riches. It helps you think about money more clearly, with less fear and more patience.',
    breathing: BREATH_446,
    script: `${PROGRESSIVE_INDUCTION}
Bring to mind an early memory about money. Perhaps something you heard as a child, or a feeling you had about it. Notice it, like watching a film. [pause]
Ask yourself: is this belief helping me today? If not, you can thank it for trying to protect you, and let it loosen its grip. [pause]
Now imagine money as a tool, like a hammer or a pen. Neither good nor bad. It amplifies the decisions of the person holding it. [pause]
See yourself holding it calmly, choosing deliberately, thinking in years rather than days.`,
    visualisation: `Picture a seed planted in rich soil. Each week you water it with a small saving or a wise decision. At first nothing seems to change. [pause] Months pass. A shoot appears. Years pass, and the seed has become a tree, with branches growing branches. This is compounding: patient, quiet, powerful. [pause] Notice how good it feels to be the person who planted it.`,
    suggestions: ['Money is a tool, and I use it deliberately.', 'I think in years, not moments.', 'I create value for others, and value returns to me over time.', 'I can look at my finances calmly and honestly.'],
    reflection: ['What belief about money did you notice?', 'Where did that belief come from?', 'What is one money habit you will practise this week?'] }),
  P({ id: 'financial-confidence', title: 'Financial Confidence', category: 'Financial Confidence',
    objective: 'Reduce anxiety around money and build the confidence to look at, plan and act on your finances.',
    intro: 'Many people avoid looking at their finances because it feels uncomfortable. This session helps you approach your numbers with calm curiosity.',
    breathing: `Place one hand on your chest and one on your stomach. Breathe in so the lower hand rises first. [pause] Breathe out slowly. [pause] Continue for five breaths, counting each out-breath. [pause]`,
    script: `${PROGRESSIVE_INDUCTION}
Imagine sitting at a clean, well-lit desk. In front of you is a simple sheet showing what comes in and what goes out. [pause]
Notice any tension that arises as you look at it. Breathe into it. The numbers are just information. Information is power. [pause]
See yourself making one small adjustment. Cancelling something you do not use. Moving a small amount into savings. Asking a question you have been avoiding. [pause]
Feel the relief of acting. Confidence does not come before action. It grows from it.`,
    visualisation: 'Picture yourself one year from now, opening your accounts and feeling steady. Not because everything is perfect, but because you know exactly where you stand and you have a plan. Notice your posture, your breathing, your face. [pause] Step into that version of yourself.',
    suggestions: ['Numbers are information, and information is power.', 'I can face my finances calmly.', 'Every small action builds my confidence.', 'I ask questions and learn what I need to know.'],
    reflection: ['What financial task have you been avoiding?', 'What is the smallest first step on it?', 'Who could you ask for good information?'] }),
  P({ id: 'discipline', title: 'Discipline and Consistency', category: 'Discipline and Consistency',
    objective: 'Strengthen your ability to keep commitments to yourself, especially when motivation is low.',
    intro: 'Discipline is not about being harsh with yourself. It is about keeping promises, starting small, and returning quickly after a slip.',
    breathing: BREATH_446,
    script: `${PROGRESSIVE_INDUCTION}
Think of a time you kept going even though you did not feel like it. Remember how you felt afterwards. [pause]
That feeling is available to you again. It is built from small, repeated actions. [pause]
Imagine a path made of stepping stones. Each stone is a day you kept a small promise. Some days the stones are large. Some days they are tiny. But the path continues. [pause]
If you step off the path, you simply step back on. No drama. No self-criticism. Just the next stone.`,
    visualisation: 'See yourself tomorrow morning at the moment you would normally hesitate. Watch yourself notice the hesitation, smile at it, and begin anyway. Two minutes in, it is easier. Ten minutes in, you are absorbed. [pause] Rehearse this three times.',
    suggestions: ['I keep small promises to myself.', 'I start before I feel ready.', 'When I slip, I return quickly and kindly.', 'Consistency matters more than intensity.'],
    reflection: ['What promise will you keep tomorrow?', 'What usually makes you hesitate?', 'How will you make the first two minutes easier?'] }),
  P({ id: 'concentration', title: 'Deep Concentration', category: 'Deep Concentration',
    objective: 'Train sustained, calm attention for deep work and study.',
    intro: 'Attention is a skill that improves with practice. Use this session before a focus block.',
    breathing: 'Breathe in for four, out for four, counting each full breath from one to ten. If you lose count, simply start again at one. Losing count and returning is the training. [pause] [pause] [pause]',
    script: `${PROGRESSIVE_INDUCTION}
Imagine a candle flame in a still room. Your attention rests on it. [pause]
When a thought appears, notice it like a gentle breeze. The flame flickers. Then it steadies again. [pause]
Each time you return to the flame, your focus grows stronger, like a muscle being trained. [pause]
Now imagine the task you are about to begin. See only the first part of it. Everything else can wait outside the door.`,
    visualisation: 'Picture a quiet room with one desk and one task. Your phone is in another room. A timer is set. See yourself working steadily, absorbed, time passing easily. [pause] When the timer ends, you look up, satisfied with the work done.',
    suggestions: ['My attention returns easily when it wanders.', 'One task at a time.', 'Distractions can wait.', 'Deep work feels calm and absorbing.'],
    reflection: ['What distracted you most recently, and how could you remove it?', 'What is the one task for your next focus block?'] }),
  P({ id: 'memory', title: 'Memory and Learning', category: 'Memory and Learning',
    objective: 'Prepare the mind for study and reinforce effective learning habits such as recall and review.',
    intro: 'Hypnosis does not give you a perfect memory. But a calm, curious state and good study habits genuinely help you learn.',
    breathing: BREATH_446,
    script: `${PROGRESSIVE_INDUCTION}
Imagine a palace with many rooms. Each room can store ideas you want to remember. [pause]
Walk into the first room. Place something you learned recently on a table there. Make it vivid: give it colour, size, even a sound. [pause]
Vivid images, stories and connections make memories stronger. You can use this palace any time. [pause]
Now see yourself closing your book and trying to recall what you just read before checking. Notice that the effort of remembering is what makes memory strong.`,
    visualisation: 'Picture a week of study. Each day you briefly review what you learned before. Each time, the memory feels a little firmer, like a path walked more often. [pause] See yourself explaining the topic easily to a friend.',
    suggestions: ['I learn with curiosity.', 'Recalling is how I remember.', 'I review a little and often.', 'I connect new ideas to what I already know.'],
    reflection: ['What will you study today?', 'How will you test yourself on it?', 'When will you review it again?'] }),
  P({ id: 'confidence', title: 'Confidence and Self-Belief', category: 'Confidence and Self-Belief',
    objective: 'Build grounded, evidence-based self-belief rather than empty positivity.',
    intro: 'Real confidence comes from evidence: things you have done, learned and survived. This session helps you collect that evidence.',
    breathing: BREATH_446,
    script: `${PROGRESSIVE_INDUCTION}
Bring to mind three moments when you handled something difficult. They do not need to be big. [pause]
Hold the first one. Notice what you did well. [pause] The second. [pause] The third. [pause]
These moments are proof. You are more capable than your doubts suggest. [pause]
Now picture a situation coming up that makes you nervous. See yourself preparing for it, walking in, standing tall, speaking clearly. Nerves may still be there. That is fine. Courage is acting with them.`,
    visualisation: 'Imagine a version of you who trusts themselves. Notice how they stand, breathe, speak. Step into their body for a moment. [pause] Bring that posture back with you.',
    suggestions: ['I have evidence of my capability.', 'I can feel nervous and act anyway.', 'I prepare well and trust my preparation.', 'My worth is not decided by one outcome.'],
    reflection: ['List three things you have done that prove your capability.', 'What situation will you approach differently?'] }),
  P({ id: 'creativity', title: 'Creative Intelligence', category: 'Creative Intelligence',
    objective: 'Relax rigid thinking and open space for new ideas and connections.',
    intro: 'Creativity often appears when the mind is relaxed. Keep a notebook nearby for ideas after this session.',
    breathing: 'Breathe naturally, and with each out-breath imagine a little space opening in your mind, like clouds parting. [pause] [pause] [pause]',
    script: `${PROGRESSIVE_INDUCTION}
Imagine a large, open studio full of materials. Paint, wood, wire, words, sounds. [pause]
Bring a problem you are working on into this studio. Set it on the table. [pause]
Now look at it from above. From below. From the eyes of a child. From the eyes of someone from a hundred years ago. From the eyes of a customer. [pause]
Combine it with something unrelated in the studio. What happens? Do not judge any ideas yet. Just notice them.`,
    visualisation: 'Picture ideas as sparks floating in the air. Reach out and catch a few. Notice that some are strange, some are funny, and one or two are surprisingly useful. [pause]',
    suggestions: ['I allow ideas to arrive without judgement.', 'I look at problems from many angles.', 'Quantity of ideas leads to quality.', 'I capture my ideas and develop the best ones.'],
    reflection: ['What ideas appeared?', 'Which one is worth testing?', 'What would a small experiment look like?'] }),
  P({ id: 'procrastination', title: 'Overcoming Procrastination', category: 'Overcoming Procrastination',
    objective: 'Reduce avoidance by making starting feel smaller, safer and more automatic.',
    intro: 'Procrastination is usually about avoiding an uncomfortable feeling, not about laziness. This session helps you get close to the task without the struggle.',
    breathing: BREATH_446,
    script: `${PROGRESSIVE_INDUCTION}
Think of the task you have been putting off. Notice the feeling it brings. Where is it in your body? [pause]
Breathe into that place. Name the feeling: boredom, fear, confusion, overwhelm. Naming it softens it. [pause]
Now shrink the task. Smaller. Smaller. Until it is just the very first physical action. Opening a file. Writing one sentence. Making one call. [pause]
See yourself doing only that. It takes less than two minutes. And then, often, you continue.`,
    visualisation: 'Picture the end of today, with the task started. Notice the relief, the lightness, the respect you feel for yourself. [pause] Now rewind to this moment and choose the first action.',
    suggestions: ['I make the first step tiny.', 'I start for just two minutes.', 'Feelings pass when I act.', 'Done is better than perfect.'],
    reflection: ['What task have you been avoiding?', 'What feeling does it bring?', 'What is the two-minute first action?'] }),
  P({ id: 'entrepreneur', title: 'Entrepreneurial Thinking', category: 'Entrepreneurial Thinking',
    objective: 'Cultivate opportunity-spotting, customer focus and tolerance for experimentation.',
    intro: 'Entrepreneurs notice problems, care about people who have them and test solutions quickly. This session strengthens that way of seeing.',
    breathing: BREATH_446,
    script: `${PROGRESSIVE_INDUCTION}
Imagine walking through an ordinary day. Notice small frustrations: a queue, a confusing form, a wasted hour. [pause]
Each frustration is a signal. Somewhere, someone would pay to make it go away. [pause]
Choose one. Picture the people who experience it. What do they want? What do they currently do? [pause]
Now imagine a tiny test: a conversation, a simple page, a handmade first version. You learn quickly and cheaply. Failure here is just information.`,
    visualisation: 'See yourself talking to a potential customer, listening more than speaking. Notice their words. Notice what they care about. [pause] Imagine the first person paying for something you built. Feel what that teaches you.',
    suggestions: ['I notice problems worth solving.', 'I listen to customers before I build.', 'I test ideas small and fast.', 'I learn from every result.'],
    reflection: ['What problem did you notice?', 'Who has it?', 'What is the cheapest test of a solution?'] }),
  P({ id: 'resilience', title: 'Emotional Resilience', category: 'Emotional Resilience',
    objective: 'Build the capacity to experience setbacks and strong emotions without being overwhelmed.',
    intro: 'Resilience is not about never feeling bad. It is about recovering, learning and continuing. If you are struggling seriously, please also reach out to a qualified professional.',
    breathing: 'Breathe in for four, and out for eight. The long out-breath calms the nervous system. [pause] Continue for six breaths. [pause] [pause] [pause]',
    script: `${PROGRESSIVE_INDUCTION}
Imagine you are a tall tree in a storm. The wind bends your branches. Leaves fall. But your roots go deep. [pause]
Bring to mind a recent difficulty. Let yourself feel it, just a little. Notice that you can feel it and still be here, breathing, steady. [pause]
Emotions are weather. They arrive, they peak and they pass. [pause]
Ask: what is within my control here? What can I learn? What is one kind thing I can do for myself today?`,
    visualisation: 'Picture the storm passing. The sky clearing. The tree still standing, perhaps a little stronger, its roots a little deeper. [pause]',
    suggestions: ['I can feel difficult emotions and stay steady.', 'This will pass.', 'I focus on what I can control.', 'I treat myself with the kindness I would show a friend.'],
    reflection: ['What difficulty came up?', 'What is in your control?', 'What support could you ask for?'] }),
  P({ id: 'sleep', title: 'Sleep and Relaxation', category: 'Sleep and Relaxation',
    objective: 'Wind down the body and mind before sleep.',
    intro: 'Listen to this in bed with the lights low. You can set the sleep timer so playback stops on its own. This session ends without waking you up.',
    breathing: 'Breathe in gently for four. [pause] And out for seven, slow and soft. [pause] Again. [pause] And again. Let each breath be slower than the last. [pause]',
    script: `${PROGRESSIVE_INDUCTION}
Imagine lying in a warm, safe place. Perhaps a cabin with rain on the roof. [pause]
Every thought from today can be placed in a box by the door. You can collect it tomorrow if you need it. [pause]
Notice your body becoming heavier. Warmer. Sinking into the bed. [pause]
There is nothing left to do today. Nothing to solve. Only rest.`,
    visualisation: 'Picture a slow, dark ocean under the stars. Waves rolling in and out with your breathing. In. And out. [pause] [pause] Each wave carries you a little further towards sleep. [pause] [pause]',
    suggestions: ['My body knows how to rest.', 'Today is complete.', 'I let go.', 'Sleep comes naturally.'],
    returnText: 'Now you can stay in this peaceful state and drift into natural, restful sleep. If you need to wake up for any reason, you will wake easily and alert. [pause] [pause] Sleep well.',
    reflection: ['How did you sleep?', 'What helped you wind down?'] }),
  P({ id: 'visualisation', title: 'Goal Visualisation', category: 'Goal Visualisation',
    objective: 'Clarify a goal and mentally rehearse both the outcome and the obstacles on the way.',
    intro: 'Research suggests that imagining only success can reduce effort. This session uses mental contrasting: imagine the outcome, then the obstacles, then your plan.',
    breathing: BREATH_446,
    script: `${PROGRESSIVE_INDUCTION}
Bring one goal to mind. Make it specific. [pause]
Imagine it achieved. What do you see? Hear? Feel? Who is with you? [pause]
Now, honestly, picture the main obstacle inside you. Not the world, but your own habit, fear or pattern that could get in the way. [pause]
Make a plan: if that obstacle appears, then I will... Complete the sentence. [pause]
Rehearse it. The obstacle arrives. You notice it. You follow your plan.`,
    visualisation: 'See the path from today to the goal as a series of milestones. Walk the first one in detail. See the date, the place, the action. [pause]',
    suggestions: ['I see my goal clearly.', 'I plan for my obstacles.', 'If the obstacle appears, I follow my plan.', 'Every milestone brings me closer.'],
    reflection: ['What is your goal?', 'What is your main inner obstacle?', 'Write your if-then plan.'] }),
];

export const CATEGORIES = Array.from(new Set(PROGRAMMES.map((p) => p.category)));
export const getProgramme = (id: string) => PROGRAMMES.find((p) => p.id === id);
