const SCENES = [
  "/Club Night.html",
  "/Night Surf.html",
  "/Night Studio.html",
  "/Game Night.html",
];

const INTERVAL_MS = 2 * 60 * 1000;
const PRELOAD_MS = 10 * 1000;
const UNPACK_MS = 2000;
const FADE_MS = 600;
const CHROME_STYLE = `[data-omelette-chrome]{display:none!important}#__bundler_loading,#__bundler_err{display:none!important}`;

export function startSceneLoop(stage: HTMLElement): void {
  let index = 0;
  let current: HTMLIFrameElement | undefined;
  let nextPromise: Promise<HTMLIFrameElement> | undefined;
  let swapTimer = 0;
  let preloadTimer = 0;

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

  function createFrame(src: string): HTMLIFrameElement {
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.setAttribute("title", "Station visual");
    frame.setAttribute("aria-hidden", "true");
    stage.appendChild(frame);
    hideSceneChrome(frame);
    return frame;
  }

  function waitForLoad(frame: HTMLIFrameElement): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        window.setTimeout(resolve, UNPACK_MS);
      };
      frame.addEventListener("load", done, { once: true });
    });
  }

  async function mount(i: number): Promise<HTMLIFrameElement> {
    const frame = createFrame(srcFor(i));
    await waitForLoad(frame);
    return frame;
  }

  function unload(frame: HTMLIFrameElement | undefined): void {
    if (!frame) {
      return;
    }
    frame.classList.remove("is-active");
    window.setTimeout(() => {
      frame.remove();
    }, FADE_MS);
  }

  function schedule(): void {
    window.clearTimeout(swapTimer);
    window.clearTimeout(preloadTimer);
    preloadTimer = window.setTimeout(() => {
      void preloadNext();
    }, Math.max(0, INTERVAL_MS - PRELOAD_MS));
    swapTimer = window.setTimeout(() => {
      void swap();
    }, INTERVAL_MS);
  }

  function preloadNext(): void {
    if (nextPromise) {
      return;
    }
    nextPromise = mount((index + 1) % SCENES.length);
  }

  async function swap(): Promise<void> {
    const nextIndex = (index + 1) % SCENES.length;
    if (!nextPromise) {
      nextPromise = mount(nextIndex);
    }
    const incoming = await nextPromise;
    const outgoing = current;
    current = incoming;
    nextPromise = undefined;
    index = nextIndex;
    current.classList.add("is-active");
    unload(outgoing);
    schedule();
  }

  void mount(0).then((frame) => {
    current = frame;
    frame.classList.add("is-active");
    schedule();
  });
}
