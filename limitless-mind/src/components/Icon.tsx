import * as I from 'lucide-react';
const MAP: Record<string, I.LucideIcon> = {
  Sigma: I.Sigma, Atom: I.Atom, Orbit: I.Orbit, BrainCircuit: I.BrainCircuit, Binary: I.Binary, Cog: I.Cog, Scale: I.Scale,
  Landmark: I.Landmark, Rocket: I.Rocket, Brain: I.Brain, Activity: I.Activity, Lamp: I.Lamp, ScrollText: I.ScrollText,
  Telescope: I.Telescope, Dna: I.Dna, FlaskConical: I.FlaskConical, MessagesSquare: I.MessagesSquare, Megaphone: I.Megaphone,
  Cpu: I.Cpu, Palette: I.Palette,
};
export function SubjectIcon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  const C = MAP[name] || I.BookOpen; return <C className={className} />;
}
