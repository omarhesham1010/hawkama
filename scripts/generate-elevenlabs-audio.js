import { execFile } from 'node:child_process';
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { createServer, loadEnv } from 'vite';

const ROOT = process.cwd();
const PRODUCTION_AUDIO_DIR = join(ROOT, 'public', 'audio');
const PILOT_AUDIO_DIR = join(ROOT, 'public', 'audio-pilot');
const DOCS_FILE = join(ROOT, 'docs', 'audio-scripts.md');
const REQUIRED_DOCS_FILE = join(ROOT, 'docs', 'audio-files-required.md');
const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const dryRun = args.has('--dry-run');
const docsOnly = args.has('--docs-only');
const preview = args.has('--preview');
const keysArg = [...args].find((arg) => arg.startsWith('--keys='));
const selectedKeys = keysArg
  ? new Set(keysArg.slice('--keys='.length).split(',').map((key) => key.trim()).filter(Boolean))
  : null;
const unknownArgs = [...args].filter((arg) =>
  !['--force', '--dry-run', '--docs-only', '--preview'].includes(arg) && !arg.startsWith('--keys='),
);
const MAX_ATTEMPTS = 3;
const REQUEST_DELAY_MS = 900;
const CHUNK_DELAY_MS = 350;
const MAX_CHUNK_CHARS = 520;
const runFile = promisify(execFile);
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.62,
  similarity_boost: 0.78,
  style: 0,
  use_speaker_boost: true,
  speed: 0.97,
};

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

function speechReadyText(text) {
  return text
    .replace(/[:：]/g, '،')
    .replace(/[—–]/g, '،')
    .replace(/\s*؛\s*/g, '؛ ')
    .replace(/\s*،\s*/g, '، ')
    .replace(/\s+/g, ' ')
    .trim();
}

