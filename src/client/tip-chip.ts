import { createTipBag } from "./tips";

const INTERVAL_MS = 20_000;

let started = false;

export function startTipChip(): void {
  if (started) {
    return;
  }

  const text = document.querySelector("#tip-text");
  const skip = document.querySelector("#tip-skip");
  if (!(text instanceof HTMLElement) || !(skip instanceof HTMLButtonElement)) {
    return;
  }

  started = true;
  const bag = createTipBag();
  const label = text;
  let timer = 0;

  function draw(): void {
    label.textContent = bag.nextTip();
  }

  function stopTimer(): void {
    if (timer) {
      window.clearInterval(timer);
      timer = 0;
    }
  }

  function startTimer(): void {
    stopTimer();
    if (document.visibilityState === "hidden") {
      return;
    }
    timer = window.setInterval(() => {
      draw();
    }, INTERVAL_MS);
  }

  skip.addEventListener("click", () => {
    draw();
    startTimer();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopTimer();
      return;
    }
    startTimer();
  });

  draw();
  startTimer();
}
