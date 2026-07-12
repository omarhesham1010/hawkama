import { cpSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as esbuild from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
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

const contentFiles = [
  join(root, 'index.html'),
  join(root, 'src', 'App.tsx'),
  join(root, 'src', 'SlidePlayer.tsx'),
  ...uiSourceFiles(join(root, 'src', 'components')),
  ...uiSourceFiles(join(root, 'src', 'hooks')),
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

console.log('Static build written to dist/');
