const visualAssets = [
  '/template-assets/program-template-bg.webp',
  '/template-assets/top-left-identity-mark-color.webp',
  '/nasser-assets/nasser-welcome.webp',
  '/nasser-assets/nasser-point-right.webp',
  '/nasser-assets/nasser-point-left.webp',
  '/nasser-assets/nasser-question.webp',
  '/nasser-assets/nasser-success.webp',
  '/nasser-assets/nasser-tablet-right.webp',
  '/nasser-assets/nasser-tablet-left.webp',
  '/nasser-assets/nasser-thinking.webp',
  '/nasser-assets/nasser-warning.webp',
  '/nasser-assets/nasser-completion.webp',
  '/motion-assets/intro-governance-layer.webp',
  '/motion-assets/intro-compliance-layer.webp',
  '/motion-assets/intro-risk-layer.webp',
  '/course-visuals/governance-scene.webp',
  '/course-visuals/policy-scene.webp',
  '/course-visuals/policy-workflow.webp',
  '/course-visuals/leadership-board.webp',
  '/course-visuals/compliance-scene.webp',
  '/course-visuals/audit-controls.webp',
  '/course-visuals/secure-records.webp',
  '/course-visuals/risk-scene.webp',
  '/course-visuals/risk-matrix.webp',
] as const;

let preloaded = false;

function assetUrl(src: string) {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${src.replace(/^\//, '')}`;
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = assetUrl(src);
  });
}

async function preloadQueue(items: readonly string[], concurrency = 4) {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const src = items[index++];
      await preloadImage(src);
    }
  });
  await Promise.all(workers);
}

export function warmVisualAssets() {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;
  const start = () => {
    void preloadQueue(visualAssets);
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(start, { timeout: 1200 });
  } else {
    globalThis.setTimeout(start, 300);
  }
}
