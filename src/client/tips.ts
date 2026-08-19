export const TIPS: string[] = [
  "Lead with the outcome: what done looks like, in one sentence.",
  "Name the files. Don't make the agent hunt.",
  "One job per prompt. Split refactors from features.",
  "Say what not to change. Negative scope is high leverage.",
  "Point at the grain of this repo: vanilla TS, overlay, not the iframes.",
  "If you care about the approach, pick it. Don't leave 50/50 product calls.",
  'Ban drive-by restyles. "Match Live/mute glass" beats "make it nice."',
  "No new dependencies unless you ask for one.",
  "Don't ask it to commit, push, or deploy unless you mean it.",
  'Tell it when to stop: "do not edit files" for explain-only work.',
  "Put the test in the prompt: a click, a string, a screen state.",
  '"When this works, I should be able to…" is a better closer than "make sure it works."',
  "Ask for the smallest change that proves the idea.",
  'Skip "act as a senior engineer." Spend tokens on this codebase.',
  'Prefer verbs it can run: implement, extract, wire, fix. Avoid "elevate."',
  'Specific beats vibe. "Hide the hero after Play" beats "improve the UI."',
  'For big work: "propose a plan, don\'t edit until I say go."',
  "For small work: paste a brief and let it run. Don't over-stage.",
  "Paste the error, the file path, and what you already tried.",
  "If the first pass drifted, reply with the constraint it missed — don't restart from zero.",
  'Point at existing patterns. "Do it like mute in style.css" is a design system.',
  "Quote the behavior you want to keep. Agents optimize for visible diffs.",
  'Ask for a map first: "which files own live offset?" then implement.',
  'Explain-only prompts should say "do not edit files" in the first line.',
  "When debugging, describe the symptom and the last working state.",
  "Don't outsource taste. If amber vs red matters, say amber.",
  "One visual system: if the overlay is a pill, the next control is a pill.",
  "Constraints travel better than adjectives.",
];

function shuffle<T>(items: T[]): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = next[i];
    const swap = next[j];
    if (current === undefined || swap === undefined) {
      continue;
    }
    next[i] = swap;
    next[j] = current;
  }
  return next;
}

export function createTipBag(tips: readonly string[] = TIPS) {
  let bag: string[] = [];
  let last: string | undefined;

  function refill(): void {
    bag = shuffle([...tips]);
    if (bag.length > 1 && bag[bag.length - 1] === last) {
      const swapAt = Math.floor(Math.random() * (bag.length - 1));
      const end = bag[bag.length - 1];
      const other = bag[swapAt];
      if (end !== undefined && other !== undefined) {
        bag[bag.length - 1] = other;
        bag[swapAt] = end;
      }
    }
  }

  function nextTip(): string {
    if (bag.length === 0) {
      refill();
    }
    const tip = bag.pop() ?? tips[0] ?? "";
    last = tip;
    return tip;
  }

  return { nextTip };
}
