# Project Asset Library

This project uses a shared visual asset library instead of bag-specific asset
folders. The library is intentionally reusable across all current and future
training bags.

## Structure

- `public/assets/icons/brand-ppt-source/`
  Extracted SVG icons and small visual accents from approved PowerPoint source
  files.
- `public/assets/images/brand-ppt-source/`
  Extracted PNG images and larger raster visuals from approved PowerPoint
  source files.
- `public/assets/manifest.json`
  Machine-readable inventory of the shared library.
- `public/assets/preview.html`
  Local visual contact sheet for quickly browsing available assets.

## Naming

Source-extracted assets use neutral reusable names:

- `brand-icon-001.svg`, `brand-icon-002.svg`, ...
- `brand-image-001.png`, `brand-image-002.png`, ...

When an asset becomes a curated production visual for a specific concept, create
a renamed derivative with a semantic name in the relevant curated folder. Keep
the source asset unchanged.

## Workflow

1. When building a new bag, first check the shared icon and image library.
2. Reuse existing assets when they match the learning concept and identity.
3. Add missing assets to the same shared library, not to a bag-specific folder.
4. Use icons for small accents beside text and controls.
5. Use images or illustrations for large motion-graphics visual moments.
6. Keep backgrounds transparent whenever possible.

## Current Inventory

- Total assets: 79
- SVG icons and accents: 71
- PNG images: 8

The first source batch was extracted from the emergency-response trainee guide
PowerPoint.
