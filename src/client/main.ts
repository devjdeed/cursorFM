import { createPlayer, type StationStatus } from "./player";
import { startSceneLoop } from "./scenes";
import { startTipChip } from "./tip-chip";
import "./style.css";

const audio = document.querySelector("#mix") as HTMLAudioElement;
const stage = document.querySelector("#stage") as HTMLElement;
const gate = document.querySelector("#gate") as HTMLButtonElement;
const mute = document.querySelector("#mute") as HTMLButtonElement;
const statusEl = document.querySelector("#status") as HTMLElement;
const shell = document.querySelector("#shell") as HTMLElement;

const player = createPlayer(audio);
startSceneLoop(stage);

let station: StationStatus | undefined;
let loadPromise: Promise<void> | undefined;

function goLive(): void {
  shell.classList.add("is-live");
  statusEl.textContent = "";
  startTipChip();
}

async function preload(): Promise<void> {
  statusEl.textContent = "Tuning in…";
  const response = await fetch("/api/station");
  if (!response.ok) {
    throw new Error("Station is offline");
  }
  station = (await response.json()) as StationStatus;
  await player.load(station);
  statusEl.textContent = "Press play to join the station";
}

function startFromGesture(): void {
  gate.disabled = true;
  const ready = loadPromise ?? preload();
  loadPromise = ready;
  void ready
    .then(() => player.playLive())
    .then(() => {
      goLive();
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not start";
      statusEl.textContent = message;
      gate.disabled = false;
    });
}

function setMuted(muted: boolean): void {
  audio.muted = muted;
  mute.classList.toggle("is-muted", muted);
  mute.setAttribute("aria-pressed", muted ? "true" : "false");
  mute.setAttribute("aria-label", muted ? "Unmute" : "Mute");
}

gate.addEventListener("click", () => {
  startFromGesture();
});

mute.addEventListener("click", () => {
  setMuted(!audio.muted);
});

loadPromise = preload().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Station is offline";
  statusEl.textContent = message;
});
