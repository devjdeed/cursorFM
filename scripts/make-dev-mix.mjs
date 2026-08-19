import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const seconds = 30;
const sampleRate = 22050;
const samples = seconds * sampleRate;
const buffer = Buffer.alloc(44 + samples * 2);

buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + samples * 2, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(samples * 2, 40);

for (let i = 0; i < samples; i += 1) {
  const t = i / sampleRate;
  const envelope = 0.25 + 0.08 * Math.sin(t * 0.35);
  const sample =
    Math.sin(2 * Math.PI * 110 * t) * 0.45 +
    Math.sin(2 * Math.PI * 165 * t) * 0.28 +
    Math.sin(2 * Math.PI * 220 * t) * 0.12;
  const value = Math.max(-1, Math.min(1, sample * envelope));
  buffer.writeInt16LE(Math.floor(value * 32767), 44 + i * 2);
}

const out =
  process.argv[2] ??
  resolve(dirname(fileURLToPath(import.meta.url)), "../public/dev-mix.wav");
writeFileSync(out, buffer);
