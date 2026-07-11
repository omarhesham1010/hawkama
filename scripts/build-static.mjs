import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const assetsDir = join(dist, 'assets');
const entry = join(root, 'src', 'main.tsx');
const cssInput = join(root, 'src', 'styles', 'index.css');
const jsOut = join(assetsDir, 'index.js');
const cssOut = join(assetsDir, 'index.css');
const tailwindContent = join(root, '.tailwind-content.tmp');

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
  outfile: jsOut,
  format: 'esm',
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

writeFileSync(
  join(dist, 'index.html'),
  `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f0f6f2" />
    <meta name="description" content="حقيبة تعليمية تفاعلية عن الحوكمة والمخاطر والامتثال" />
    <title>الحوكمة والمخاطر والامتثال | حقيبة تدريبية تفاعلية</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="./assets/index.css" />
    <script type="module" crossorigin src="./assets/index.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
  'utf8',
);

console.log('Static build written to dist/');
