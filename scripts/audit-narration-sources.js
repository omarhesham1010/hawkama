import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createServer } from 'vite';

const ROOT = process.cwd();
const args = process.argv.slice(2);

function argValue(name) {
  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function argValues(name) {
  const prefix = `${name}=`;
  return args.filter((arg) => arg.startsWith(prefix)).map((arg) => arg.slice(prefix.length));
}

const course = argValue('--course');
const keySuffix = argValue('--key-suffix');
const docsToSync = argValues('--sync-docs');
const docsToCheck = [...new Set([...docsToSync, ...argValues('--check-docs')])];
const forbiddenText = argValues('--forbid').filter(Boolean);
const verbose = args.includes('--verbose');
const requiredChecks = argValues('--require')
  .map((value) => {
    const splitAt = value.indexOf('::');
    return splitAt > 0
      ? { key: value.slice(0, splitAt), text: value.slice(splitAt + 2) }
      : null;
  })
  .filter(Boolean);

function isInCourse(entry) {
  if (keySuffix) return entry.key.endsWith(keySuffix);
  return !course || entry.key.includes(`bag${course}-`) || entry.key.endsWith(`-course${course}`);
}

function docRowFor(entry) {
  return `| \`${entry.key}\` | ${entry.title} | ${entry.category} | ${entry.text} | \`${entry.key}.mp3\` |`;
}

async function loadRuntimeData() {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true },
  });
  try {
    const scriptsModule = await server.ssrLoadModule('/src/data/audioScripts.ts');
    const slidesModule = await server.ssrLoadModule('/src/data/slides.ts');
    return {
      audioScripts: scriptsModule.audioScripts,
      slides: slidesModule.allNarratedSlides,
    };
  } finally {
    await server.close();
  }
}

function parseDocRow(line) {
  const match = line.match(/^\| `([^`]+)` \| (.+) \| ([a-z-]+) \| (.*) \| `([^`]+)` \|$/);
  if (!match) return null;
  return {
    key: match[1],
    title: match[2],
    category: match[3],
    text: match[4],
    file: match[5],
  };
}

async function syncDoc(filePath, scriptByKey) {
  const absolute = join(ROOT, filePath);
  const original = await readFile(absolute, 'utf8');
  let changed = 0;
  const lines = original.split(/\r?\n/).map((line) => {
    const row = parseDocRow(line);
    if (!row) return line;
    const entry = scriptByKey.get(row.key);
    if (!entry) return line;
    const next = docRowFor(entry);
    if (next !== line) {
      changed += 1;
      if (verbose && changed <= 60) {
        console.log(`${filePath}: syncing ${row.key}`);
      }
    }
    return next;
  });
  if (changed > 0) {
    await writeFile(absolute, lines.join('\n'), 'utf8');
  }
  return changed;
}

function compareRuntime(audioScripts, slides) {
  const issues = [];
  const slideByKey = new Map();
  for (const slide of slides) {
    if (!slide.audioKey) continue;
    const existing = slideByKey.get(slide.audioKey);
    if (existing && existing.narration !== slide.narration) {
      issues.push(`Duplicate slide audioKey with different narration: ${slide.audioKey}`);
    }
    slideByKey.set(slide.audioKey, slide);
  }

  for (const entry of audioScripts.filter(isInCourse)) {
    if (entry.category !== 'slide') continue;
    const slide = slideByKey.get(entry.key);
    if (!slide) {
      issues.push(`Audio script has no matching slide: ${entry.key}`);
      continue;
    }
    if (slide.narration !== entry.text) {
      issues.push(`Slide/audio script text mismatch: ${entry.key}`);
    }
  }
  return issues;
}

async function compareDoc(filePath, scriptByKey) {
  const absolute = join(ROOT, filePath);
  const text = await readFile(absolute, 'utf8');
  const issues = [];
  const seen = new Set();
  text.split(/\r?\n/).forEach((line, index) => {
    const row = parseDocRow(line);
    if (!row) return;
    const entry = scriptByKey.get(row.key);
    if (!entry) return;
    seen.add(row.key);
    if (row.text !== entry.text || row.category !== entry.category || row.title !== entry.title || row.file !== `${entry.key}.mp3`) {
      issues.push(`${filePath}:${index + 1} is stale for ${entry.key}`);
    }
  });

  for (const key of scriptByKey.keys()) {
    if (!seen.has(key)) {
      issues.push(`${filePath} is missing ${key}`);
    }
  }
  return issues;
}

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'dist', 'dist-course1', 'dist-course2', 'dist-course3', 'build'].includes(entry.name)) continue;
      if (entry.name.startsWith('tmp')) continue;
      yield* walk(fullPath);
      continue;
    }
    if (!/\.(ts|tsx|md|json|mjs|js)$/i.test(entry.name)) continue;
    if (entry.name === 'audioAlignments.ts') continue;
    yield fullPath;
  }
}

async function scanForbidden() {
  const issues = [];
  if (forbiddenText.length === 0) return issues;
  for (const base of ['src', 'docs', 'scripts']) {
    const dir = join(ROOT, base);
    for await (const filePath of walk(dir)) {
      const content = await readFile(filePath, 'utf8');
      for (const phrase of forbiddenText) {
        if (content.includes(phrase)) {
          issues.push(`${relative(ROOT, filePath)} still contains forbidden text: ${phrase}`);
        }
      }
    }
  }
  return issues;
}

function runRequiredChecks(required, scriptByKey, slideByKey) {
  const issues = [];
  for (const check of required) {
    const script = scriptByKey.get(check.key);
    const slide = slideByKey.get(check.key);
    if (!script) {
      issues.push(`Required key is missing from audio scripts: ${check.key}`);
      continue;
    }
    if (!script.text.includes(check.text)) {
      issues.push(`Audio script ${check.key} does not include required text: ${check.text}`);
    }
    if (slide && !slide.narration.includes(check.text)) {
      issues.push(`Slide narration ${check.key} does not include required text: ${check.text}`);
    }
  }
  return issues;
}

async function main() {
  const { audioScripts, slides } = await loadRuntimeData();
  const selectedScripts = audioScripts.filter(isInCourse);
  const scriptByKey = new Map(selectedScripts.map((entry) => [entry.key, entry]));
  const slideByKey = new Map(slides.filter((slide) => slide.audioKey && isInCourse({ key: slide.audioKey })).map((slide) => [slide.audioKey, slide]));

  for (const filePath of docsToSync) {
    const changed = await syncDoc(filePath, scriptByKey);
    console.log(`${filePath}: synced ${changed} row(s)`);
  }

  const issues = [
    ...compareRuntime(audioScripts, slides),
    ...(await Promise.all(docsToCheck.map((filePath) => compareDoc(filePath, scriptByKey)))).flat(),
    ...(await scanForbidden()),
    ...runRequiredChecks(requiredChecks, scriptByKey, slideByKey),
  ];

  if (issues.length > 0) {
    console.error('Narration source audit failed:');
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Narration source audit passed (${selectedScripts.length} script item(s), course=${course ?? 'all'}).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
