# Prompt: rebuild bag-2's visual library in the premium 3D "scene" style

## Why this exists

The client saw bag-1's (`إدارة الحوكمة`) visual library and wants bag-2
(`إدارة الاستجابة للطوارئ`) to match it exactly. Right now bag-2 uses flat,
simple SVG icons/illustrations. The client's reference is bag-1's set of
polished 3D-rendered "scene" images:

```
public/assets/visual-library/audit-controls.webp
public/assets/visual-library/compliance-scene.webp
public/assets/visual-library/governance-scene.webp
public/assets/visual-library/leadership-board.webp
public/assets/visual-library/policy-scene.webp
public/assets/visual-library/policy-workflow.webp
public/assets/visual-library/risk-matrix.webp
public/assets/visual-library/risk-scene.webp
public/assets/visual-library/secure-records.webp
```

**Open all 9 of those files before generating anything.** They ARE the
target style — sample the exact colors, materials, lighting, and
composition from them rather than approximating from this description.

## Visual style — must match the 9 reference files exactly

- **3D isometric/perspective glossy render**, not flat vector, not a flat
  icon. Rounded, slightly toy-like 3D objects with soft shadows and
  specular highlights, like a modern onboarding-illustration render pack.
- **Brand material palette** (sample exact values from the reference
  files, this is a description not exact hex): deep green gradient body
  material with a lighter green highlight, gold/brass metallic trim and
  accents, cream/white glossy panels for documents, screens, and
  checklists, occasional soft blue-grey for secondary objects (buildings,
  hardware). No colors outside this family — no red, no purple, no colors
  the reference set doesn't already use.
- **Consistent lighting**: single soft light from the upper-left, warm
  highlight on gold trim, soft ambient occlusion under each object.
- **Composed as a small "scene"**, not a single isolated icon: 2-4 related
  3D objects grouped together that jointly tell the one specific idea.
  E.g. `governance-scene.webp` = a round council table + a shield emblem
  + building icons; `risk-matrix.webp` = a heat-map grid + a shield +
  a gauge dial. Every new image below needs this same "small diorama"
  treatment, not a single centered object.
- **Transparent background** (RGBA/alpha, no baked-in backdrop or floor
  plane) — confirmed the reference files are true transparent PNGs/WebPs
  despite rendering on black in some file browsers.
- **Canvas**: roughly landscape, matching the reference files' ~999×666
  proportions (or close to it) with the scene filling the frame and a
  little breathing room at the edges.
- **Format**: `.webp` with alpha (PNG with alpha is fine too if the
  generation tool can't output webp — I'll convert).

## What "expressive" means here

Same bar as the reference set: someone who knows the topic should
recognize the specific idea at a glance, not "something vaguely about
safety." A PDCA-cycle scene should show four arrows/panels actually
arranged in a closed loop; an OODA-loop scene should show four distinct
labeled-by-shape stages, not a generic circular-arrows icon. No text or
labels baked into any image — communicate through object choice and
composition only, exactly like the bag-1 reference set does.

## What to generate — 33 scenes, one per concept