function numericSetting(env, key, fallback, min, max) {
  const raw = env[key]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}.`);
  }
  return value;
}

function voiceSettingsFromEnv(env, modelId) {
  const similarityBoost = numericSetting(
    env,
    'ELEVENLABS_SIMILARITY_BOOST',
    DEFAULT_VOICE_SETTINGS.similarity_boost,
    0,
    1,
  );
  if (modelId === 'eleven_v3') {
    return {
      stability: 1,
      similarity_boost: similarityBoost,
    };
  }
  return {
    stability: numericSetting(env, 'ELEVENLABS_STABILITY', DEFAULT_VOICE_SETTINGS.stability, 0, 1),
    similarity_boost: similarityBoost,
    style: numericSetting(env, 'ELEVENLABS_STYLE', DEFAULT_VOICE_SETTINGS.style, 0, 1),
    use_speaker_boost: env.ELEVENLABS_SPEAKER_BOOST?.trim().toLowerCase() !== 'false',
    speed: numericSetting(env, 'ELEVENLABS_SPEED', DEFAULT_VOICE_SETTINGS.speed, 0.7, 1.2),
  };
}

function outputFormatFromEnv(env) {
  const format = env.ELEVENLABS_OUTPUT_FORMAT?.trim() || 'mp3_44100_128';
  if (format !== 'mp3_44100_128') {
    throw new Error('ELEVENLABS_OUTPUT_FORMAT must be mp3_44100_128 for this course.');
  }
  return format;
}

function splitLongSentence(sentence, limit) {
  const words = sentence.split(/\s+/).filter(Boolean);
  const parts = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > limit) {
      parts.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function speechChunks(text, limit = MAX_CHUNK_CHARS) {
  const prepared = speechReadyText(text);
  const sentences = prepared.match(/[^.؟!]+[.؟!]*/g)?.map((part) => part.trim()).filter(Boolean) ?? [prepared];
  const units = sentences.flatMap((sentence) =>
    sentence.length > limit ? splitLongSentence(sentence, limit) : [sentence],
  );
  const chunks = [];
  let current = '';
  for (const unit of units) {
    const next = current ? `${current} ${unit}` : unit;
    if (current && next.length > limit) {
      chunks.push(current);
      current = unit;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function stableSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function ffmpegPath(path) {
  return path.replaceAll('\\', '/').replaceAll("'", "'\\''");
}

async function replaceFileSafely(sourcePath, outputPath) {
  if (!await exists(outputPath)) {
    await rename(sourcePath, outputPath);
    return;
  }
  const backupPath = `${outputPath}.backup`;
  await rm(backupPath, { force: true });
  await rename(outputPath, backupPath);
  try {
    await rename(sourcePath, outputPath);
    await rm(backupPath, { force: true });
  } catch (error) {
    await rm(outputPath, { force: true });
    await rename(backupPath, outputPath);
    throw error;
  }
}

async function assembleAudio(partPaths, outputPath, workDir) {
  const listPath = join(workDir, 'concat.txt');
  const content = partPaths.map((path) => `file '${ffmpegPath(path)}'`).join('\n');
  await writeFile(listPath, content, 'utf8');
  await runFile('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'concat', '-safe', '0', '-i', listPath,
    '-af', 'adelay=180:all=1,apad=pad_dur=0.12',
    '-ar', '44100', '-b:a', '128k', outputPath,
  ], { windowsHide: true, maxBuffer: 1024 * 1024 });
  const info = await stat(outputPath);
  if (!info.isFile() || info.size < 1000) throw new Error('FFmpeg produced an invalid MP3 file.');
}

async function writeDocumentation(items) {
  const rows = items.map((entry) =>
    `| \`${entry.key}\` | ${markdownCell(entry.title)} | ${markdownCell(entry.category)} | ${markdownCell(speechReadyText(entry.text))} | \`${entry.key}.mp3\` |`,
  );
  const content = `# Audio Scripts\n\n` +
    `This file is generated from \`src/data/audioScripts.ts\`. Do not edit script text here. ` +
    `The table contains the normalized text sent to ElevenLabs.\n\n` +
    `Total audio items: **${items.length}**.\n\n` +
    `| Key | Title | Category | Script text | Expected file |\n` +
    `| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`;
  await writeFile(DOCS_FILE, content, 'utf8');
  const requiredFiles = items.map((entry) => `- \`${entry.key}.mp3\` - ${entry.title}`).join('\n');
  const requiredContent = `# Required Audio Files\n\n` +
    `Generated from \`src/data/audioScripts.ts\`. Total required: **${items.length}**.\n\n` +
    `All files belong in \`public/audio/\`. Do not regenerate them unless the narration ` +
    `or approved voice changes and the user explicitly approves API usage.\n\n` +
    `The separate \`slide-01.mp3\` through \`slide-18.mp3\` files belong to the archived ` +
    `\`compliance-risk-ch1\` course.\n\n${requiredFiles}\n`;
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

