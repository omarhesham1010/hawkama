# ElevenLabs voice settings — what we've learned

Reference for how narration audio is generated (`scripts/generate-elevenlabs-audio.js`, config via `.env`). Kept up to date as the client gives feedback on generated tracks.

## Current `.env` config

| Key | Value | Notes |
|---|---|---|
| `ELEVENLABS_VOICE_ID` | `cFUFIbKkO2iZFwS8cRnY` | Client-provided voice, replaces the earlier `oJCdZCYaJobw2GlrIQm5`. |
| `ELEVENLABS_MODEL_ID` | `eleven_v3` | Matches the model shown selected ("Eleven v3 — Expressive model, High quality") in the client's ElevenLabs app screenshot, over the alternative `eleven_multilingual_v2`. |
| `ELEVENLABS_OUTPUT_FORMAT` | `mp3_44100_192` | 192kbps/44.1kHz — the top mp3 quality tier the API offers. The client's own reference export (`ElevenLabs_2026-07-24T10_22_24_Nasser AlJubaily - Authentic Saudi Pro_eleven_v3.mp3.mpeg`) was only 128kbps mono, so this already exceeds it. |
| `ELEVENLABS_STABILITY` | `1` | See "Stability" below — currently set per explicit client direction, overriding our earlier "Creative" read of their screenshot. |
| `ELEVENLABS_SIMILARITY_BOOST` | `0.78` | Unchanged so far; no client feedback on this yet. |

## Stability

The ElevenLabs app's Settings panel shows a **Stability** slider with three labeled presets: **Creative**, **Natural**, **Robust**. The client's screenshot showed **Creative** selected/circled.

- Our public understanding of these presets: Creative ≈ low stability (more expressive/variable delivery), Natural ≈ mid, Robust ≈ high stability (more consistent, less expressive) — i.e. Creative → `stability: 0`, Robust → `stability: 1`.
- We initially set `stability: 0` to match "Creative" from the screenshot.
- The client then explicitly asked to set `stability: 1` instead. **We followed that literal instruction** — it's possible the client means something different by the setting than our Creative/Natural/Robust → 0/0.5/1 assumption, or made a deliberate choice to move away from Creative after hearing the first pass. Either way, we're not second-guessing an explicit numeric instruction.
- **Open question for the client**: confirm whether `stability: 1` (i.e. "Robust") is actually what they want long-term, or whether they meant to pick the "Creative" preset (which we believe maps to `0`) — the wording in chat ("خلي الstability 1") reads as a literal value, but is one slide-value off from the "Creative" screenshot circle. Worth a quick confirm once they hear this pass.

## "Enhance" (client-flagged, unresolved)

The client's screenshot also shows a **"+ Enhance"** button next to the text input in the ElevenLabs app. This is an **app-only feature with no public API equivalent** we could find — it appears to be an AI pre-pass that rewrites the input text with inline expressive/audio direction tags (the `eleven_v3` model supports bracketed tags like `[pause]`, `[warmly]`, `[excited]`, etc.) before generation.

We have **not** attempted to hand-write equivalent tags into the narration script. Reasons:
1. We can't verify what tags "Enhance" would actually produce for this text — guessing risks misrepresenting the client's intent.
2. The client has been explicit elsewhere in this project that they don't want invented content in the narration ("مش عاوز تأليف") — inserting speculative director tags into the literal script text feels adjacent to that same risk, since it changes what's delivered beyond the approved script wording.

**Next step**: ask the client whether they want us to manually add `eleven_v3` audio tags (and if so, get their preferred style/examples), or whether they have a way to run "Enhance" themselves and hand us the resulting tagged text to feed into our pipeline instead.

## Model

`eleven_v3` confirmed correct against the client's screenshot (`Eleven v3` selected, not `Multilingual v2`) and against the reference file's own name (`..._eleven_v3.mp3.mpeg`).

## Output quality

`mp3_44100_192` (192kbps, 44.1kHz) is the highest mp3 tier the ElevenLabs API exposes for this account tier. No PCM/higher-bitrate option has been requested or tested.

## Generation workflow

- Script: `node scripts/generate-elevenlabs-audio.js --force --keys=<audioKey1>,<audioKey2>` — scopes generation to specific slides instead of the whole 90-slide catalog, so we don't burn credits/quota re-generating everything on every tweak.
- `--dry-run` validates the catalog/config without spending credits — always run this first after any settings or script-text change.
- The catalog (`src/data/audioScripts.ts`) is derived automatically from the slide narration text in `src/data/emergencyResponseProgram.ts` — editing narration there is what the generator actually reads from, `.env` only controls voice/model/output settings.