These are every distinct topic bag-2's card visuals currently need,
pulled directly from the app's real keyword-matching logic (not
guessed), so this list is exhaustive for chapters 1-4. Deliver **one**
polished scene per concept (no `-02`/`-03` near-duplicate variants this
time — at this level of detail and distinctness, 33 genuinely different
scenes shouldn't need repeats the way the old flat-icon set did).

| new filename | concept it must depict |
|---|---|
| `emergency-command-center.webp` | ICS/EOC emergency operations command center — a control-room console, radio/comms tower, coordinated response hub |
| `emergency-strategic-framework.webp` | Institutional emergency-preparedness framework — a blueprint/framework document + building + interlocking policy pieces |
| `emergency-continuity-shield.webp` | Business continuity / critical operations protection — a shield guarding a "critical operations" gear or pulse-line |
| `emergency-crisis-communication.webp` | Crisis communication & public trust — a spokesperson podium/microphone + broadcast waves + a trust/handshake element |
| `emergency-decision-pressure.webp` | Decision-making under pressure / avoiding analysis paralysis — a decision fork/switch under a ticking clock or pressure gauge |
| `emergency-proactive-scanning.webp` | Proactive horizon scanning & scenario planning — a telescope/binoculars scanning a horizon toward multiple scenario paths |
| `emergency-risk-matrix.webp` | Multi-hazard risk mapping — a heat-map grid + shield + gauge (closest analog to bag-1's risk-matrix, adapted to multi-hazard) |
| `emergency-surveillance-radar.webp` | Early-warning surveillance & threshold alerts — a radar sweep dish + alert bell + threshold gauge |
| `emergency-supply-chain.webp` | Emergency supply chain & logistics resilience — a truck/pallet + inventory boxes + a resilient supply-line |
| `emergency-after-action-review.webp` | After-action review & lessons-learned improvement plan — a checklist/report + magnifying glass + an upward improvement arrow |
| `emergency-kpi-dashboard.webp` | Readiness/response KPI dashboard — a dashboard panel with charts, gauges, and a baseline marker |
| `emergency-stakeholder-network.webp` | Stakeholder network mapping — connected figures/nodes radiating from a central hub |
| `emergency-response-team.webp` | Response team coordination & info flow — a team of figures with a shared radio/communication link |
| `emergency-raci-matrix.webp` | RACI accountability matrix — a small grid/table with distinct role markers (responsible/accountable/consulted/informed) |
| `emergency-crisis-terms.webp` | The Event → Emergency → Crisis → Disaster severity ladder — four escalating panels/blocks rising in size or intensity |
| `emergency-leadership-traits.webp` | Crisis leadership traits (calm, decisive, empathetic, present) — a composed leader figure at the center of a small radiating set of trait icons |
| `emergency-escalation-levels.webp` | 4-level escalation scale (green→yellow→red→black) — four rising blocks/panels in that exact color progression |
| `emergency-ooda-loop.webp` | OODA loop — four stages (Observe/Orient/Decide/Act) arranged in a closed directional loop |
| `emergency-cerc-timeline.webp` | CERC 5-phase communication timeline — five sequential panels/milestones along a timeline |
| `emergency-pestle-wheel.webp` | PESTLE horizontal-scanning wheel — a 6-slice wheel/hexagon, each slice a distinct small object (political/economic/social/tech/legal/environmental) |
| `emergency-macro-meso-micro.webp` | Macro/meso/micro vertical scanning — a 3-tier nested structure (large→medium→small), tiers visually distinct |
| `emergency-delphi-method.webp` | Delphi expert-consensus method — a small panel of abstract expert figures converging opinions toward a center document |
| `emergency-futures-wheel.webp` | Futures wheel (first/second-order effects) — a central hub with branching spokes radiating outward |
| `emergency-hazard-triangle.webp` | Hazard–Exposure–Vulnerability triangle — three overlapping 3D shapes converging on a shared center |
| `emergency-scenario-matrix.webp` | 2×2 scenario-planning matrix — a grid with two crossing axis arrows, four distinct quadrant objects |
| `emergency-leading-lagging.webp` | Leading vs. lagging indicators — two paired arrows/paths, one pointing ahead, one trailing behind |
| `emergency-surveillance-modes.webp` | Indicator-based vs. event-based surveillance — a steady radar sweep paired with a single sharp alert ping |
| `emergency-abc-inventory.webp` | ABC inventory tiers — three stacked tiers of decreasing size/prominence (A largest, C smallest) |
| `emergency-pdca-cycle.webp` | PDCA continuous-improvement cycle — four stages (Plan/Do/Check/Act) in a closed loop, distinct from the AAR scene |
| `emergency-power-interest-matrix.webp` | Power/Interest stakeholder matrix — a 2×2 grid with power and interest as the two axes, four distinct quadrant figures |
| `emergency-crisis-comm-principles.webp` | Crisis-communication principles cluster (first, accurate, credible, empathetic, action, respect) — 6 small connected nodes around a center |
| `emergency-smart-criteria.webp` | SMART improvement-plan criteria — 5 interlocking facets forming one cohesive shape |
| `emergency-scenario-branches.webp` | Best/worst/most-likely scenario branches — 3 diverging paths from one origin point |

## Naming & delivery

Save each as the exact filename above into `public/assets/visual-library/`
(webp with alpha). These are new files alongside the existing
`emergency-*.svg` set, not replacements — **the old SVGs stay on disk and
in the repo untouched.** Once the new scenes are wired in as the primary
visual, the old flat icons keep working as an automatic fallback/reserve
pool (cards that don't get a new scene, or any future gap) instead of
being deleted, so nothing regresses if a concept is ever missing its new
image for any reason.

## Small corner-badge icons — out of scope, leave as-is

The platform also shows ~55 tiny (36-48px) flat corner-badge icons per
card (shield-check, target-alignment, etc. — `icon-*-01..04.svg`).
Decided: leave these as they are. They're a minor accent, already work
well at that size, and don't need the 3D-scene treatment.
