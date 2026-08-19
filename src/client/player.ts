export type StationStatus = {
  id: string;
  name: string;
  title: string;
  audioUrl: string;
  durationSeconds: number;
  positionSeconds: number;
};

const DRIFT_SECONDS = 1.5;
const RESYNC_MS = 30_000;

function waitFor(audio: HTMLAudioElement, event: keyof HTMLMediaElementEventMap): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Audio failed to load"));
    };
    const cleanup = () => {
      audio.removeEventListener(event, onSuccess);
      audio.removeEventListener("error", onError);
    };
    audio.addEventListener(event, onSuccess, { once: true });
    audio.addEventListener("error", onError, { once: true });
  });
}

export function expectedPosition(durationSeconds: number, nowMs = Date.now()): number {
  if (durationSeconds <= 0) {
    return 0;
  }
  return (nowMs / 1000) % durationSeconds;
}

export function createPlayer(audio: HTMLAudioElement) {
  audio.loop = true;
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audio.volume = 0.8;

  let durationSeconds = 7200;
  let resyncTimer = 0;

  function mediaDuration(): number {
    return Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : durationSeconds;
  }

  function seekLive(): void {
    const live = expectedPosition(durationSeconds);
    const fileDuration = mediaDuration();
    audio.currentTime = live % fileDuration;
  }

  function startResync(): void {
    stopResync();
    resyncTimer = window.setInterval(() => {
      if (audio.paused) {
        return;
      }
      const live = expectedPosition(durationSeconds) % mediaDuration();
      if (Math.abs(audio.currentTime - live) > DRIFT_SECONDS) {
        audio.currentTime = live;
      }
    }, RESYNC_MS);
  }

  function stopResync(): void {
    if (resyncTimer) {
      window.clearInterval(resyncTimer);
      resyncTimer = 0;
    }
  }

  audio.addEventListener("ended", () => {
    seekLive();
    void audio.play();
  });

  async function load(station: StationStatus): Promise<void> {
    durationSeconds = station.durationSeconds;
    const nextSrc = new URL(station.audioUrl, window.location.href).href;
    if (audio.src !== nextSrc) {
      audio.src = station.audioUrl;
    }
    if (audio.readyState < HTMLMediaElement.HAVE_METADATA) {
      await waitFor(audio, "loadedmetadata");
    }
  }

  function playLive(): Promise<void> {
    seekLive();
    startResync();
    return audio.play();
  }

  return {
    get durationSeconds() {
      return durationSeconds;
    },
    load,
    playLive,
    async join(station: StationStatus): Promise<void> {
      await load(station);
      await playLive();
    },
    toggle(): void {
      if (audio.paused) {
        seekLive();
        void audio.play();
        startResync();
        return;
      }
      audio.pause();
      stopResync();
    },
    setVolume(value: number): void {
      audio.volume = Math.min(1, Math.max(0, value));
    },
    destroy(): void {
      stopResync();
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
  };
}
