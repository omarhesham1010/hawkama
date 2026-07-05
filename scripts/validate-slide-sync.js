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
let timing;
try {
  slidesModule = await server.ssrLoadModule('/src/data/slides.ts');
  audioModule = await server.ssrLoadModule('/src/data/audioScripts.ts');
  timing = await server.ssrLoadModule('/src/lib/storyTiming.ts');
} finally {
  await server.close();
}
const { slides } = slidesModule;

const { audioScripts, governanceFeedbackText, governanceQuestionText, conflictScenarioQuestions, conflictScenarioDiscussions } = audioModule;
const { storyCues, activeStoryCue, spokenFromAudioProgress, spokenFromTtsCue } = timing;
const catalog = new Map(audioScripts.map((entry) => [entry.key, entry]));
const narrationSource = await readFile('src/hooks/useNarration.ts', 'utf8');

check(slides.length === 8, `primary course has 8 slides (found ${slides.length})`);
check(catalog.size === audioScripts.length, 'audio catalog keys are unique');
check(
  narrationSource.includes('new SpeechSynthesisUtterance(script)'),
  'TTS receives the exact runtime script without text reconstruction',
);
check(
  !narrationSource.includes('queue.forEach') && !narrationSource.includes('TTS_LEAD_IN'),
  'TTS uses one continuous utterance without browser-inserted inter-sentence gaps',
);

for (const slide of slides) {
  const mainAudio = catalog.get(slide.audioKey);
  check(Boolean(mainAudio), `${slide.id}: main audio key exists`);
  check(mainAudio?.text === slide.narration, `${slide.id}: catalog text exactly matches runtime narration`);

  const cues = storyCues(slide.narration);
  check(cues.length > 0, `${slide.id}: narration has cues`);
  check(cues.every((cue) => cue.start >= 0 && cue.end > cue.start && cue.end <= slide.narration.length), `${slide.id}: cue bounds are valid`);
  check(cues.every((cue, index) => index === 0 || cue.start >= cues[index - 1].end), `${slide.id}: cues are ordered without overlap`);

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

const governanceSlide = slides.find((slide) => slide.id === 'ppt-activity-governance-or-compliance');
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

const scenarioSlide = slides.find((slide) => slide.id === 'ppt-conflict-scenario');
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

console.log(`Slide sync validation passed: ${checks.length} checks, ${slides.length} slides, ${audioScripts.length} audio scripts.`);
