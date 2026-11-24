import{a5 as d}from"./index-4hNCAP3s.js";const s=`_Demo mode: no AI model is connected, so this is a rule-based response. Connect the AI backend (see Settings → AI) for real conversations._

`,m=[[/(get rich quick|overnight|guaranteed? (returns?|profit|income)|double my money|passive income fast)/i,"I want to challenge one assumption: there is no reliable way to get guaranteed or very fast returns. Anything promising that usually carries high risk or is a scam. Durable wealth tends to come from income you can grow, a savings rate you keep, diversified long-term investing and businesses that solve real problems."],[/\b(always|never|everyone|no one|impossible)\b/i,'You used an absolute ("always", "never", "impossible"). Absolutes are rarely true. Try restating it as "sometimes" or "so far" and see whether the problem looks more solvable.'],[/(unlimited|limitless) (intelligence|iq)|control (people|others|minds)/i,"Honest note: no practice gives unlimited intelligence or control over other people. What you can build is skill, knowledge, judgment and influence through clear communication, and those compound."],[/(quit my job|all in|bet everything|max out|loan to invest)/i,"Before an all-in move, test cheaply: what is the smallest experiment that would show whether this works? Keep a runway of several months of expenses and avoid borrowing to speculate."]],p=[{re:/procrastinat|motivat|lazy|can't start|cant start/i,reply:`**Procrastination is usually avoidance of a feeling, not a time problem.**

1. Name the feeling the task triggers (boredom, fear of judgement, confusion).
2. Shrink the first step until it feels almost too easy: "open the document and write one ugly sentence".
3. Use an implementation intention: "At 9:00, at my desk, I will do X for 25 minutes."
4. Start a focus timer in **Mind Training → Focus** and log what happened.

What is the specific task you are avoiding, and what is the very first physical action?`},{re:/goal|plan|priorit|focus on/i,reply:`**Turning an intention into a plan**

- **Outcome:** what exactly will be true when this is done? Make it measurable.
- **Deadline:** pick a real date. Then ask whether it is realistic given your available hours.
- **Milestones:** 3–5 checkpoints, each verifiable.
- **Next action:** the one task you can do in the next 24 hours.
- **Constraint:** what is most likely to stop you? Plan for it now.

Use **Goals & Execution → Idea to Reality** to structure this. Which of these is hardest to answer right now?`},{re:/money|wealth|invest|save|budget|debt|income|financ/i,reply:`**Practical wealth sequence (educational, not financial advice)**

1. Know your numbers: track income and spending for 30 days in **Wealth Lab → Dashboard**.
2. Build a cash buffer before taking investment risk.
3. Clear high-interest debt; it is a guaranteed negative return.
4. Automate a savings rate you can sustain, then raise it with each pay rise.
5. Long-term investing: low-cost, diversified, time in the market over timing it.
6. Grow earning power: skills and businesses that solve valuable problems.

Which step are you on, and what is the number you are least sure about?`},{re:/business|startup|idea|customer|product|sell|market/i,reply:`**Validate before you build**

- Who has the problem, specifically? Could you name 10 of them?
- How do they solve it today, and what does that cost them?
- Would they pay? The only reliable evidence is a pre-order, deposit or signed letter of intent.
- What is the smallest version you could sell within 30 days?

Talk to five potential customers this week and record what you hear in your Journal (type: Business concept).`},{re:/learn|study|remember|memor|exam|understand/i,reply:`**Evidence-based learning**

- **Active recall:** close the book and write what you remember before re-reading.
- **Spaced repetition:** review just before you forget; the Flashcards in **Mind Training → Memory** schedule this for you.
- **Interleaving:** mix related topics instead of blocking one.
- **Elaboration:** explain *why* and *how*, connecting to what you know (see **Connect the Knowledge**).
- **Teach it:** explain it simply to someone else, or to your journal.

What subject are you working on?`},{re:/anx|stress|overwhelm|sad|depress|panic|burn ?out/i,reply:`That sounds heavy. A few things that often help in the moment: slow exhale breathing (in for 4, out for 6–8) for two minutes, writing down everything on your mind, then picking one small next step.

If these feelings are persistent, intense, or you feel unsafe, please speak to a doctor, a licensed therapist, or a local crisis line. This app is a self-development tool, not a substitute for professional care.`}];function y(t){var n;return((n=[...t].reverse().find(i=>i.role==="user"))==null?void 0:n.content)||""}function f(t,n,i){const o=y(n);if(t==="tutor"){const e=d(o).slice(0,2);if(e.length){const c=e.map(a=>`**${a.title}** (${a.subjectName}, ${a.level})

${a.explanation}

_Example:_ ${a.example}`).join(`

---

`);return{demo:!0,text:s+`Here is what the built-in library says on this:

`+c+`

Open the lesson for exercises and a quiz.`}}return{demo:!0,text:s+`I couldn't find "${o}" in the built-in lessons. Try a simpler keyword (for example "compound interest", "entropy", "neural network"), or connect the AI backend for open-ended tutoring.`}}if(t==="plan"){const e=i.idea||o;return{demo:!0,text:JSON.stringify({steps:[{stage:"research",title:`Write down who "${e.slice(0,60)}" is for and what problem it solves`},{stage:"research",title:"List 3 existing alternatives and what they cost"},{stage:"validation",title:"Speak to 5 people in the target audience and record their answers"},{stage:"validation",title:"Define the evidence that would make you stop or continue"},{stage:"planning",title:"Define the smallest useful first version"},{stage:"planning",title:"Set a deadline and 3 milestones"},{stage:"execution",title:"Block 3 focus sessions this week for the first milestone"},{stage:"review",title:"Review results against your evidence criteria"}]})}}if(t==="reflect")return{demo:!0,text:s+`**Reflection prompts** (questions, not interpretations):

- What feeling was strongest here, and where else in your life does it show up?
- What is one fact in this entry, and one assumption you might be making?
- If a friend wrote this, what would you suggest to them?
- What is one small action this points to?

_Any meaning you find is your own exploration, not an established fact. Dream content in particular has no scientifically established fixed meanings._`};const l=m.filter(([e])=>e.test(o)).map(([,e])=>e),u=p.find(e=>e.re.test(o));let r=s;return l.length&&(r+=l.map(e=>"> "+e).join(`

`)+`

`),r+=u?u.reply:`I can help with learning, goals, money education, business ideas, discipline and reflection. To give you something useful, tell me:

1. What you are trying to achieve, in one sentence.
2. What you have already tried.
3. What is getting in the way.

The more specific you are, the more practical the next step.`,{demo:!0,text:r}}let h="unknown";const w=()=>h;async function b(t,n,i={}){return h="demo",f(t,n,i)}function v(t){const n=t.match(/\{[\s\S]*\}/);if(!n)return null;try{return JSON.parse(n[0])}catch{return null}}export{b as a,w as b,v as e};
