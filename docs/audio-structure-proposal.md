# Future Audio Structure Proposal

Last updated: 2026-07-12

## Recommendation

Keep the current `public/audio/<audioKey>.mp3` naming for this delivery. It is stable, already validated, and tightly coupled to the current audio catalog, preload logic, generated manifest, SCORM packaging, and ElevenLabs alignment files.

For future packages, introduce a package-aware audio catalog before generating the next batch of audio. Do not rename the current production files immediately before client delivery.

## Proposed Folder Structure

```text
public/audio/
  package-01-governance/
    001-program-welcome__course-opening.mp3
    002-program-map__package-roadmap.mp3
    003-ch1-welcome__chapter-opening.mp3
    004-ch1-overview__chapter-map.mp3
    005-ch1-regulatory-framework__lesson.mp3
    006-ch1-overview-check-ask__knowledge-check-question.mp3
    007-ch1-overview-check-answer__knowledge-check-answer.mp3
  package-02-risk/
    001-program-welcome__course-opening.mp3
    002-ch1-welcome__chapter-opening.mp3

src/data/audioFileMap.ts
  audioKey -> package relative filename
```

## Naming Convention

- Lowercase only.
- English/transliterated purpose only.
- No Arabic filenames.
- No spaces.
- Use hyphen inside the audio key part and double underscore before the human purpose.
- Prefix with a three-digit playback order.
- Keep the internal `audioKey` stable even if the filename changes.

Pattern:

`<order>-<audio-key>__<short-purpose>.mp3`

Examples:

| Audio key | Future filename |
| --- | --- |
| `program-welcome` | `package-01-governance/001-program-welcome__course-opening.mp3` |
| `ch1-policy-activity-detail-3` | `package-01-governance/018-ch1-policy-activity-detail-3__activity-discussion.mp3` |
| `ch2-quiz-feedback-ch2-q4-correct` | `package-01-governance/083-ch2-quiz-feedback-ch2-q4-correct__quiz-correct-feedback.mp3` |

## Required Code Changes For Migration

1. Add a generated `src/data/audioFileMap.ts` mapping every `audioKey` to a relative MP3 path.
2. Change `src/hooks/useNarration.ts` from `audio/<key>.mp3` to `audio/<mapped-file>.mp3`.
3. Change `scripts/sync-audio-manifest.mjs` to scan nested package folders and emit both available keys and a cache version.
4. Change `scripts/check-audio-files.js` to validate files through the map rather than `<key>.mp3`.
5. Change `scripts/generate-elevenlabs-audio.js` to save output through the new file map.
6. Keep alignment files keyed by `audioKey`, not filename.
7. Rebuild SCORM and verify all nested MP3 paths appear in `dist/imsmanifest.xml`.

## Migration Plan

1. Freeze the current delivery with the existing flat audio naming.
2. Create the package folder and mapping generator in a separate branch.
3. Copy files into numbered package paths without deleting flat files.
4. Update runtime and validation scripts to use the map.
5. Run `npm run audio:check:strict`, `npm run test:sync`, `npm run build`, and `npm run package:scorm`.
6. Test desktop, iPhone/Safari, and LMS/SCORM Cloud.
7. Only after validation, remove flat duplicates.

## Pros

- Cleaner for multiple packages.
- Easier handoff to other developers.
- Playback order is visible in the filesystem.
- Easier replacement of one package without scanning all audio.

## Cons

- Requires code and script changes.
- Adds a mapping layer that must stay generated and reviewed.
- Higher delivery risk if done immediately before client handoff.
- Existing LMS/browser cache behavior must be revalidated.

## Current Decision

Do not migrate current filenames now. The current path system is tightly coupled to `audioKey`, and stability is more important for this delivery. Document the future structure and apply it when starting the next training package or after explicit client approval.
