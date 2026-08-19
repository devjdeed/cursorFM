const SCENES = [
  "/Club Night.html",
  "/Night Surf.html",
  "/Night Studio.html",
  "/Game Night.html",
];

const INTERVAL_MS = 2 * 60 * 1000;
const FADE_MS = 600;
const UNPACK_TIMEOUT_MS = 30_000;
const CHROME_STYLE = `[data-omelette-chrome]{display:none!important}#__bundler_loading,#__bundler_err{display:none!important}`;

export function startSceneLoop(stage: HTMLElement): void {
  const frames: HTMLIFrameElement[] = [];
  let index = 0;
  let swapTimer = 0;

  function srcFor(i: number): string {
    return encodeURI(SCENES[i % SCENES.length]);
  }

  function hideSceneChrome(frame: HTMLIFrameElement): void {
    const started = Date.now();
    const tick = (): void => {
      if (!frame.isConnected) {
        return;
      }
      const doc = frame.contentDocument;
      if (doc) {
        let style = doc.getElementById("fm-hide-chrome");
        if (!style) {
          style = doc.createElement("style");
          style.id = "fm-hide-chrome";
          style.textContent = CHROME_STYLE;
          (doc.head ?? doc.documentElement).appendChild(style);
        }
        if (doc.querySelector("[data-omelette-chrome], [data-om-starter]")) {
          return;
        }
      }
      if (Date.now() - started < 15_000) {
        window.setTimeout(tick, 200);
      }
    };
    tick();
  }

  function createFrame(src: string, priority: "high" | "low"): HTMLIFrameElement {
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.setAttribute("title", "Station visual");
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("fetchpriority", priority);
    frame.loading = "eager";
    stage.appendChild(frame);
    hideSceneChrome(frame);
    return frame;
  }

  function isSceneDocument(frame: HTMLIFrameElement): boolean {
    try {
      return /\.html$/i.test(frame.contentWindow?.location.pathname ?? "");
    } catch {
      return false;
    }
  }

  function isUnpacked(frame: HTMLIFrameElement): boolean {
    const doc = frame.contentDocument;
    if (!isSceneDocument(frame) || !doc?.body) {
      return false;
    }
    return !doc.getElementById("__bundler_thumbnail") && !doc.getElementById("__bundler_loading");
  }

  function waitUntilUnpacked(frame: HTMLIFrameElement): Promise<void> {
    return new Promise((resolve) => {
      const started = Date.now();
      let settled = false;
      const finish = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        frame.removeEventListener("load", tick);
        resolve();
      };
      const tick = (): void => {
        if (!frame.isConnected || isUnpacked(frame) || Date.now() - started > UNPACK_TIMEOUT_MS) {
          finish();
          return;
        }
        window.setTimeout(tick, 50);
      };
      frame.addEventListener("load", tick);
      tick();
    });
  }

  function waitForIdle(): Promise<void> {
    return new Promise((resolve) => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        ric(() => resolve(), { timeout: 1500 });
        return;
      }
      window.setTimeout(resolve, 200);
    });
  }

  function createLoader(): { set: (value: number) => void; done: () => void } {
    const el = stage.querySelector(".stage-loader") as HTMLElement | null;
    const fill = el?.querySelector(".stage-loader-fill") as HTMLElement | null;
    let target = 0;

    function paint(value: number): void {
      if (!fill || !el) {
        return;
      }
      el.classList.add("is-held");
      fill.style.transform = `scaleX(${value})`;
    }

    return {
      set(value: number) {
        target = Math.max(target, Math.min(1, value));
        paint(target);
      },
      done() {
        if (stage.classList.contains("has-scene")) {
          return;
        }
        paint(1);
        stage.classList.add("has-scene");
        window.setTimeout(() => {
          el?.remove();
        }, FADE_MS);
      },
    };
  }

  function schedule(): void {
    window.clearTimeout(swapTimer);
    swapTimer = window.setTimeout(() => {
      void swap();
    }, INTERVAL_MS);
  }

  async function swap(): Promise<void> {
    const nextIndex = (index + 1) % SCENES.length;
    const incoming = frames[nextIndex];
    const outgoing = frames[index];
    if (incoming) {
      await waitUntilUnpacked(incoming);
      incoming.classList.add("is-active");
    }
    outgoing?.classList.remove("is-active");
    index = nextIndex;
    schedule();
  }

  async function boot(): Promise<void> {
    const loader = createLoader();

    const first = createFrame(srcFor(0), "high");
    frames[0] = first;

    const markHtmlArrived = (): void => {
      if (isSceneDocument(first)) {
        loader.set(0.58);
        return;
      }
      first.addEventListener("load", markHtmlArrived, { once: true });
    };
    first.addEventListener("load", markHtmlArrived, { once: true });
    if (isSceneDocument(first)) {
      loader.set(0.58);
    }

    await waitUntilUnpacked(first);
    loader.done();
    first.classList.add("is-active");
    schedule();

    for (let i = 1; i < SCENES.length; i += 1) {
      await waitForIdle();
      const frame = createFrame(srcFor(i), "low");
      frames[i] = frame;
      await waitUntilUnpacked(frame);
    }
  }

  void boot();
}
