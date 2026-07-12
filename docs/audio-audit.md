# Audio Audit

Last updated: 2026-07-12

## Scope

Audited source audio in `public/audio/`, temporary pilot audio in `public/audio-pilot/`, generated `dist/audio/`, `src/data/audioScripts.ts`, `src/data/audioManifest.ts`, `src/data/slides.ts`, `src/hooks/useNarration.ts`, and the SCORM build scripts. No audio was regenerated and no ElevenLabs/API/.env workflow was used.

## Playback Model

- Runtime audio URL pattern: `/audio/<audioKey>.mp3?v=<AUDIO_MANIFEST_VERSION>`.
- Required delivery source: `public/audio/<audioKey>.mp3`.
- Required catalog source of truth: `src/data/audioScripts.ts`.
- `src/data/audioManifest.ts` is generated from files present in `public/audio`; it controls whether MP3 playback is attempted before TTS fallback.
- `dist/audio` is generated from `public/audio` during build/package and should not be edited by hand.

## Summary

| Metric | Count |
| --- | ---: |
| MP3 files in `public/audio` before cleanup | 162 |
| Required current-course audio scripts | 119 |
| Used current MP3 files kept | 119 |
| Unknown/legacy-safe MP3 files kept | 18 |
| Unused legacy `ppt-*` MP3 files deleted | 25 |
| Temporary pilot MP3 files deleted | 16 |
| MP3 files in `public/audio` after cleanup | 137 |

## Deleted Files

