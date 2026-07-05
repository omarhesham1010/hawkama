import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer } from 'vite';

const ROOT = process.cwd();
const AUDIO_DIR = join(ROOT, 'public', 'audio');
const strict = process.argv.includes('--strict');

async function loadAudioScripts() {
  const server = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true } });
  try {
    const module = await server.ssrLoadModule('/src/data/audioScripts.ts');
    return module.audioScripts;
  } finally {
    await server.close();
  }
}

async function validFile(path) {
  try {
    const info = await stat(path);
    return info.isFile() && info.size > 1000;
  } catch {
    return false;
  }
}

const items = await loadAudioScripts();
const missing = [];
const existing = [];

for (const entry of items) {
  const filename = `${entry.key}.mp3`;
  if (await validFile(join(AUDIO_DIR, filename))) existing.push(filename);
  else missing.push(filename);
}

const percentage = items.length ? ((existing.length / items.length) * 100).toFixed(1) : '100.0';
console.log(`total required: ${items.length}`);
console.log(`existing: ${existing.length}`);
console.log(`missing: ${missing.length}`);
console.log(`completion: ${percentage}%`);

if (existing.length) {
  console.log('\nexisting files:');
  existing.forEach((filename) => console.log(`- ${filename}`));
}
if (missing.length) {
  console.log('\nmissing files:');
  missing.forEach((filename) => console.log(`- ${filename}`));
}

if (strict && missing.length) process.exitCode = 1;
