# Project Asset Library

This project uses a shared visual asset library instead of bag-specific asset
folders. The library is intentionally reusable across all current and future
training bags.

## Structure

- `public/assets/visual-library/`
  The single shared folder for reusable icons, illustrations, motion layers,
  and identity images. All assets in this folder use semantic filenames that
  describe the visual concept, such as `icon-shield-check-01.svg`,
  `emergency-command-center.svg`, and `intro-emergency-preparedness-shield.svg`.
- `public/assets/manifest.json`
  Machine-readable inventory of the shared library.
- `public/assets/preview.html`
  Local visual contact sheet for quickly browsing available assets.

## Naming

Use concept-first names:

- `icon-{concept}-{variant}.svg` for small reusable icons.
- `{bag/topic}-{concept}.svg` or `.webp` for larger illustrations.
- `intro-{topic}-{concept}.svg` or `.webp` for motion intro layers.
- `identity-{concept}.png` for reusable visual identity images.

## Workflow

1. When building a new bag, first check the shared icon and image library.
2. Reuse existing assets when they match the learning concept and identity.
3. Add missing assets to `public/assets/visual-library/`, not to a bag-specific
   folder.
4. Use icons for small accents beside text and controls.
5. Use images or illustrations for large motion-graphics visual moments.
6. Keep backgrounds transparent whenever possible.

## Current Inventory

- Total assets: 112
- Shared SVG icons and accents: 71
- Course and motion illustrations: 33
- PNG identity images: 8

The first source batch was extracted from the emergency-response trainee guide
PowerPoint, then redrawn and normalized into production-ready reusable icons.
