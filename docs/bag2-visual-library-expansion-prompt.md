# Prompt: expand bag-2's icon/illustration library (Chapters 1-4)

## Why this exists

The player shows a small illustration on every card as it's revealed (and, on
Chapter 1's intro slides, a few "bridge" images while Nasser is still
introducing the slide). All of these are drawn from
`public/assets/visual-library/`. I counted every card across the bag-2 intro
and all four chapters — **229 cards total** — and matched each one against the
current image-selection logic (`pptGeneratedVisualLayersFor` in
`src/components/player/SlideStage.tsx`).

The pool it draws from today is small: 15 topic illustrations
(`emergency-*.svg`) plus a 55-icon generic shared library
(`icon-*-01.svg` .. `icon-*-04.svg`). Spread across 229 cards, several images
get reused constantly just because there's nothing else that fits:

| image | times used (of 229 cards) |
|---|---|
| `emergency-crisis-communication.svg` | 19 |
| `emergency-supply-chain.svg` | 12 |
| `emergency-kpi-dashboard.svg` | 12 |
| `emergency-continuity-shield.svg` | 10 |
| `emergency-command-center.svg` | 9 |
| `emergency-risk-matrix.svg` | 8 |
| `emergency-after-action-review.svg` | 7 |
| `emergency-decision-pressure.svg` | 7 |
| `emergency-surveillance-radar.svg` | 7 |
| `emergency-leadership-traits.svg` | 7 |
| `emergency-response-team.svg` | 6 |
| `emergency-raci-matrix.svg` | 5 |
| `emergency-stakeholder-network.svg` | 5 |

This request is for **new images** to add to that pool — both more variety on
the themes above, and dedicated icons for specific named frameworks the
chapters use that don't have any illustration of their own right now (they
currently fall back to a generic icon instead). Once these exist, I'll wire
them into the selection code myself so they actually get used and rotated —
you (Codex, or whichever tool generates these) only need to produce the image
files themselves, named exactly as listed below.

## Visual style — must match the existing set exactly

Open a couple of files in `public/assets/visual-library/` before generating
anything (e.g. `emergency-crisis-communication.svg`, `icon-shield-check-01.svg`)
to see the actual style. In words:

- **Flat vector icon illustration** — no photos, no textures, no gradients
  beyond simple two-stop linear gradients, no drop shadows baked into the
  artwork itself (the app adds its own drop-shadow).
- **Transparent background, no frame, no card, no text/labels in the image**
  — the icon is the only content. Nothing should be cropped by an implied
  canvas edge; leave breathing room around the subject like the existing set
  does.
- **Color palette — use exactly this, nothing outside it:**
  - Primary green gradient: `#1F8B68` → `#0B5139` (icons) or `#2F7657` →
    `#1F5C3A` (illustrations)
  - Gold/brand accent gradient: `#E4C96F` → `#C7A24A` (icons) or `#D6B85D` →
    `#BF9B4A` (illustrations)
  - Teal accent (sparingly, for a secondary element): `#2BC7B8` → `#16A394`
  - Soft neutral background shapes (circle/ellipse behind the subject, very
    low opacity ~0.10): `#F4FBF7` fill, `#A9D0BF` stroke
  - White/near-white for highlights only
- **Single clear subject per image** — one concept, rendered simply enough to
  read at ~150px tall. Not a busy scene; think "app icon for this specific
  idea", not "diagram poster".
- **Format:** SVG preferred (matches the rest of the library and stays crisp
  at any size); if the generation tool can only output PNG, use a
  transparent-background PNG at least 800×800.
- **Square canvas**, subject centered, matching `viewBox="0 0 800 800"` (or
  500×500 for the plainer icon style) like the existing files.

## What "expressive" means here

Each image should make a viewer who already knows the topic nod because it
captures the *specific* idea, not just "something vaguely about safety" or
"a generic gear". A few examples of the level of specificity wanted:

- "PDCA cycle" → four arrows curving into a closed loop, one quadrant subtly
  emphasized per stage — not a generic circular-arrows icon.
- "Power/Interest matrix" → an actual 2×2 grid with axis arrows, not a
  generic chart icon.
- "Hazard–Exposure–Vulnerability" → three overlapping shapes (like a Venn
  triangle) converging on a center point, not three random icons side by
  side.

If a concept is abstract and hard to draw literally, favor a clean symbolic
metaphor (e.g. a shield for continuity, a radar sweep for surveillance) over
literal text or diagram labels — no words baked into any image.

## A. More variety for the most-repeated existing themes

For each theme below, generate **2 additional variants** — same subject, a
different but related composition/angle/detail so they don't look identical,
exactly like the existing `icon-shield-check-01/02/03/04.svg` variant sets.
Name them by appending `-02` / `-03` to the existing filename's stem:

