# Chapter Production Playbook

This is the source of truth for future bags and chapters. It records the
decisions and fixes learned while producing the first governance bag.

## 1. Content Gate

1. Obtain the approved PowerPoint and identity deck.
2. Extract exact chapter names, slide order, headings, paragraphs, bullets,
   activities, outcomes, and source references.
3. Create a content coverage map before implementation.
4. Preserve every approved idea and visible term. Improve presentation and
   interaction, but do not invent or shorten learning content.
5. Replace classroom-only activities with e-learning interactions that preserve
   the same objective.
6. Get slide content and narration approved before generating audio.

## 2. Bag And Chapter Structure

- A bag introduction uses chapter number `0`.
- Each chapter has its own course ID and persisted progress.
- Canonical URLs use
  `#/bag/{bagNumber}/chapter/{chapterNumber}/slide/{slideNumber}`.
- Old links redirect without losing the slide number.
- A chapter contains welcome, overview, lessons, interactions, a five-question
  quiz, and a closing.
- The closing immediately follows the quiz and shows score, completion, three
  takeaways, Nasser's summary, and thanks.

Register new courses in `src/data/slides.ts`, `src/data/platformContent.ts`, and
`src/lib/courseRoutes.ts`. URLs must be unique.

## 3. Slide Design

- Match the approved PowerPoint identity, proportions, colors, logos, and
  top-left artwork.
- Keep content above identity artwork with explicit stacking order.
- Use a fixed slide canvas and scale the same desktop composition on phones.
- Slides do not scroll. Everything must fit inside the base slide.
- Increase the text itself where space is available; do not merely enlarge its
  box.
- Keep controls inside the slide and fully clickable.
- Avoid nested cards, wasted space, repeated emoji, and cramped content.
- Use varied reveal directions only when they support the content flow.
- Place contextual ornaments opposite Nasser and below content in stacking
  order. Decorations never block interaction.
- Verify logos do not overlap each other or Nasser.

## 4. Nasser Storytelling

- Nasser is a Saudi academic trainer, not a presentation reader.
- Open introductions with the appropriate Islamic greeting.
- Connect chapters by recalling the previous topic and explaining the new goal.
- Convert bullets into connected explanation while mentioning every visible
  word and concept.
- Vary sentence openings.
- Select left/right pose and expression from the current cue's meaning.
- Keep Nasser anchored at the bottom. The speech-bubble tail points toward him.
- Expand the bubble to fit; never truncate with an ellipsis.
- Hide the bubble after speech while Nasser may remain.
- Vocalized narration may contain Arabic diacritics, but the visible bubble
  strips them before rendering.

## 5. Interaction Pattern

- Nasser explains the activity and scenario first.
- Ask one question at a time.
- Wait for explicit learner input before revealing or discussing an answer.
- After selection, Nasser responds, explains why, then unlocks the next step.
- Never reveal every procedure or answer at once.
- Do not repeat the question when discussion is requested.
- Keep highlights active for the full audio cue.
- Unlock controls from narration completion, not an estimated timer.

## 6. Quiz Pattern

- Exactly five questions per chapter.
- Four options, one valid answer, explanation, and source per question.
- Passing score is 60 percent unless the approved source changes it.
- Nasser narrates correct and incorrect feedback.
- Keep Next locked while Nasser discusses the answer.
- Give every question and outcome its own feedback audio key.
- Flow the result into the following closing slide.

## 7. ElevenLabs Audio

Required environment:

```text
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
ELEVENLABS_MODEL_ID=eleven_v3
```

Production settings:

```text
stability: 1
similarity_boost: 0.78
output_format: mp3_44100_192
```

Workflow:

1. Store narration centrally in slide data and `src/data/audioScripts.ts`.
2. Normalize punctuation before synthesis.
3. Add Arabic diacritics when pronunciation needs control.
4. Pilot greetings, names, acronyms, and technical terms.
5. Split long scripts only at safe linguistic boundaries.
6. Generate through `scripts/generate-elevenlabs-audio.js`.
7. Save MP3 and character timestamps after every completed file.
8. Join chunks with FFmpeg and validate the final MP3 with FFprobe.
9. Reject real character mismatches in alignment.
10. Run `npm run sync-audio` to regenerate manifest and cache version.

The generator uses stable seeds, retries transient failures, stops on exhausted
quota, and resumes without regenerating completed aligned files. Do not use
`--force` unless narration, voice, pronunciation, or settings changed.

## 8. Synchronization

- MP3 playback is the master clock.
- Start animation only from the audio `playing` event.
- Use ElevenLabs character timestamps to calculate spoken text.
- Bubble text, active card, highlight, and reveal use the same spoken index.
- Never calculate them using separate intervals.
- Interactive feedback uses separate guided-audio keys and callbacks.
- Keep only a brief visual linger after audio.
- Preload current and next narration.
- Reuse the preloaded `Audio` object.
- Version MP3 URLs to defeat Safari/LMS caches after audio updates.

## 9. Mobile Audio

- Delivery requires fixed MP3 files for every key. Device TTS differs by phone.
- Confirm all files exist in `public/audio` and inside the SCORM ZIP.
- Start audio from a learner gesture where mobile autoplay requires it.
- Do not switch to device TTS when a fixed MP3 exists but autoplay is blocked.
- Test an iPhone viewport and a real iPhone or the target LMS.
- Upload the rebuilt SCORM package after audio changes; LMS content does not
  update automatically.

## 10. Loading Performance

- Preload only current and next audio, not the full bag.
- Keep MP3 at 44.1 kHz and 192 kbps.
- Use cache-busted stable URLs.
- Show loading without advancing dialogue or animation.
- Measure first-play startup on desktop and mobile after a clean cache.

## 11. Mandatory QA

Run:

```bash
npm run audio:check:strict
npm run sync-audio
npm run test:sync
npm run build
npm run package:scorm
```

Also verify:

- Every MP3 passes FFprobe and has complete character alignment.
- Narration covers every visible slide word.
- Reveals and highlights follow narration order.
- Activities wait for learner input and discuss every answer.
- Quiz feedback speaks before Next unlocks.
- Desktop and iPhone have no clipping, overlap, off-screen controls, or scroll.
- Delivery audio reports `ملف صوتي`, never device TTS.
- The ZIP has `imsmanifest.xml` and `index.html` at its root.
- The ZIP includes first, last, activity, quiz-feedback, and closing MP3s.
- Completion, score, resume, and suspend data work in an LMS test.

## 12. Delivery Gate

Do not deliver until content and narration are approved, audio is 100 percent,
sync validation and browser QA pass, the SCORM ZIP is rebuilt after the final
audio change, and the final commit is pushed.

Deliver `governance-scorm2004.zip` to the LMS client. Keep the source repository
for the development team.