async function requestSpeech({
  apiKey,
  voiceId,
  modelId,
  text,
  voiceSettings,
  previousText,
  nextText,
  seed,
  outputFormat,
}) {
  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(outputFormat)}`;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(120000),
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: speechReadyText(text),
          model_id: modelId,
          voice_settings: voiceSettings,
          ...(modelId === 'eleven_v3' ? {} : {
            previous_text: previousText || undefined,
            next_text: nextText || undefined,
          }),
          seed,
        }),
      });

      if (response.ok) {
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length === 0) throw new Error('ElevenLabs returned an empty audio file.');
        return bytes;
      }

      const body = (await response.text()).slice(0, 500);
      const quotaExceeded = response.status === 401 && body.includes('quota_exceeded');
      const error = new Error(quotaExceeded
        ? 'ElevenLabs API quota is exhausted. Add credits or increase the API key quota, then resume generation.'
        : `ElevenLabs HTTP ${response.status}: ${body}`);
      error.quotaExceeded = quotaExceeded;
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

async function generateEntry({ entry, apiKey, voiceId, modelId, voiceSettings, outputFormat, outputDir }) {
  const chunks = speechChunks(entry.text);
  const workDir = join(outputDir, `.tmp-${entry.key}-${Date.now()}`);
  const processedPath = join(workDir, `${entry.key}.mp3`);
  await mkdir(workDir, { recursive: true });
  try {
    const partPaths = [];
    console.log(`  chunks: ${chunks.length}`);
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const partPath = join(workDir, `part-${String(chunkIndex + 1).padStart(2, '0')}.mp3`);
      const bytes = await requestSpeech({
        apiKey,
        voiceId,
        modelId,
        text: chunks[chunkIndex],
        voiceSettings,
        previousText: chunks[chunkIndex - 1],
        nextText: chunks[chunkIndex + 1],
        seed: stableSeed(`${entry.key}:${chunkIndex}`),
        outputFormat,
      });
      await writeFile(partPath, bytes);
      partPaths.push(partPath);
      console.log(`  chunk ${chunkIndex + 1}/${chunks.length}: ${bytes.length} bytes`);
      if (chunkIndex < chunks.length - 1) await sleep(CHUNK_DELAY_MS);
    }
    await assembleAudio(partPaths, processedPath, workDir);
    const outputPath = join(outputDir, `${entry.key}.mp3`);
    const size = (await stat(processedPath)).size;
    await replaceFileSafely(processedPath, outputPath);
    return size;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function main() {
  const items = await loadAudioScripts();
  validateCatalog(items);
  await writeDocumentation(items);

  if (docsOnly) {
    console.log(`completed: documented ${items.length} audio item(s)`);
    return;
  }

  const selectedItems = selectedKeys ? items.filter((entry) => selectedKeys.has(entry.key)) : items;
  if (selectedKeys) {
    const missingKeys = [...selectedKeys].filter((key) => !items.some((entry) => entry.key === key));
    if (missingKeys.length) throw new Error(`Unknown audio key(s): ${missingKeys.join(', ')}`);
    if (!selectedItems.length) throw new Error('No audio items selected.');
  }

  const fileEnv = loadEnv('development', ROOT, 'ELEVENLABS_');
  const env = { ...fileEnv, ...process.env };
  const apiKey = env.ELEVENLABS_API_KEY?.trim();
  const voiceId = env.ELEVENLABS_VOICE_ID?.trim();
  const modelId = env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_multilingual_v2';
  const voiceSettings = voiceSettingsFromEnv(env, modelId);
  const outputFormat = outputFormatFromEnv(env);

  if (!dryRun && (!apiKey || !voiceId)) {
    throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID. Copy .env.example to .env and fill both values.');
  }

  const outputDir = preview ? PILOT_AUDIO_DIR : PRODUCTION_AUDIO_DIR;
  await mkdir(outputDir, { recursive: true });
  console.log(`output: ${outputDir}`);
  console.log(`model: ${modelId}`);
  console.log(`output format: ${outputFormat}`);
  console.log(`voice settings: ${JSON.stringify(voiceSettings)}`);
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let quotaExhausted = false;

  for (const [index, entry] of selectedItems.entries()) {
    const outputPath = join(outputDir, `${entry.key}.mp3`);
    if (!force && await exists(outputPath)) {
      skipped += 1;
      console.log(`[${index + 1}/${selectedItems.length}] skipped: ${entry.key}`);
      continue;
    }
    if (dryRun) {
      console.log(`[${index + 1}/${selectedItems.length}] generating (dry-run): ${entry.key}`);
      continue;
    }

    console.log(`[${index + 1}/${selectedItems.length}] generating: ${entry.key}`);
    try {
      const size = await generateEntry({
        entry,
        apiKey,
        voiceId,
        modelId,
        voiceSettings,
        outputFormat,
        outputDir,
      });
      generated += 1;
      console.log(`  completed: ${entry.key}.mp3 (${size} bytes)`);
    } catch (error) {
      failed += 1;
      console.error(`  failed: ${entry.key} - ${error instanceof Error ? error.message : String(error)}`);
      if (error?.quotaExceeded) {
        quotaExhausted = true;
        console.error('  stopped: no further API requests will be made until quota is available');
        break;
      }
    }

    if (index < selectedItems.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  const unprocessed = selectedItems.length - generated - skipped - failed;
  console.log(`completed: generated=${generated}, skipped=${skipped}, failed=${failed}, unprocessed=${unprocessed}, total=${selectedItems.length}, model=${modelId}`);
  if (quotaExhausted) console.log('resume: rerun with --force after increasing the ElevenLabs API quota');
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
