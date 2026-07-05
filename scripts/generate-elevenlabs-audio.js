import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer, loadEnv } from 'vite';

const ROOT = process.cwd();
const AUDIO_DIR = join(ROOT, 'public', 'audio');
const DOCS_FILE = join(ROOT, 'docs', 'audio-scripts.md');
const REQUIRED_DOCS_FILE = join(ROOT, 'docs', 'audio-files-required.md');
const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const dryRun = args.has('--dry-run');
const docsOnly = args.has('--docs-only');
const unknownArgs = [...args].filter((arg) => !['--force', '--dry-run', '--docs-only'].includes(arg));
const MAX_ATTEMPTS = 3;
const REQUEST_DELAY_MS = 900;

if (unknownArgs.length) {
  console.error(`Unknown option(s): ${unknownArgs.join(', ')}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadAudioScripts() {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true },
  });
  try {
    const module = await server.ssrLoadModule('/src/data/audioScripts.ts');
    return module.audioScripts;
  } finally {
    await server.close();
  }
}

function validateCatalog(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Audio catalog is empty.');
  const seen = new Set();
  for (const entry of items) {
    if (!entry?.key || !entry?.text || !entry?.title || !entry?.category) {
      throw new Error(`Invalid audio catalog entry: ${JSON.stringify(entry)}`);
    }
    if (!/^[a-z0-9-]+$/.test(entry.key)) throw new Error(`Unsafe audio key: ${entry.key}`);
    if (seen.has(entry.key)) throw new Error(`Duplicate audio key: ${entry.key}`);
    seen.add(entry.key);
  }
}

function markdownCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

async function writeDocumentation(items) {
  const rows = items.map((entry) =>
    `| \`${entry.key}\` | ${markdownCell(entry.title)} | ${markdownCell(entry.category)} | ${markdownCell(entry.text)} | \`${entry.key}.mp3\` |`,
  );
  const content = `# Audio Scripts\n\n` +
    `This file is generated from \`src/data/audioScripts.ts\`. Do not edit script text here.\n\n` +
    `Total audio items: **${items.length}**.\n\n` +
    `| Key | Title | Category | Script text | Expected file |\n` +
    `| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`;
  await writeFile(DOCS_FILE, content, 'utf8');
  const requiredFiles = items.map((entry) => `- \`${entry.key}.mp3\` - ${entry.title}`).join('\n');
  const requiredContent = `# Required Audio Files\n\n` +
    `Generated from \`src/data/audioScripts.ts\`. Total required: **${items.length}**.\n\n` +
    `All files belong in \`public/audio/\`.\n\n${requiredFiles}\n`;
  await writeFile(REQUIRED_DOCS_FILE, requiredContent, 'utf8');
  console.log(`documentation: ${DOCS_FILE}`);
  console.log(`documentation: ${REQUIRED_DOCS_FILE}`);
}

async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function requestSpeech({ apiKey, voiceId, modelId, text }) {
  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({ text, model_id: modelId }),
      });

      if (response.ok) {
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length === 0) throw new Error('ElevenLabs returned an empty audio file.');
        return bytes;
      }

      const body = (await response.text()).slice(0, 500);
      const error = new Error(`ElevenLabs HTTP ${response.status}: ${body}`);
      if (response.status !== 429 && response.status < 500) {
        error.nonRetryable = true;
        throw error;
      }
      lastError = error;
    } catch (error) {
      if (error?.nonRetryable) throw error;
      lastError = error;
      if (attempt === MAX_ATTEMPTS) break;
    }

    const backoff = REQUEST_DELAY_MS * 2 ** (attempt - 1);
    console.warn(`  retry ${attempt}/${MAX_ATTEMPTS - 1} after ${backoff}ms`);
    await sleep(backoff);
  }

  throw lastError ?? new Error('ElevenLabs request failed.');
}

async function main() {
  const items = await loadAudioScripts();
  validateCatalog(items);
  await writeDocumentation(items);

  if (docsOnly) {
    console.log(`completed: documented ${items.length} audio item(s)`);
    return;
  }

  const fileEnv = loadEnv('development', ROOT, 'ELEVENLABS_');
  const env = { ...fileEnv, ...process.env };
  const apiKey = env.ELEVENLABS_API_KEY?.trim();
  const voiceId = env.ELEVENLABS_VOICE_ID?.trim();
  const modelId = env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_multilingual_v2';

  if (!dryRun && (!apiKey || !voiceId)) {
    throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID. Copy .env.example to .env and fill both values.');
  }

  await mkdir(AUDIO_DIR, { recursive: true });
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, entry] of items.entries()) {
    const outputPath = join(AUDIO_DIR, `${entry.key}.mp3`);
    if (!force && await exists(outputPath)) {
      skipped += 1;
      console.log(`[${index + 1}/${items.length}] skipped: ${entry.key}`);
      continue;
    }
    if (dryRun) {
      console.log(`[${index + 1}/${items.length}] generating (dry-run): ${entry.key}`);
      continue;
    }

    const temporaryPath = `${outputPath}.partial`;
    console.log(`[${index + 1}/${items.length}] generating: ${entry.key}`);
    try {
      const bytes = await requestSpeech({ apiKey, voiceId, modelId, text: entry.text });
      await writeFile(temporaryPath, bytes);
      await rename(temporaryPath, outputPath);
      generated += 1;
      console.log(`  completed: ${entry.key}.mp3 (${bytes.length} bytes)`);
    } catch (error) {
      failed += 1;
      await rm(temporaryPath, { force: true });
      console.error(`  failed: ${entry.key} - ${error instanceof Error ? error.message : String(error)}`);
    }

    if (index < items.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  console.log(`completed: generated=${generated}, skipped=${skipped}, failed=${failed}, total=${items.length}, model=${modelId}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
