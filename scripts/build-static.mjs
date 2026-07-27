import { cpSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as esbuild from 'esbuild';

const SAMPLE = process.argv.includes('--sample');

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, SAMPLE ? 'dist-sample' : 'dist');
const assetsDir = join(dist, 'assets');
const entry = join(root, 'src', 'main.tsx');
const cssInput = join(root, 'src', 'styles', 'index.css');
const jsOut = join(assetsDir, 'index.tmp.js');
const cssOut = join(assetsDir, 'index.tmp.css');
const tailwindContent = join(root, '.tailwind-content.tmp');

function hashedAssetName(prefix, file, extension) {
  const hash = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8);
  const name = `${prefix}-${hash}.${extension}`;
  renameSync(file, join(assetsDir, name));
  return name;
}

function uiSourceFiles(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...uiSourceFiles(full));
    else if (/\.(tsx?|html)$/.test(name)) files.push(full);
  }
  return files;
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });

cpSync(join(root, 'public'), dist, { recursive: true });

if (SAMPLE) {
  // The sample ships only the intro's first 2 slides (emergency-sample
  // courseId, see src/data/slides.ts) -- strip every other audio file so
  // the ministry-review ZIP doesn't ship ~190MB of narration for chapters
  // they haven't approved yet, and doesn't leak unfinished script content.
  const SAMPLE_AUDIO_FILES = new Set(['bag2-ch0-s1-welcome.mp3', 'bag2-ch0-s2-map.mp3']);
  const audioDir = join(dist, 'audio');
  let removed = 0;
  for (const name of readdirSync(audioDir)) {
    if (!SAMPLE_AUDIO_FILES.has(name)) {
      rmSync(join(audioDir, name), { force: true, recursive: true });
      removed += 1;
    }
  }
  console.log(`Sample build: pruned ${removed} unused audio file(s), kept ${SAMPLE_AUDIO_FILES.size}.`);

  // Same idea for images/icons: keep only what the 2 sample slides and the
  // shared course-2 shell actually render (verified via source + a live
  // network trace), drop everything else -- including public/icons/moh-library,
  // ~70 generically-named files (image8.svg etc.) that aren't referenced
  // anywhere in src/ at all.
  const SAMPLE_VISUAL_LIBRARY_FILES = new Set([
    'intro-emergency-preparedness-shield.webp', // slide 1 hero image
    // slide 2 (محتويات الحقيبة) previews all 4 chapters, so its cards'
    // keyword-matched illustrations (pptGeneratedVisualLayersFor) span
    // chapters that aren't otherwise in this sample -- confirmed via a
    // live network trace of every image the map slide actually requests.
    'emergency-strategic-framework.webp',
    'emergency-cerc-timeline.webp',
    'emergency-proactive-scanning.webp',
    'emergency-continuity-shield.webp',
    'icon-performance-chart.webp',
  ]);
  const visualLibraryDir = join(dist, 'assets', 'visual-library');
  let visualLibraryRemoved = 0;
  for (const name of readdirSync(visualLibraryDir)) {
    if (!SAMPLE_VISUAL_LIBRARY_FILES.has(name)) {
      rmSync(join(visualLibraryDir, name), { force: true, recursive: true });
      visualLibraryRemoved += 1;
    }
  }
  console.log(`Sample build: pruned ${visualLibraryRemoved} unused visual-library file(s).`);

  rmSync(join(dist, 'icons', 'moh-library'), { force: true, recursive: true });
  rmSync(join(dist, 'nasser-assets', 'Default'), { force: true, recursive: true });
  rmSync(join(dist, 'avatar-assets'), { force: true, recursive: true });
  rmSync(join(dist, 'assets', 'manifest.json'), { force: true });
  rmSync(join(dist, 'assets', 'preview.html'), { force: true });
  console.log('Sample build: removed unused moh-library icons, bag-1 Nasser poses, and personalization-gate avatars.');
}

const contentFiles = [
  join(root, 'index.html'),
  join(root, 'src', 'App.tsx'),
  join(root, 'src', 'SlidePlayer.tsx'),
  ...uiSourceFiles(join(root, 'src', 'components')),
  ...uiSourceFiles(join(root, 'src', 'hooks')),
  ...uiSourceFiles(join(root, 'src', 'legacy-bag2')),
];
writeFileSync(
  tailwindContent,
  contentFiles.map((file) => readFileSync(file, 'utf8')).join('\n'),
  'utf8',
);

const tailwindBin = join(root, 'node_modules', 'tailwindcss', 'lib', 'cli.js');
execFileSync(
  process.execPath,
  [tailwindBin, '-i', cssInput, '-o', cssOut, '--content', tailwindContent, '--minify'],
  { cwd: root, stdio: 'inherit' },
);
rmSync(tailwindContent, { force: true });

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  outdir: assetsDir,
  entryNames: 'index.tmp',
  chunkNames: 'chunks/[name]-[hash]',
  format: 'esm',
  splitting: true,
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  sourcemap: false,
  minify: true,
  define: {
    'import.meta.env.BASE_URL': JSON.stringify('./'),
    'import.meta.env.DEV': 'false',
    'import.meta.env.PROD': 'true',
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env.VITE_SAMPLE_MODE': JSON.stringify(SAMPLE ? 'true' : 'false'),
  },
  plugins: [
    {
      name: 'external-tailwind-css',
      setup(build) {
        build.onResolve({ filter: /styles[\\/]+index\.css$/ }, (args) => ({
          path: args.path,
          namespace: 'ignored-css',
        }));
        build.onLoad({ filter: /.*/, namespace: 'ignored-css' }, () => ({
          contents: '',
          loader: 'js',
        }));
      },
    },
  ],
});

const cssFile = hashedAssetName('index', cssOut, 'css');
const jsFile = hashedAssetName('index', jsOut, 'js');
const htmlTemplate = readFileSync(join(root, 'index.html'), 'utf8')
  .replace(
    '</head>',
    `    <link rel="stylesheet" href="./assets/${cssFile}" />\n  </head>`,
  )
  .replace(
    '<script type="module" src="/src/main.tsx"></script>',
    `<script type="module" crossorigin src="./assets/${jsFile}"></script>`,
  );

writeFileSync(join(dist, 'index.html'), htmlTemplate, 'utf8');

console.log(`Static build written to ${SAMPLE ? 'dist-sample' : 'dist'}/`);
