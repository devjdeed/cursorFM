export const TIPS: string[] = [
  "Agent builds. Ask reads. Don't hunt in write mode.",
  "Big or fuzzy? Open Plan. Build only when the plan is yours.",
  "If the build went sideways, revert to the plan — don't patch it with follow-ups.",
  "Reproducible bug, no idea why: Debug Mode. Do the repro it asks for.",
  "New task, new chat. Modes don't share context anyway.",
  '@ the file you know. Skip the whole tree "just in case."',
  "Error already in a terminal? @Terminals it. Don't paste the wall.",
  "Paste the screenshot. Don't describe the red squiggle.",
  "Tab for the next line. Inline edit for this selection. Agent for the rest.",
  "Agent already applied the diff. Reject what you don't want.",
  "Checkpoints undo Agent. Git is still the real history.",
  "Same mistake twice? Make a Project Rule. Don't re-lecture it.",
  "Rules are constraints. Skills are playbooks. Keep SKILL.md short.",
  "Unused MCP servers sit in the context window. Turn off what you aren't using.",
  "Cloud Agents don't see dirty files. Commit or stash before Move to Cloud.",
  "Parallel agents need worktrees. Same checkout is a collision.",
  "Steer with Send now. Don't kill a run for a small redirect.",
  "Watch the context ring. When it fills, older turns get compressed.",
  "How to run this repo belongs in AGENTS.md. Point at files — don't paste them.",
  "Bugbot reads .cursor/BUGBOT.md, not your Project Rules.",
  "Design Mode: click the UI instead of describing the padding.",
  "Lead with what done looks like. Skip the tour of the repo.",
  "Don't always-apply every rule. That's a context tax every turn.",
  "Verify before you merge: tests, Browser, or /review-bugbot.",
  "Queue with Enter. Don't interrupt a tool call you still need.",
  "User Rules don't reach Tab or inline edit. Say it in that prompt.",
  "@ the working diff when the uncommitted change is the task.",
  "Faster model for the small edit. Stronger model for the architecture.",
  "Don't dump style guides into rules. Point at a canonical file and let the linter work.",
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
