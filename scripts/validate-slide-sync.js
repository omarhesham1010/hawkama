import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';

const failures = [];
const checks = [];

function check(condition, message) {
  if (condition) checks.push(message);
  else failures.push(message);
}

const server = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true } });
let slidesModule;
let audioModule;
let alignmentModule;
let timing;
let pptTiming;
let manifestModule;
try {
  slidesModule = await server.ssrLoadModule('/src/data/slides.ts');
  audioModule = await server.ssrLoadModule('/src/data/audioScripts.ts');
  alignmentModule = await server.ssrLoadModule('/src/data/audioAlignments.ts');
  manifestModule = await server.ssrLoadModule('/src/data/audioManifest.ts');
  timing = await server.ssrLoadModule('/src/lib/storyTiming.ts');
  pptTiming = await server.ssrLoadModule('/src/lib/pptTiming.ts');
} finally {
  await server.close();
}
const { slides, allNarratedSlides } = slidesModule;

const { audioScripts, governanceFeedbackText, governanceQuestionText, conflictScenarioQuestions, conflictScenarioDiscussions } = audioModule;
const { audioAlignments } = alignmentModule;
const { hasAudio } = manifestModule;
const { storyCues, activeStoryCue, spokenFromAudioProgress, spokenFromTtsCue, ttsChunks } = timing;
const { pptCardCueIndexes, scorePptCardCue } = pptTiming;
const catalog = new Map(audioScripts.map((entry) => [entry.key, entry]));
const narrationSource = await readFile('src/hooks/useNarration.ts', 'utf8');
const slideStageSource = await readFile('src/components/player/SlideStage.tsx', 'utf8');
const slidePlayerSource = await readFile('src/SlidePlayer.tsx', 'utf8');

function spokenWords(value) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

check(slides.length === 12, `chapter one has 12 slides including its quiz (found ${slides.length})`);
check(allNarratedSlides.length === 33, `governance bag has 33 slides including three quizzes (found ${allNarratedSlides.length})`);
check(catalog.size === audioScripts.length, 'audio catalog keys are unique');
const quizSlides = allNarratedSlides.filter((slide) => slide.kind === 'quiz');
check(quizSlides.length === 3, `one quiz exists at the end of each chapter (found ${quizSlides.length})`);
for (const slide of quizSlides) {
  const questions = slide.quiz?.questions ?? [];
  check(questions.length === 5, `${slide.id}: quiz contains exactly 5 questions`);
  check(new Set(questions.map((question) => question.id)).size === questions.length, `${slide.id}: question IDs are unique`);
  check(
    questions.every(
      (question) =>
        question.options.length === 4 &&
        question.correctIndex >= 0 &&
        question.correctIndex < question.options.length &&
        Boolean(question.explanation.trim()) &&
        Boolean(question.source.trim()),
    ),
    `${slide.id}: every question has four options, a valid answer, explanation, and source`,
  );
  check(slide.quiz?.passScore === 60, `${slide.id}: passing score is 60%`);
}
for (const entry of audioScripts) {
  if (!hasAudio(entry.key)) {
    check(!audioAlignments[entry.key], `${entry.key} correctly uses TTS until its ElevenLabs file is generated`);
    continue;
  }
  const alignment = audioAlignments[entry.key];
  check(Boolean(alignment?.anchors?.length), `${entry.key} has timestamp anchors`);
  if (!alignment?.anchors?.length) continue;
  let previousIndex = -1;
  let previousStart = -1;
  for (const [sourceIndex, start, end] of alignment.anchors) {
    check(sourceIndex >= previousIndex, `${entry.key} source indexes are monotonic`);
    check(start >= previousStart, `${entry.key} timestamps are monotonic`);
    check(end >= start, `${entry.key} character timestamp has a valid duration`);
    check(sourceIndex >= 0 && sourceIndex < entry.text.length, `${entry.key} timestamp maps inside its transcript`);
    previousIndex = sourceIndex;
    previousStart = start;
  }
  check(previousIndex >= entry.text.trimEnd().length - 2, `${entry.key} timestamps cover the complete transcript`);
}
check(
  narrationSource.includes('ttsChunks(script)'),
  'TTS uses fast-start chunks instead of waiting to prepare a full long narration',
);
check(
  !narrationSource.includes('TTS_LEAD_IN'),
  'TTS does not add any prefix or suffix to narration text',
);
check(
  narrationSource.includes('speakChunk(index + 1)') && !narrationSource.includes('chunks.forEach'),
  'TTS queues each following chunk only after the current chunk ends',
);
check(
  narrationSource.includes('ttsStartGuardRef') && narrationSource.includes('speakChunk(index, retry + 1)'),
  'TTS automatically resets and retries if the first audible start stalls',
);
check(
  narrationSource.includes('new Audio(`${base}audio/${key}.mp3`)') &&
    narrationSource.includes("audio.addEventListener('playing'") &&
    narrationSource.includes("setSource('audio')"),
  'existing manifest keys load their exact MP3 path and start the visual clock only from the playing event',
);
check(
  narrationSource.includes('if (!hasAudio(key))') && narrationSource.includes('speakTts(script, key)'),
  'browser TTS is reserved for keys that are missing from the audio manifest',
);
check(
  !slideStageSource.includes('key={`${guide.key}-${dialogueOverride'),
  'Nasser dialogue updates in place without remounting and replaying its entrance animation',
);
check(
  slidePlayerSource.includes('key={`${slide.id}#${replayNonce}`}'),
  'replay remounts the slide so stale activity dialogue and answers cannot survive',
);
check(
  slideStageSource.includes('activeStoryCue(line, sync.spoken)') &&
    !slideStageSource.includes('muted || !narration.ttsSupported'),
  'guided activity dialogue follows the active spoken cue and MP3 playback does not depend on browser TTS support',
);
check(
  slidePlayerSource.includes('dialogueHolding') && slideStageSource.includes('lingerTimerRef'),
  'the final Nasser cue remains readable briefly after main and guided audio completes',
);