| # | Path | File | Size bytes | Status | Reason |
| ---: | --- | --- | ---: | --- | --- |
| 1 | `public/audio/ppt-activity-governance-or-compliance-feedback-1-correct.mp3` | `ppt-activity-governance-or-compliance-feedback-1-correct.mp3` | 91576 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 2 | `public/audio/ppt-activity-governance-or-compliance-feedback-1-incorrect.mp3` | `ppt-activity-governance-or-compliance-feedback-1-incorrect.mp3` | 118325 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 3 | `public/audio/ppt-activity-governance-or-compliance-feedback-2-correct.mp3` | `ppt-activity-governance-or-compliance-feedback-2-correct.mp3` | 103278 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 4 | `public/audio/ppt-activity-governance-or-compliance-feedback-2-incorrect.mp3` | `ppt-activity-governance-or-compliance-feedback-2-incorrect.mp3` | 125012 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 5 | `public/audio/ppt-activity-governance-or-compliance-feedback-3-correct.mp3` | `ppt-activity-governance-or-compliance-feedback-3-correct.mp3` | 82798 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 6 | `public/audio/ppt-activity-governance-or-compliance-feedback-3-incorrect.mp3` | `ppt-activity-governance-or-compliance-feedback-3-incorrect.mp3` | 119997 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 7 | `public/audio/ppt-activity-governance-or-compliance-feedback-4-correct.mp3` | `ppt-activity-governance-or-compliance-feedback-4-correct.mp3` | 86560 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 8 | `public/audio/ppt-activity-governance-or-compliance-feedback-4-incorrect.mp3` | `ppt-activity-governance-or-compliance-feedback-4-incorrect.mp3` | 115817 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 9 | `public/audio/ppt-activity-governance-or-compliance-question-2.mp3` | `ppt-activity-governance-or-compliance-question-2.mp3` | 168480 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 10 | `public/audio/ppt-activity-governance-or-compliance-question-3.mp3` | `ppt-activity-governance-or-compliance-question-3.mp3` | 186452 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 11 | `public/audio/ppt-activity-governance-or-compliance-question-4.mp3` | `ppt-activity-governance-or-compliance-question-4.mp3` | 174750 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 12 | `public/audio/ppt-activity-governance-or-compliance.mp3` | `ppt-activity-governance-or-compliance.mp3` | 463977 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 13 | `public/audio/ppt-conclusion.mp3` | `ppt-conclusion.mp3` | 586857 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 14 | `public/audio/ppt-conflict-scenario-complete.mp3` | `ppt-conflict-scenario-complete.mp3` | 159285 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 15 | `public/audio/ppt-conflict-scenario-discussion-1.mp3` | `ppt-conflict-scenario-discussion-1.mp3` | 343605 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 16 | `public/audio/ppt-conflict-scenario-discussion-2.mp3` | `ppt-conflict-scenario-discussion-2.mp3` | 305571 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 17 | `public/audio/ppt-conflict-scenario-discussion-3.mp3` | `ppt-conflict-scenario-discussion-3.mp3` | 333574 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 18 | `public/audio/ppt-conflict-scenario-question-2.mp3` | `ppt-conflict-scenario-question-2.mp3` | 86560 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 19 | `public/audio/ppt-conflict-scenario-question-3.mp3` | `ppt-conflict-scenario-question-3.mp3` | 102025 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 20 | `public/audio/ppt-conflict-scenario.mp3` | `ppt-conflict-scenario.mp3` | 457708 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 21 | `public/audio/ppt-ethics-conflict.mp3` | `ppt-ethics-conflict.mp3` | 1371785 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 22 | `public/audio/ppt-framework.mp3` | `ppt-framework.mp3` | 597306 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 23 | `public/audio/ppt-governance-compliance.mp3` | `ppt-governance-compliance.mp3` | 1289865 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 24 | `public/audio/ppt-governance-models.mp3` | `ppt-governance-models.mp3` | 1285685 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 25 | `public/audio/ppt-intro.mp3` | `ppt-intro.mp3` | 503683 | UNUSED_LEGACY | Old ppt-prefixed key. Not present in src/data/audioScripts.ts and not referenced by current slide playback. |
| 26 | `public/audio-pilot/program-map--continuous-conversational-88.mp3` | `program-map--continuous-conversational-88.mp3` | 848918 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 27 | `public/audio-pilot/program-map--continuous-robust-88.mp3` | `program-map--continuous-robust-88.mp3` | 837633 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 28 | `public/audio-pilot/program-map--continuous-saudi-warmup-88.mp3` | `program-map--continuous-saudi-warmup-88.mp3` | 784552 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 29 | `public/audio-pilot/program-map--continuous-warmup-88.mp3` | `program-map--continuous-warmup-88.mp3` | 831363 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 30 | `public/audio-pilot/program-map--natural-78.mp3` | `program-map--natural-78.mp3` | 944212 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 31 | `public/audio-pilot/program-map--natural-88.mp3` | `program-map--natural-88.mp3` | 941705 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 32 | `public/audio-pilot/program-map--robust-78.mp3` | `program-map--robust-78.mp3` | 877757 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 33 | `public/audio-pilot/program-map--tone-anchor-formal-88.mp3` | `program-map--tone-anchor-formal-88.mp3` | 822586 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 34 | `public/audio-pilot/program-map--tone-anchor-rewrite-88.mp3` | `program-map--tone-anchor-rewrite-88.mp3` | 812973 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 35 | `public/audio-pilot/program-welcome--continuous-conversational-88.mp3` | `program-welcome--continuous-conversational-88.mp3` | 618622 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 36 | `public/audio-pilot/program-welcome--continuous-robust-88.mp3` | `program-welcome--continuous-robust-88.mp3` | 611099 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 37 | `public/audio-pilot/program-welcome--continuous-saudi-warmup-88.mp3` | `program-welcome--continuous-saudi-warmup-88.mp3` | 611099 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 38 | `public/audio-pilot/program-welcome--continuous-warmup-88.mp3` | `program-welcome--continuous-warmup-88.mp3` | 616532 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 39 | `public/audio-pilot/program-welcome--natural-78.mp3` | `program-welcome--natural-78.mp3` | 603576 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 40 | `public/audio-pilot/program-welcome--natural-88.mp3` | `program-welcome--natural-88.mp3` | 615278 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |
| 41 | `public/audio-pilot/program-welcome--robust-78.mp3` | `program-welcome--robust-78.mp3` | 670031 | TEMPORARY | Pilot comparison audio outside runtime /audio/<key>.mp3 path. No source references. |

## Current Source Audio Inventory

