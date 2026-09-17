import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const failures = [];
const pass = (condition, message) => {
  if (!condition) failures.push(message);
};

const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
let data;
let introTiming;
let pptTiming;
try {
  data = await server.ssrLoadModule('/src/data/complianceEnforcementProgram.ts');
  introTiming = await server.ssrLoadModule('/src/lib/introTiming.ts');
  pptTiming = await server.ssrLoadModule('/src/lib/pptTiming.ts');
} finally {
  await server.close();
}

const slideGroups = [
  'ceIntroSlides',
  'ceUnitOneSlides',
  'ceUnitTwoSlides',
  'ceUnitThreeSlides',
  'ceUnitFourSlides',
  'ceUnitFiveSlides',
  'ceClosingSlides',
];
const slides = slideGroups.flatMap((key) => data[key]);
const slidesById = new Map(slides.map((slide) => [slide.id, slide]));

for (const [slideId, cues] of Object.entries(introTiming.course11IntroCues)) {
  const slide = slidesById.get(slideId);
  pass(Boolean(slide), `${slideId}: intro slide exists`);
  if (!slide) continue;
  pass(slide.layout === 'pptIntro', `${slideId}: uses the intro layout`);

  let after = 0;
  const positions = cues.map((cue) => {
    const position = introTiming.narrationCuePosition(slide.narration, cue, after);
    if (position >= 0) after = position + 1;
    return position;
  });
  pass(positions.every((position) => position >= 0), `${slideId}: every intro card has a spoken cue`);
  pass(
    positions.every((position, index) => index === 0 || position > positions[index - 1]),
    `${slideId}: intro cards follow Nasser's spoken order`,
  );

  // Regression for the original slide-1 defect: the old 78%-progress
  // fallback marked card 5 as visible while card 4 was still waiting,
  // and visiblePillars consequently jumped straight from 3 to 5. At every
  // point immediately before a cue, only the preceding cards may exist.
  positions.forEach((position, index) => {
    const visibleImmediatelyBefore = positions.filter((candidate) => candidate < position).length;
    const visibleAtCue = positions.filter((candidate) => candidate <= position).length;
    pass(visibleImmediatelyBefore === index, `${slideId}: card ${index + 1} cannot reveal before its spoken phrase`);
    pass(visibleAtCue === index + 1, `${slideId}: card ${index + 1} reveals alone at its spoken phrase`);
  });
}

let checkedCardSlides = 0;
for (const slide of slides) {
  const cards = [slide.ppt?.cards ?? [], ...(slide.ppt?.laterActs ?? [])].flat();
  if (!cards.length || slide.layout === 'pptIntro') continue;
  checkedCardSlides += 1;

  const offsets = pptTiming.pptCardRevealOffsets(cards, slide.narration, false);
  pass(offsets[0] > 0, `${slide.id}: first card waits for its spoken cue`);
  pass(
    offsets.every((offset, index) => offset > 0 && offset < slide.narration.length && (index === 0 || offset > offsets[index - 1])),
    `${slide.id}: cards have distinct, ordered narration offsets`,
  );
}
pass(checkedCardSlides > 0, 'Course 11 contains card-led slides to validate');

const slideStageSource = await readFile('src/components/player/SlideStage.tsx', 'utf8');
pass(
  slideStageSource.includes('isMotionLedSlide = isEmergencySlide || isCourse1Slide || isCourse11Slide'),
  'Course 11 hides cards until their narration offsets are reached',
);
pass(
  slideStageSource.includes('!(isLicensingSlide || isCourse11Slide)'),
  'Course 11 does not force the first card to reveal at narration start',
);

if (failures.length) {
  console.error(`Course 11 sync validation failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Course 11 sync validation passed: ${Object.keys(introTiming.course11IntroCues).length} intro slides and ${checkedCardSlides} card-led slides.`);
}