for (const slide of allNarratedSlides) {
  const mainAudio = catalog.get(slide.audioKey);
  check(Boolean(mainAudio), `${slide.id}: main audio key exists`);
  check(mainAudio?.text === slide.narration, `${slide.id}: catalog text exactly matches runtime narration`);

  const cues = storyCues(slide.narration);
  const chunks = ttsChunks(slide.narration);
  check(cues.length > 0, `${slide.id}: narration has cues`);
  check(cues.every((cue) => cue.text.length <= 118), `${slide.id}: dialogue cues stay compact enough for Nasser's box`);
  check(cues.every((cue) => cue.start >= 0 && cue.end > cue.start && cue.end <= slide.narration.length), `${slide.id}: cue bounds are valid`);
  check(cues.every((cue, index) => index === 0 || cue.start >= cues[index - 1].end), `${slide.id}: cues are ordered without overlap`);

  if (slide.ppt?.cards && !['pptActivitySort', 'pptScenario'].includes(slide.layout)) {
    const indexes = pptCardCueIndexes(slide.ppt.cards, slide.narration);
    check(
      indexes.every((cueIndex, index) => index === 0 || cueIndex > indexes[index - 1]),
      `${slide.id}: cards reveal once and in presentation order`,
    );
    indexes.forEach((cueIndex, cardIndex) => {
      check(
        scorePptCardCue(slide.ppt.cards[cardIndex], cues[cueIndex]?.text ?? '') >= 5,
        `${slide.id}: card ${cardIndex + 1} starts on a matching narration cue`,
      );
    });
  }
  check(chunks.map((chunk) => chunk.text).join('') === slide.narration, `${slide.id}: TTS chunks reconstruct the exact narration character for character`);
  check(chunks[0]?.text.length <= 96, `${slide.id}: first TTS chunk is short enough for immediate startup`);
  check(chunks.slice(1).every((chunk) => chunk.text.length <= 220), `${slide.id}: following TTS chunks fit Nasser's dialogue box`);

  if (slide.ppt) {
    const visibleFields = [
      slide.title,
      slide.ppt.courseName,
      slide.ppt.subtitle,
      slide.ppt.unitTitle,
      slide.ppt.intro,
      slide.ppt.prompt,
      ...(slide.ppt.cards ?? []).flatMap((card) => [card.title, card.text, ...(card.bullets ?? [])]),
    ].filter(Boolean);
    const spokenCorpus = audioScripts
      .filter((entry) => entry.relatedSlide === slide.id)
      .map((entry) => entry.text)
      .join(' ');
    const corpusWords = new Set(spokenWords(spokenCorpus));
    const missingWords = [...new Set(visibleFields.flatMap((field) => spokenWords(field)))].filter(
      (word) => !/\d/.test(word) && !corpusWords.has(word),
    );
    check(
      missingWords.length === 0,
      `${slide.id}: Nasser covers every visible slide word${missingWords.length ? ` (missing: ${missingWords.join(', ')})` : ''}`,
    );
  }

  let previous = -1;
  let monotonic = true;
  for (let sample = 0; sample <= 1000; sample += 1) {
    const spoken = spokenFromAudioProgress(slide.narration, sample / 1000);
    if (spoken < previous || spoken < 0 || spoken > slide.narration.length) monotonic = false;
    previous = spoken;
    const state = activeStoryCue(slide.narration, spoken);
    if (!state?.cue?.text) monotonic = false;
  }
  check(monotonic, `${slide.id}: MP3 progress, bubble cues, and animation position stay monotonic`);

  for (const cue of cues) {
    const start = spokenFromTtsCue(cue.start, cue.end, 0, 1);
    const finish = spokenFromTtsCue(cue.start, cue.end, 999, 1);
    check(start === cue.start && finish === cue.end, `${slide.id}: TTS cue ${cue.start}-${cue.end} is clamped to its own text`);
  }
}