| # | Path | File | Size bytes | Audio key | Referenced slide/activity | Category | Status | Note |
| ---: | --- | --- | ---: | --- | --- | --- | --- | --- |
| 1 | `public/audio/ch1-activity-governance-or-compliance-feedback-1-correct.mp3` | `ch1-activity-governance-or-compliance-feedback-1-correct.mp3` | 151135 | `ch1-activity-governance-or-compliance-feedback-1-correct` | ppt-activity-governance-or-compliance | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 2 | `public/audio/ch1-activity-governance-or-compliance-feedback-1-incorrect.mp3` | `ch1-activity-governance-or-compliance-feedback-1-incorrect.mp3` | 173705 | `ch1-activity-governance-or-compliance-feedback-1-incorrect` | ppt-activity-governance-or-compliance | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 3 | `public/audio/ch1-activity-governance-or-compliance-feedback-2-correct.mp3` | `ch1-activity-governance-or-compliance-feedback-2-correct.mp3` | 156777 | `ch1-activity-governance-or-compliance-feedback-2-correct` | ppt-activity-governance-or-compliance | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 4 | `public/audio/ch1-activity-governance-or-compliance-feedback-2-incorrect.mp3` | `ch1-activity-governance-or-compliance-feedback-2-incorrect.mp3` | 196901 | `ch1-activity-governance-or-compliance-feedback-2-incorrect` | ppt-activity-governance-or-compliance | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 5 | `public/audio/ch1-activity-governance-or-compliance-feedback-3-correct.mp3` | `ch1-activity-governance-or-compliance-feedback-3-correct.mp3` | 126057 | `ch1-activity-governance-or-compliance-feedback-3-correct` | ppt-activity-governance-or-compliance | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 6 | `public/audio/ch1-activity-governance-or-compliance-feedback-3-incorrect.mp3` | `ch1-activity-governance-or-compliance-feedback-3-incorrect.mp3` | 185616 | `ch1-activity-governance-or-compliance-feedback-3-incorrect` | ppt-activity-governance-or-compliance | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 7 | `public/audio/ch1-activity-governance-or-compliance-feedback-4-correct.mp3` | `ch1-activity-governance-or-compliance-feedback-4-correct.mp3` | 127938 | `ch1-activity-governance-or-compliance-feedback-4-correct` | ppt-activity-governance-or-compliance | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 8 | `public/audio/ch1-activity-governance-or-compliance-feedback-4-incorrect.mp3` | `ch1-activity-governance-or-compliance-feedback-4-incorrect.mp3` | 179974 | `ch1-activity-governance-or-compliance-feedback-4-incorrect` | ppt-activity-governance-or-compliance | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 9 | `public/audio/ch1-activity-governance-or-compliance-question-2.mp3` | `ch1-activity-governance-or-compliance-question-2.mp3` | 258341 | `ch1-activity-governance-or-compliance-question-2` | ppt-activity-governance-or-compliance | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 10 | `public/audio/ch1-activity-governance-or-compliance-question-3.mp3` | `ch1-activity-governance-or-compliance-question-3.mp3` | 260222 | `ch1-activity-governance-or-compliance-question-3` | ppt-activity-governance-or-compliance | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 11 | `public/audio/ch1-activity-governance-or-compliance-question-4.mp3` | `ch1-activity-governance-or-compliance-question-4.mp3` | 274015 | `ch1-activity-governance-or-compliance-question-4` | ppt-activity-governance-or-compliance | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 12 | `public/audio/ch1-activity-governance-or-compliance.mp3` | `ch1-activity-governance-or-compliance.mp3` | 895938 | `ch1-activity-governance-or-compliance` | ppt-activity-governance-or-compliance | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 13 | `public/audio/ch1-closing.mp3` | `ch1-closing.mp3` | 863337 | `ch1-closing` | ch1-closing | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 14 | `public/audio/ch1-conflict-scenario-complete.mp3` | `ch1-conflict-scenario-complete.mp3` | 248937 | `ch1-conflict-scenario-complete` | ppt-conflict-scenario | scenario-completion | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 15 | `public/audio/ch1-conflict-scenario-discussion-1.mp3` | `ch1-conflict-scenario-discussion-1.mp3` | 780581 | `ch1-conflict-scenario-discussion-1` | ppt-conflict-scenario | scenario-discussion | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 16 | `public/audio/ch1-conflict-scenario-discussion-2.mp3` | `ch1-conflict-scenario-discussion-2.mp3` | 626981 | `ch1-conflict-scenario-discussion-2` | ppt-conflict-scenario | scenario-discussion | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 17 | `public/audio/ch1-conflict-scenario-discussion-3.mp3` | `ch1-conflict-scenario-discussion-3.mp3` | 738576 | `ch1-conflict-scenario-discussion-3` | ppt-conflict-scenario | scenario-discussion | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 18 | `public/audio/ch1-conflict-scenario-question-2.mp3` | `ch1-conflict-scenario-question-2.mp3` | 120415 | `ch1-conflict-scenario-question-2` | ppt-conflict-scenario | scenario-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 19 | `public/audio/ch1-conflict-scenario-question-3.mp3` | `ch1-conflict-scenario-question-3.mp3` | 153016 | `ch1-conflict-scenario-question-3` | ppt-conflict-scenario | scenario-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 20 | `public/audio/ch1-conflict-scenario.mp3` | `ch1-conflict-scenario.mp3` | 816944 | `ch1-conflict-scenario` | ppt-conflict-scenario | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 21 | `public/audio/ch1-ethics-conflict-check-answer.mp3` | `ch1-ethics-conflict-check-answer.mp3` | 218217 | `ch1-ethics-conflict-check-answer` | ppt-ethics-conflict | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 22 | `public/audio/ch1-ethics-conflict-check-ask.mp3` | `ch1-ethics-conflict-check-ask.mp3` | 151135 | `ch1-ethics-conflict-check-ask` | ppt-ethics-conflict | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 23 | `public/audio/ch1-ethics-conflict.mp3` | `ch1-ethics-conflict.mp3` | 4862580 | `ch1-ethics-conflict` | ppt-ethics-conflict | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 24 | `public/audio/ch1-framework-check-answer.mp3` | `ch1-framework-check-answer.mp3` | 223860 | `ch1-framework-check-answer` | ppt-framework | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 25 | `public/audio/ch1-framework-check-ask.mp3` | `ch1-framework-check-ask.mp3` | 149254 | `ch1-framework-check-ask` | ppt-framework | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 26 | `public/audio/ch1-framework.mp3` | `ch1-framework.mp3` | 2397456 | `ch1-framework` | ppt-framework | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 27 | `public/audio/ch1-governance-compliance.mp3` | `ch1-governance-compliance.mp3` | 4261345 | `ch1-governance-compliance` | ppt-governance-compliance | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 28 | `public/audio/ch1-governance-models.mp3` | `ch1-governance-models.mp3` | 4286423 | `ch1-governance-models` | ppt-governance-models | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 29 | `public/audio/ch1-health-policies-check-answer.mp3` | `ch1-health-policies-check-answer.mp3` | 245176 | `ch1-health-policies-check-answer` | ch1-health-policies | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 30 | `public/audio/ch1-health-policies-check-ask.mp3` | `ch1-health-policies-check-ask.mp3` | 193140 | `ch1-health-policies-check-ask` | ch1-health-policies | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 31 | `public/audio/ch1-health-policies.mp3` | `ch1-health-policies.mp3` | 2673936 | `ch1-health-policies` | ch1-health-policies | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 32 | `public/audio/ch1-overview-check-answer.mp3` | `ch1-overview-check-answer.mp3` | 238906 | `ch1-overview-check-answer` | ch1-overview | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 33 | `public/audio/ch1-overview-check-ask.mp3` | `ch1-overview-check-ask.mp3` | 168062 | `ch1-overview-check-ask` | ch1-overview | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 34 | `public/audio/ch1-overview.mp3` | `ch1-overview.mp3` | 2581776 | `ch1-overview` | ch1-overview | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 35 | `public/audio/ch1-policy-activity-detail-1.mp3` | `ch1-policy-activity-detail-1.mp3` | 247056 | `ch1-policy-activity-detail-1` | ch1-policy-activity | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 36 | `public/audio/ch1-policy-activity-detail-2.mp3` | `ch1-policy-activity-detail-2.mp3` | 202544 | `ch1-policy-activity-detail-2` | ch1-policy-activity | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 37 | `public/audio/ch1-policy-activity-detail-3.mp3` | `ch1-policy-activity-detail-3.mp3` | 218217 | `ch1-policy-activity-detail-3` | ch1-policy-activity | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 38 | `public/audio/ch1-policy-activity-detail-4.mp3` | `ch1-policy-activity-detail-4.mp3` | 223860 | `ch1-policy-activity-detail-4` | ch1-policy-activity | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 39 | `public/audio/ch1-policy-activity-detail-5.mp3` | `ch1-policy-activity-detail-5.mp3` | 241414 | `ch1-policy-activity-detail-5` | ch1-policy-activity | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 40 | `public/audio/ch1-policy-activity.mp3` | `ch1-policy-activity.mp3` | 3873897 | `ch1-policy-activity` | ch1-policy-activity | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 41 | `public/audio/ch1-quiz-feedback-ch1-q1-correct.mp3` | `ch1-quiz-feedback-ch1-q1-correct.mp3` | 210694 | `ch1-quiz-feedback-ch1-q1-correct` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 42 | `public/audio/ch1-quiz-feedback-ch1-q1-incorrect.mp3` | `ch1-quiz-feedback-ch1-q1-incorrect.mp3` | 395014 | `ch1-quiz-feedback-ch1-q1-incorrect` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 43 | `public/audio/ch1-quiz-feedback-ch1-q2-correct.mp3` | `ch1-quiz-feedback-ch1-q2-correct.mp3` | 198782 | `ch1-quiz-feedback-ch1-q2-correct` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 44 | `public/audio/ch1-quiz-feedback-ch1-q2-incorrect.mp3` | `ch1-quiz-feedback-ch1-q2-incorrect.mp3` | 317901 | `ch1-quiz-feedback-ch1-q2-incorrect` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 45 | `public/audio/ch1-quiz-feedback-ch1-q3-correct.mp3` | `ch1-quiz-feedback-ch1-q3-correct.mp3` | 210694 | `ch1-quiz-feedback-ch1-q3-correct` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 46 | `public/audio/ch1-quiz-feedback-ch1-q3-incorrect.mp3` | `ch1-quiz-feedback-ch1-q3-incorrect.mp3` | 308496 | `ch1-quiz-feedback-ch1-q3-incorrect` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 47 | `public/audio/ch1-quiz-feedback-ch1-q4-correct.mp3` | `ch1-quiz-feedback-ch1-q4-correct.mp3` | 191259 | `ch1-quiz-feedback-ch1-q4-correct` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 48 | `public/audio/ch1-quiz-feedback-ch1-q4-incorrect.mp3` | `ch1-quiz-feedback-ch1-q4-incorrect.mp3` | 388745 | `ch1-quiz-feedback-ch1-q4-incorrect` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 49 | `public/audio/ch1-quiz-feedback-ch1-q5-correct.mp3` | `ch1-quiz-feedback-ch1-q5-correct.mp3` | 189378 | `ch1-quiz-feedback-ch1-q5-correct` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 50 | `public/audio/ch1-quiz-feedback-ch1-q5-incorrect.mp3` | `ch1-quiz-feedback-ch1-q5-incorrect.mp3` | 329185 | `ch1-quiz-feedback-ch1-q5-incorrect` | ch1-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 51 | `public/audio/ch1-quiz.mp3` | `ch1-quiz.mp3` | 529179 | `ch1-quiz` | ch1-quiz | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 52 | `public/audio/ch1-regulatory-framework.mp3` | `ch1-regulatory-framework.mp3` | 3818100 | `ch1-regulatory-framework` | ch1-regulatory-framework | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 53 | `public/audio/ch1-welcome.mp3` | `ch1-welcome.mp3` | 842021 | `ch1-welcome` | ch1-welcome | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 54 | `public/audio/ch2-action-plan-detail-1.mp3` | `ch2-action-plan-detail-1.mp3` | 218217 | `ch2-action-plan-detail-1` | ch2-action-plan | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 55 | `public/audio/ch2-action-plan-detail-2.mp3` | `ch2-action-plan-detail-2.mp3` | 206305 | `ch2-action-plan-detail-2` | ch2-action-plan | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 56 | `public/audio/ch2-action-plan-detail-3.mp3` | `ch2-action-plan-detail-3.mp3` | 304735 | `ch2-action-plan-detail-3` | ch2-action-plan | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 57 | `public/audio/ch2-action-plan.mp3` | `ch2-action-plan.mp3` | 2927220 | `ch2-action-plan` | ch2-action-plan | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 58 | `public/audio/ch2-closing.mp3` | `ch2-closing.mp3` | 917254 | `ch2-closing` | ch2-closing | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 59 | `public/audio/ch2-compliance-concept.mp3` | `ch2-compliance-concept.mp3` | 3389901 | `ch2-compliance-concept` | ch2-compliance-concept | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 60 | `public/audio/ch2-culture-check-answer.mp3` | `ch2-culture-check-answer.mp3` | 294704 | `ch2-culture-check-answer` | ch2-culture | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 61 | `public/audio/ch2-culture-check-ask.mp3` | `ch2-culture-check-ask.mp3` | 118534 | `ch2-culture-check-ask` | ch2-culture | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 62 | `public/audio/ch2-culture.mp3` | `ch2-culture.mp3` | 4371060 | `ch2-culture` | ch2-culture | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 63 | `public/audio/ch2-monitoring.mp3` | `ch2-monitoring.mp3` | 3845058 | `ch2-monitoring` | ch2-monitoring | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 64 | `public/audio/ch2-overview-check-answer.mp3` | `ch2-overview-check-answer.mp3` | 254580 | `ch2-overview-check-answer` | ch2-overview | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 65 | `public/audio/ch2-overview-check-ask.mp3` | `ch2-overview-check-ask.mp3` | 151135 | `ch2-overview-check-ask` | ch2-overview | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 66 | `public/audio/ch2-overview.mp3` | `ch2-overview.mp3` | 2241976 | `ch2-overview` | ch2-overview | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 67 | `public/audio/ch2-pdca-check-answer.mp3` | `ch2-pdca-check-answer.mp3` | 237025 | `ch2-pdca-check-answer` | ch2-pdca | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 68 | `public/audio/ch2-pdca-check-ask.mp3` | `ch2-pdca-check-ask.mp3` | 183736 | `ch2-pdca-check-ask` | ch2-pdca | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 69 | `public/audio/ch2-pdca.mp3` | `ch2-pdca.mp3` | 2660144 | `ch2-pdca` | ch2-pdca | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 70 | `public/audio/ch2-quiz-feedback-ch2-q1-correct.mp3` | `ch2-quiz-feedback-ch2-q1-correct.mp3` | 175585 | `ch2-quiz-feedback-ch2-q1-correct` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 71 | `public/audio/ch2-quiz-feedback-ch2-q1-incorrect.mp3` | `ch2-quiz-feedback-ch2-q1-incorrect.mp3` | 402537 | `ch2-quiz-feedback-ch2-q1-incorrect` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 72 | `public/audio/ch2-quiz-feedback-ch2-q2-correct.mp3` | `ch2-quiz-feedback-ch2-q2-correct.mp3` | 198782 | `ch2-quiz-feedback-ch2-q2-correct` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 73 | `public/audio/ch2-quiz-feedback-ch2-q2-incorrect.mp3` | `ch2-quiz-feedback-ch2-q2-incorrect.mp3` | 319781 | `ch2-quiz-feedback-ch2-q2-incorrect` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 74 | `public/audio/ch2-quiz-feedback-ch2-q3-correct.mp3` | `ch2-quiz-feedback-ch2-q3-correct.mp3` | 179974 | `ch2-quiz-feedback-ch2-q3-correct` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 75 | `public/audio/ch2-quiz-feedback-ch2-q3-incorrect.mp3` | `ch2-quiz-feedback-ch2-q3-incorrect.mp3` | 329185 | `ch2-quiz-feedback-ch2-q3-incorrect` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 76 | `public/audio/ch2-quiz-feedback-ch2-q4-correct.mp3` | `ch2-quiz-feedback-ch2-q4-correct.mp3` | 183736 | `ch2-quiz-feedback-ch2-q4-correct` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 77 | `public/audio/ch2-quiz-feedback-ch2-q4-incorrect.mp3` | `ch2-quiz-feedback-ch2-q4-incorrect.mp3` | 364294 | `ch2-quiz-feedback-ch2-q4-incorrect` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 78 | `public/audio/ch2-quiz-feedback-ch2-q5-correct.mp3` | `ch2-quiz-feedback-ch2-q5-correct.mp3` | 169943 | `ch2-quiz-feedback-ch2-q5-correct` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 79 | `public/audio/ch2-quiz-feedback-ch2-q5-incorrect.mp3` | `ch2-quiz-feedback-ch2-q5-incorrect.mp3` | 283419 | `ch2-quiz-feedback-ch2-q5-incorrect` | ch2-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 80 | `public/audio/ch2-quiz.mp3` | `ch2-quiz.mp3` | 475262 | `ch2-quiz` | ch2-quiz | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 81 | `public/audio/ch2-self-assessment-detail-1.mp3` | `ch2-self-assessment-detail-1.mp3` | 225741 | `ch2-self-assessment-detail-1` | ch2-self-assessment | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 82 | `public/audio/ch2-self-assessment-detail-2.mp3` | `ch2-self-assessment-detail-2.mp3` | 198782 | `ch2-self-assessment-detail-2` | ch2-self-assessment | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 83 | `public/audio/ch2-self-assessment-detail-3.mp3` | `ch2-self-assessment-detail-3.mp3` | 218217 | `ch2-self-assessment-detail-3` | ch2-self-assessment | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 84 | `public/audio/ch2-self-assessment-detail-4.mp3` | `ch2-self-assessment-detail-4.mp3` | 196901 | `ch2-self-assessment-detail-4` | ch2-self-assessment | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 85 | `public/audio/ch2-self-assessment-detail-5.mp3` | `ch2-self-assessment-detail-5.mp3` | 220098 | `ch2-self-assessment-detail-5` | ch2-self-assessment | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 86 | `public/audio/ch2-self-assessment.mp3` | `ch2-self-assessment.mp3` | 2873303 | `ch2-self-assessment` | ch2-self-assessment | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 87 | `public/audio/ch2-welcome.mp3` | `ch2-welcome.mp3` | 707856 | `ch2-welcome` | ch2-welcome | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 88 | `public/audio/ch3-closing.mp3` | `ch3-closing.mp3` | 1064585 | `ch3-closing` | ch3-closing | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 89 | `public/audio/ch3-overview-check-answer.mp3` | `ch3-overview-check-answer.mp3` | 206305 | `ch3-overview-check-answer` | ch3-overview | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 90 | `public/audio/ch3-overview-check-ask.mp3` | `ch3-overview-check-ask.mp3` | 179974 | `ch3-overview-check-ask` | ch3-overview | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 91 | `public/audio/ch3-overview.mp3` | `ch3-overview.mp3` | 2518456 | `ch3-overview` | ch3-overview | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 92 | `public/audio/ch3-quiz-feedback-ch3-q1-correct.mp3` | `ch3-quiz-feedback-ch3-q1-correct.mp3` | 185616 | `ch3-quiz-feedback-ch3-q1-correct` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 93 | `public/audio/ch3-quiz-feedback-ch3-q1-incorrect.mp3` | `ch3-quiz-feedback-ch3-q1-incorrect.mp3` | 335455 | `ch3-quiz-feedback-ch3-q1-incorrect` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 94 | `public/audio/ch3-quiz-feedback-ch3-q2-correct.mp3` | `ch3-quiz-feedback-ch3-q2-correct.mp3` | 153016 | `ch3-quiz-feedback-ch3-q2-correct` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 95 | `public/audio/ch3-quiz-feedback-ch3-q2-incorrect.mp3` | `ch3-quiz-feedback-ch3-q2-incorrect.mp3` | 292823 | `ch3-quiz-feedback-ch3-q2-incorrect` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 96 | `public/audio/ch3-quiz-feedback-ch3-q3-correct.mp3` | `ch3-quiz-feedback-ch3-q3-correct.mp3` | 156777 | `ch3-quiz-feedback-ch3-q3-correct` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 97 | `public/audio/ch3-quiz-feedback-ch3-q3-incorrect.mp3` | `ch3-quiz-feedback-ch3-q3-incorrect.mp3` | 265865 | `ch3-quiz-feedback-ch3-q3-incorrect` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 98 | `public/audio/ch3-quiz-feedback-ch3-q4-correct.mp3` | `ch3-quiz-feedback-ch3-q4-correct.mp3` | 151135 | `ch3-quiz-feedback-ch3-q4-correct` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 99 | `public/audio/ch3-quiz-feedback-ch3-q4-incorrect.mp3` | `ch3-quiz-feedback-ch3-q4-incorrect.mp3` | 294704 | `ch3-quiz-feedback-ch3-q4-incorrect` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 100 | `public/audio/ch3-quiz-feedback-ch3-q5-correct.mp3` | `ch3-quiz-feedback-ch3-q5-correct.mp3` | 195021 | `ch3-quiz-feedback-ch3-q5-correct` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 101 | `public/audio/ch3-quiz-feedback-ch3-q5-incorrect.mp3` | `ch3-quiz-feedback-ch3-q5-incorrect.mp3` | 384983 | `ch3-quiz-feedback-ch3-q5-incorrect` | ch3-quiz | quiz-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 102 | `public/audio/ch3-quiz.mp3` | `ch3-quiz.mp3` | 615696 | `ch3-quiz` | ch3-quiz | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 103 | `public/audio/ch3-risk-activity-detail-1.mp3` | `ch3-risk-activity-detail-1.mp3` | 196901 | `ch3-risk-activity-detail-1` | ch3-risk-activity | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 104 | `public/audio/ch3-risk-activity-detail-2.mp3` | `ch3-risk-activity-detail-2.mp3` | 212575 | `ch3-risk-activity-detail-2` | ch3-risk-activity | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 105 | `public/audio/ch3-risk-activity-detail-3.mp3` | `ch3-risk-activity-detail-3.mp3` | 265865 | `ch3-risk-activity-detail-3` | ch3-risk-activity | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 106 | `public/audio/ch3-risk-activity.mp3` | `ch3-risk-activity.mp3` | 3159814 | `ch3-risk-activity` | ch3-risk-activity | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 107 | `public/audio/ch3-risk-definition.mp3` | `ch3-risk-definition.mp3` | 3631899 | `ch3-risk-definition` | ch3-risk-definition | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 108 | `public/audio/ch3-risk-process-check-answer.mp3` | `ch3-risk-process-check-answer.mp3` | 229502 | `ch3-risk-process-check-answer` | ch3-risk-process | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 109 | `public/audio/ch3-risk-process-check-ask.mp3` | `ch3-risk-process-check-ask.mp3` | 193140 | `ch3-risk-process-check-ask` | ch3-risk-process | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 110 | `public/audio/ch3-risk-process.mp3` | `ch3-risk-process.mp3` | 4040663 | `ch3-risk-process` | ch3-risk-process | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 111 | `public/audio/ch3-risk-register.mp3` | `ch3-risk-register.mp3` | 3996777 | `ch3-risk-register` | ch3-risk-register | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 112 | `public/audio/ch3-welcome.mp3` | `ch3-welcome.mp3` | 767416 | `ch3-welcome` | ch3-welcome | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 113 | `public/audio/program-final-message.mp3` | `program-final-message.mp3` | 1383696 | `program-final-message` | program-final-message | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 114 | `public/audio/program-leadership-questions.mp3` | `program-leadership-questions.mp3` | 1811896 | `program-leadership-questions` | program-leadership-questions | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 115 | `public/audio/program-map.mp3` | `program-map.mp3` | 1387458 | `program-map` | program-map | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 116 | `public/audio/program-summary-check-answer.mp3` | `program-summary-check-answer.mp3` | 235145 | `program-summary-check-answer` | program-summary | activity-feedback | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 117 | `public/audio/program-summary-check-ask.mp3` | `program-summary-check-ask.mp3` | 133581 | `program-summary-check-ask` | program-summary | activity-question | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 118 | `public/audio/program-summary.mp3` | `program-summary.mp3` | 2393695 | `program-summary` | program-summary | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 119 | `public/audio/program-welcome.mp3` | `program-welcome.mp3` | 955497 | `program-welcome` | program-welcome | slide | USED_CURRENT | Required by src/data/audioScripts.ts. |
| 120 | `public/audio/slide-01.mp3` | `slide-01.mp3` | 165744 | `slide-01` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 121 | `public/audio/slide-02.mp3` | `slide-02.mp3` | 195696 | `slide-02` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 122 | `public/audio/slide-03.mp3` | `slide-03.mp3` | 211536 | `slide-03` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 123 | `public/audio/slide-04.mp3` | `slide-04.mp3` | 182592 | `slide-04` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 124 | `public/audio/slide-05.mp3` | `slide-05.mp3` | 178704 | `slide-05` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 125 | `public/audio/slide-06.mp3` | `slide-06.mp3` | 116784 | `slide-06` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 126 | `public/audio/slide-07.mp3` | `slide-07.mp3` | 192240 | `slide-07` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 127 | `public/audio/slide-08.mp3` | `slide-08.mp3` | 146736 | `slide-08` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 128 | `public/audio/slide-09.mp3` | `slide-09.mp3` | 200592 | `slide-09` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 129 | `public/audio/slide-10.mp3` | `slide-10.mp3` | 150480 | `slide-10` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 130 | `public/audio/slide-11.mp3` | `slide-11.mp3` | 173952 | `slide-11` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 131 | `public/audio/slide-12.mp3` | `slide-12.mp3` | 124272 | `slide-12` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 132 | `public/audio/slide-13.mp3` | `slide-13.mp3` | 127872 | `slide-13` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 133 | `public/audio/slide-14.mp3` | `slide-14.mp3` | 113040 | `slide-14` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 134 | `public/audio/slide-15.mp3` | `slide-15.mp3` | 75888 | `slide-15` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 135 | `public/audio/slide-16.mp3` | `slide-16.mp3` | 119376 | `slide-16` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 136 | `public/audio/slide-17.mp3` | `slide-17.mp3` | 93168 | `slide-17` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |
| 137 | `public/audio/slide-18.mp3` | `slide-18.mp3` | 184464 | `slide-18` | - | - | UNKNOWN | Kept because src/data/legacySlides.ts and courseRoutes.ts still preserve compliance-risk-ch1. |

## Dist Audio

`dist/audio` is generated by `npm run build` from `public/audio`. After cleanup and rebuild it should mirror the 137 source MP3 files: 119 current required files and 18 preserved legacy files. The SCORM manifest is generated from `dist`, so removed `ppt-*` and `audio-pilot` files are not included after packaging.
