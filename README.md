# Cursor FM

A single-channel study radio: one looping mix, a shared station clock, and a visual that rotates through four scenes. Hosted on Cloudflare Workers.

Everyone who hits Play lands at the same offset in the mix (`now % duration`). There is no live encoder.

The visual layer is four self-contained HTML scenes in `public/`:

1. Club Night
2. Night Surf
3. Night Studio
4. Game Night

Each scene fills the viewport for **2 minutes**, then the next one fades in. After Play, title chrome hides; Live and mute stay as a small overlay.

## Local

```bash
npm install
npm run dev
```

Open the printed local URL and press Play.

The station mix is `public/merged-audio.mp3` (~20.6 minutes). `wrangler.jsonc` points at that file:

```jsonc
"AUDIO_PUBLIC_URL": "/merged-audio.mp3",
"DURATION_SECONDS": "1236"
```

`DURATION_SECONDS` must match the file length (`ffprobe`). Local `.dev.vars` overrides these values and is gitignored.

`npm run make-dev-mix` still generates a 30-second placeholder (`public/dev-mix.m4a` or `.wav`) if you need a tiny stand-in. Point `.dev.vars` at it and set `DURATION_SECONDS=30`. Placeholder audio is gitignored.

## Swap the mix

Use a constant-bitrate file so seeking stays accurate. Example AAC:

```bash
ffmpeg -i your-mix.wav -c:a aac -b:a 128k -movflags +faststart mix.m4a
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 mix.m4a
```

Then set `AUDIO_PUBLIC_URL` and `DURATION_SECONDS` in `wrangler.jsonc` (and `.dev.vars` for local). Restart the dev server after changing `.dev.vars`.

## Production audio (R2)

`public/merged-audio.mp3` is about **47 MB**. Worker static assets cap individual files around 25 MiB, so do not ship the mix as a Vite/`public/` asset. Upload it to the `cursorfm-audio` bucket. Use `--remote` or the file only lands in local Miniflare storage.

```bash
npx wrangler r2 bucket create cursorfm-audio
npx wrangler r2 object put cursorfm-audio/merged-audio.mp3 --file=public/merged-audio.mp3 --content-type=audio/mpeg --remote
```

The Worker streams `/merged-audio.mp3` from that object (HTTP Range included). Keep:

```jsonc
"AUDIO_PUBLIC_URL": "/merged-audio.mp3",
"DURATION_SECONDS": "1236"
```

The bucket does not need a public r2.dev URL.

## Deploy

```bash
npx wrangler login
npm run deploy
```

Confirm login with `npx wrangler whoami` first. If the OAuth token has expired, run `npx wrangler login` again (or set `CLOUDFLARE_API_TOKEN`).

## What it does not include

Chat, accounts, extra channels, listener counts, Durable Objects, or Cloudflare Stream.
