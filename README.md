# Cursor FM

A single-channel study radio: one 2-hour mix, a shared station clock, hosted on Cloudflare Workers + R2.

Everyone who hits Play lands at the same offset in the mix (`now % duration`). There is no live encoder.

## Local

```bash
npm install
npm run dev
```

That generates a 30-second placeholder mix in `public/` (AAC if `ffmpeg` is installed, otherwise WAV) and starts Vite. Open the printed local URL and press Play.

Placeholder audio is gitignored. Re-run `npm run make-dev-mix` if you delete it.

## Encode the real mix

Use constant bitrate AAC so seeking is accurate:

```bash
ffmpeg -i your-mix.wav -c:a aac -b:a 128k -movflags +faststart study.m4a
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 study.m4a
```

Set `DURATION_SECONDS` in `wrangler.jsonc` (or a production var) to that duration. Default is `7200` (2 hours). It must match the file.

## Upload to R2

```bash
npx wrangler r2 bucket create cursorfm-audio
npx wrangler r2 object put cursorfm-audio/study.m4a --file=study.m4a --content-type=audio/mp4
```

Make the object publicly readable (r2.dev URL or a custom domain on the bucket). Then set the public URL:

```bash
npx wrangler deploy
# or put this in wrangler.jsonc vars before deploy:
# AUDIO_PUBLIC_URL=https://pub-<id>.r2.dev/study.m4a
```

Allow CORS on the bucket if you want the on-page visualizer. Playback still works without CORS; `AnalyserNode` needs `Access-Control-Allow-Origin` for the site origin.

The browser streams the file with HTTP Range requests. Do not put the mix in Worker static assets (25 MiB cap).

## Deploy

```bash
npx wrangler login
npm run deploy
```

## What v1 does not include

Chat, accounts, extra channels, listener counts, Durable Objects, or Cloudflare Stream.