const governanceSlide = allNarratedSlides.find((slide) => slide.id === 'ppt-activity-governance-or-compliance');
const governanceCards = governanceSlide?.ppt?.cards ?? [];
check(governanceCards.length === 4, `governance activity has 4 questions (found ${governanceCards.length})`);
governanceCards.forEach((card, index) => {
  const number = index + 1;
  if (index > 0) {
    const key = `${governanceSlide.audioKey}-question-${number}`;
    check(catalog.get(key)?.text === governanceQuestionText(card, index, governanceCards.length), `${key}: question text matches runtime`);
  }
  for (const correctness of ['correct', 'incorrect']) {
    const answer = correctness === 'correct' ? card.answer : card.answer === 'حوكمة' ? 'امتثال' : 'حوكمة';
    const key = `${governanceSlide.audioKey}-feedback-${number}-${correctness}`;
    check(catalog.get(key)?.text === governanceFeedbackText(card, answer), `${key}: feedback text matches runtime`);
  }
});

const scenarioSlide = allNarratedSlides.find((slide) => slide.id === 'ppt-conflict-scenario');
const scenarioSteps = (scenarioSlide?.ppt?.cards?.length ?? 1) - 1;
check(conflictScenarioQuestions.length === scenarioSteps, `scenario has ${scenarioSteps} question scripts`);
check(conflictScenarioDiscussions.length === scenarioSteps, `scenario has ${scenarioSteps} discussion scripts`);
for (let index = 0; index < scenarioSteps; index += 1) {
  if (index > 0) {
    const questionKey = `${scenarioSlide.audioKey}-question-${index + 1}`;
    check(catalog.get(questionKey)?.text === conflictScenarioQuestions[index], `${questionKey}: question text matches runtime`);
  }
  const discussionKey = `${scenarioSlide.audioKey}-discussion-${index + 1}`;
  check(catalog.get(discussionKey)?.text === conflictScenarioDiscussions[index], `${discussionKey}: discussion text matches runtime`);
}
check(catalog.has(`${scenarioSlide.audioKey}-complete`), 'scenario completion audio key exists');

if (failures.length) {
  console.error(`Slide sync validation failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Slide sync validation passed: ${checks.length} checks, ${allNarratedSlides.length} slides, ${audioScripts.length} audio scripts.`);