| existing file | new files to add |
|---|---|
| `emergency-crisis-communication.svg` | `emergency-crisis-communication-02.svg`, `emergency-crisis-communication-03.svg` |
| `emergency-supply-chain.svg` | `emergency-supply-chain-02.svg`, `emergency-supply-chain-03.svg` |
| `emergency-kpi-dashboard.svg` | `emergency-kpi-dashboard-02.svg`, `emergency-kpi-dashboard-03.svg` |
| `emergency-continuity-shield.svg` | `emergency-continuity-shield-02.svg`, `emergency-continuity-shield-03.svg` |
| `emergency-command-center.svg` | `emergency-command-center-02.svg`, `emergency-command-center-03.svg` |
| `emergency-risk-matrix.svg` | `emergency-risk-matrix-02.svg`, `emergency-risk-matrix-03.svg` |
| `emergency-after-action-review.svg` | `emergency-after-action-review-02.svg`, `emergency-after-action-review-03.svg` |
| `emergency-decision-pressure.svg` | `emergency-decision-pressure-02.svg`, `emergency-decision-pressure-03.svg` |
| `emergency-surveillance-radar.svg` | `emergency-surveillance-radar-02.svg`, `emergency-surveillance-radar-03.svg` |
| `emergency-leadership-traits.svg` | `emergency-leadership-traits-02.svg`, `emergency-leadership-traits-03.svg` |
| `emergency-response-team.svg` | `emergency-response-team-02.svg`, `emergency-response-team-03.svg` |
| `emergency-raci-matrix.svg` | `emergency-raci-matrix-02.svg`, `emergency-raci-matrix-03.svg` |
| `emergency-stakeholder-network.svg` | `emergency-stakeholder-network-02.svg`, `emergency-stakeholder-network-03.svg` |

**Subtotal: 26 images.**

## B. New dedicated icons for named frameworks with no illustration yet

These are specific, well-known models the script names explicitly, currently
sharing a generic fallback icon instead of their own. Generate **2 variants**
of each (suffix `-01` / `-02`), same naming convention as the icon library:

| new file (both `-01` and `-02`) | concept it must depict | used in |
|---|---|---|
| `emergency-escalation-levels` | A 4-step severity/traffic-light scale: green → yellow → red → black (distinct blocks or a rising bar, not literal traffic light) | Ch.2 escalation criteria |
| `emergency-ooda-loop` | 4-stage closed loop: Observe → Orient → Decide → Act | Ch.2 decision-making under pressure |
| `emergency-cerc-timeline` | 5-phase horizontal timeline: pre-crisis → initial → maintenance → resolution → evaluation | Ch.2 CERC communication model |
| `emergency-pestle-wheel` | 6-slice wheel/hexagon (Political, Economic, Social, Technological, Legal, Environmental) | Ch.3 horizontal scanning |
| `emergency-macro-meso-micro` | 3-tier pyramid or nested circles, labeled by size not text | Ch.3 vertical scanning |
| `emergency-delphi-method` | A small panel of abstract expert figures converging opinions toward a center point | Ch.3 regulatory foresight tools |
| `emergency-futures-wheel` | Central circle with branching spokes radiating outward (first- and second-order effects) | Ch.3 regulatory foresight tools |
| `emergency-hazard-triangle` | 3 overlapping shapes (Hazard / Exposure / Vulnerability) converging at a shared center | Ch.3 multi-hazard risk concepts |
| `emergency-scenario-matrix` | A 2×2 grid with two crossing axes (uncertainty dimensions), 4 distinct quadrants | Ch.3 scenario planning |
| `emergency-leading-lagging` | Two arrows/paths — one pointing ahead (leading), one trailing behind (lagging) — paired, not separate icons | Ch.3 early-warning indicator design |
| `emergency-surveillance-modes` | Two overlaid concepts: a steady radar sweep (indicator-based) + a single sharp ping (event-based) | Ch.3 surveillance systems |
| `emergency-abc-inventory` | 3 stacked tiers of decreasing size/weight, each visually distinct (A largest/most prominent, C smallest) | Ch.4 inventory management |
| `emergency-pdca-cycle` | 4-stage closed loop: Plan → Do → Check → Act (distinct from the AAR icon — this one is a continuous cycle, not a single review) | Ch.4 improvement plans |
| `emergency-power-interest-matrix` | A 2×2 grid with "power" and "interest" as the two axes, 4 quadrants | Ch.4 stakeholder management |
| `emergency-crisis-comm-principles` | 6 small connected nodes around a center (first, accurate, credible, empathetic, action, respect) — a cluster, not a list | Ch.4 crisis communication strategy |
| `emergency-smart-criteria` | 5 interlocking facets/segments forming one cohesive shape (Specific/Measurable/Achievable/Relevant/Time-bound) | Ch.4 improvement plan criteria |
| `emergency-scenario-branches` | 3 diverging paths from one origin point (best / worst / most-likely) | Ch.2 scenario analysis |

**Subtotal: 17 concepts × 2 variants = 34 images.**

## Total requested: 60 images

That number comes directly from the audit above (13 over-used themes + 17
uncovered named frameworks), not a round target — if you find while
generating that a theme still feels thin, add a third variant; if two
concepts end up visually redundant, it's fine to merge them. The goal is
"nothing repeats unless the content genuinely repeats the same idea", not
hitting an exact count.

## Delivery

Save every file directly into `public/assets/visual-library/` using the exact
filenames above (`.svg` extension). Once they're in place, tell me and I'll
update the selection code (`EMERGENCY_FALLBACK_POOL` and the specific keyword
rules in `pptGeneratedVisualLayersFor`, both in
`src/components/player/SlideStage.tsx`) to actually route cards to the new
images and rotate through the new variants — that part I'll handle, no need
to touch any code yourself.
