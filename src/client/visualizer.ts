export function createVisualizer(
  canvas: HTMLCanvasElement,
  audio: HTMLAudioElement,
): { connect: () => void; stop: () => void } {
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) {
    return { connect() {}, stop() {} };
  }
  const ctx: CanvasRenderingContext2D = maybeCtx;

  let audioCtx: AudioContext | undefined;
  let analyser: AnalyserNode | undefined;
  let data: Uint8Array<ArrayBuffer> | undefined;
  let frame = 0;
  let connected = false;

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  function connect(): void {
    if (connected) {
      void audioCtx?.resume();
      return;
    }
    connected = true;
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;
    data = new Uint8Array(analyser.frequencyBinCount);
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    void audioCtx.resume();
    draw();
  }

  function draw(): void {
    frame = window.requestAnimationFrame(draw);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    if (analyser && data) {
      analyser.getByteFrequencyData(data);
    }

    const bins = data ?? new Uint8Array(64);
    const barCount = 48;
    const gap = 4;
    const barWidth = (width * 0.55) / barCount - gap;
    const originX = (width - (barCount * (barWidth + gap) - gap)) / 2;
    const baseY = height * 0.72;

    let energy = 0;
    for (let i = 0; i < barCount; i += 1) {
      const sample = bins[i] ?? 0;
      energy += sample;
      const barHeight = 8 + (sample / 255) * height * 0.22;
      const x = originX + i * (barWidth + gap);
      const gradient = ctx.createLinearGradient(x, baseY - barHeight, x, baseY);
      gradient.addColorStop(0, "rgba(232, 184, 109, 0.95)");
      gradient.addColorStop(1, "rgba(232, 184, 109, 0.15)");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
    }

    const glow = 0.08 + (energy / (barCount * 255)) * 0.25;
    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.42,
      20,
      width / 2,
      height * 0.42,
      width * 0.45,
    );
    radial.addColorStop(0, `rgba(232, 184, 109, ${glow})`);
    radial.addColorStop(1, "rgba(232, 184, 109, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }

  function stop(): void {
    window.cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
    void audioCtx?.close();
  }

  draw();

  return { connect, stop };
}
