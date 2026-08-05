# Recipe for building course/4 & course/5 slide-data files

This is the concrete pattern extracted from `src/data/licensingProgram.ts` (course/3)
and `src/course1/data/governanceProgram.ts` (course/1) — the client explicitly said
these two are the quality bar to match/exceed. Follow this exactly.

## Scope of this task

Build ONE new TypeScript data file only:
- course/4 (إعداد السياسات والأنظمة واللوائح): `src/data/policyProgram.ts`
- course/5 (حوكمة القطاع الصحي): `src/data/governance2Program.ts`

Do NOT touch routing (`App.tsx`, `src/data/slides.ts`), do NOT create shell
components, do NOT run any ElevenLabs audio generation. Those are handled
separately after this file is reviewed. Your only deliverable is the data file,
typechecking clean.

## Source narration — use verbatim, do not rewrite

The narration text has ALREADY been through client review and formal-Arabic
correction. Your job is to structure it into slides/acts/cards, not to rephrase
sentences. Copy the narration paragraphs verbatim into each slide's `narration`
field (per-slide granularity — one slide's `[Normal]` paragraph after its
`[Heading 3] النص الأساسي` marker = that slide's full `narration` string).

The plain-text export (`[Heading 1]` = bag/unit title, `[Heading 2]` = slide
title, `[Heading 3]` = block label, `[Normal]` = the actual text) is at:
- course/4: `docs/course4-revised-plain.txt`
- course/5: `docs/course5-revised-plain.txt`

Read the WHOLE file for your course before writing any code. Every `### الشريحة`
in the source becomes one `Slide`. Every "رد فعل / مناقشة" becomes that
activity's discussion note. Every "رد فعل الاختبار" pair (صحيح/غير صحيح) becomes
that quiz question's `explanation` (see Quiz section below — the two feedback
variants collapse into one `explanation` field plus the option text itself).

## Required imports / helpers (copy from licensingProgram.ts)

```ts
import type { Slide, PptCard, PptLayout } from '../types/slides';
import type { ActivityData, QuizData } from '../types/course';
```

Re-implement (or literally copy, they're pure helpers with no external state)
these functions from the top of `src/data/licensingProgram.ts`:
- `indexSlides(items)` — assigns 1-based `index` to a slide array.
- `makeSlide({ id, audioKey, title, narration, visual, layout, cards, laterActs, actLayouts, kind, courseName, subtitle, unitTitle, intro, prompt, checks, activityLabel, activity })` — the workhorse. Read the real one in licensingProgram.ts for the exact field passthrough (it is simpler than course/1's fork — no bridge-phrase injection, narration is used as-is).
- `makeQuizSlide({ id, audioKey, title, narration, quiz, activityLabel, visual })` — for pre-test/post-test/unit-quiz slides, `kind: 'quiz'`.
- `makeChapterClosing({ id, audioKey, title, narration, takeaways })` — for the bag's final closing slide only (`takeaways` is 3-4 `{ icon: IconKey, title, text }` entries summarizing the WHOLE bag).

## audioKey convention

Course/4 uses prefix `bag4-`, course/5 uses prefix `bag5-`, mirroring course/3's
`bag3-ch{unit}-s{slide}-{slug}` pattern exactly, e.g.:
- `bag4-ch0-s1-welcome`, `bag4-ch0-s2-map`, `bag4-ch0-s3-pre-test`
- `bag4-ch1-s1-welcome`, `bag4-ch1-s1b-goals`, `bag4-ch1-s2-{topic-slug}`, `bag4-ch1-s3-activity-1`, ...
- `bag4-ch1-s9-quiz` (unit quiz), `bag4-ch1-s10-closing` (unit closing)
- `bag4-ch5-s10-post-test`, `bag4-ch5-s11-closing` (bag closing)

Quiz feedback audio keys follow course/3's pattern:
`{slide-audioKey}-feedback-{questionId}-correct` / `-incorrect` — but you do not
need to invent these explicitly; `makeQuizSlide` + the `QuizQuestion` schema
below only needs `explanation` text, the app derives feedback keys at runtime.

## Bag structure (top level)

```
مقدمة الحقيبة (intro):
  - {slug}-welcome   (kind: 'welcome', layout: 'pptIntro')
  - {slug}-map       (layout: 'pptTimeline', cards: unitMapCards — one per unit, 5 cards)
  - {slug}-pre-test  (makeQuizSlide, 5 questions, passScore doesn't matter for pre-test framing but QuizData still requires it — use 60)

الوحدة الأولى..الخامسة (one export const per unit, e.g. `policyUnitOneSlides`):
  - {slug}-u{N}-welcome  (kind: 'welcome', layout: 'pptIntro', intro: pipe-joined 3 محاور names)
  - {slug}-u{N}-goals    (layout: 'pptThreeColumns', 3 cards = the 3 "ستكون قادرًا على" clauses from goals narration)
  - for each of the unit's 3 محاور:
      - content slide (see "Act-splitting" below — this is the quality-critical part)
      - activity slide (kind: 'activity', activity: TrueFalseData built from the source's "راجع كل عبارة" narration — see Activities below)
  - {slug}-u{N}-quiz     (makeQuizSlide, 5 questions from the unit's "اختبار الوحدة" block, passScore: 60)
  - {slug}-u{N}-closing  (plain makeSlide, kind not set / 'content', narration = the unit's ختام block, layout 'pptConclusion' or 'pptSpotlight' with one summary card)

خاتمة الحقيبة (closing, e.g. `policyClosingSlides`):
  - {slug}-post-test  (makeQuizSlide, 8 questions, passScore: 60)
  - {slug}-closing    (makeChapterClosing, takeaways = 3-4 items covering the whole bag)
```

Export each group as `indexSlides([...])`, named exactly like course/3's
`licensingIntroSlides` / `licensingUnitOneSlides` / ... / `licensingClosingSlides`
but with your course's prefix (`policy*` for course/4, `governance2*` for
course/5 — do not reuse `governance*` bare, it collides with the existing
course/1 fork's naming).

## Act-splitting — THE quality-critical part

This is what the client means by "تقسيم ذكيه جدا للشوتات" and "كترها بيبقى حلو".
A single content slide's narration paragraph (150-400+ words) must NOT render
as one static wall of text/cards for its whole duration. Split it into multiple
`laterActs` (each act = one visual "shot" that takes over the screen as Nasser's
narration reaches that part), with `actLayouts` naming a different layout per
act so consecutive shots never look the same.

Real example from licensingProgram.ts (`lic-u1-data-sources`, narration ~230
words covering 3 data-source types + a validation sub-topic + an analysis
sub-topic + an evidence sub-topic):

```ts
cards: [unit1DataSourceCards[0]],
laterActs: [
  [unit1DataSourceCards[1]],
  [unit1DataSourceCards[2]],
  [{ title: 'التحقق من موثوقية البيانات', subtitle: '...', bullets: [...4 items...], tone: 'gold' }],
  [{ title: 'من التحليل إلى القرار', subtitle: '...', bullets: [...3 items...] }],
  [{ title: 'الأدلة التنظيمية', subtitle: '...', bullets: [...4 items...], tone: 'gold' }],
],
actLayouts: ['pptSpotlight', 'pptSpotlight', 'pptSpotlight', 'pptSpotlight', 'pptSpotlight', 'pptSpotlight'],
```

Six acts from one narration paragraph. Another example (`lic-u1-kpis`) mixes
layouts and even groups two related sub-points into one two-panel act:

```ts
actLayouts: ['pptSpotlight', 'pptSpotlight', 'pptSpotlight', 'pptSpotlight', 'pptTwoPanels', 'pptSpotlight'],
```

And course/1's `ch1-regulatory-framework` shows a 7-act breakdown using
`cardsFromBullets()` to explode one card's `bullets` array into N separate
single-bullet acts (each becomes its own shot):

```ts
function cardsFromBullets(card: PptCard, bullets: string[], syncText?: string): PptCard[] {
  return bullets.map((bullet, index) => {
    const { title, text } = splitBulletCardText(bullet); // "Title: detail" -> {title, text}; else title=bullet
    return {
      ...card,
      index: String(index + 1).padStart(2, '0'),
      title, text,
      summary: text ?? singleBulletSummary(title, card.title),
      bullets: undefined,
      syncText: index === 0 ? (syncText ?? title) : title,
      tone: index % 2 === 0 ? card.tone : 'gold',
    };
  });
}
```

**Rules to apply on every content slide:**
1. Identify every distinct enumerated concept/list/named-model in the
   narration paragraph (the source scripts are dense with these — e.g. "ثلاثة
   أبعاد: القوة، والمشروعية، والإلحاح" or "أربعة مستويات: ..." or "خمسة
   مستويات: الإخبار، الاستشارة، ...").
2. Give EACH distinct concept its own act (its own `PptCard` or small
   `PptCard[]`), not a shared grid. Long narration paragraphs (this project's
   scripts run 150-400+ words per content slide) should produce **5-8 acts**,
   not 2-3 — err toward more, smaller shots. This is what "شوتات كتيرة" means.
3. Rotate `actLayouts` so NO TWO CONSECUTIVE acts share a layout. Available:
   `pptSpotlight` (one hero card, best for a single concept/definition),
   `pptMatrix` (grid, good for 3-6 parallel items, renders bullets visibly),
   `pptTimeline` (numbered sequence, use when the source says "خطوات"/"مراحل"/ordered),
   `pptTwoPanels` (exactly 2 cards, good for a compare/contrast pair),
   `pptThreeColumns` (3 short cards, good for goals-style triads).
4. Every card needs a real `subtitle` (one paraphrased sentence, ~15-25 words,
   summarizing what that card covers — never leave a card as bare title +
   bullets with no explanatory sentence; this was a specific client complaint
   on an earlier pass: "مفيش شرح كافي ملخص في المربعات"). `bullets` (3-5 short
   phrases) supplement the subtitle, they don't replace it.
5. `tone: 'gold'` on alternating/every-other card for visual rhythm (see
   examples above) — don't make every card the same tone.
6. First card of the slide's first act should be a short framing/orientation
   card (like `chapterOneOverview[0]` "مسار الفصل" or the opening sentence of
   the محور) when the narration opens with a general statement before listing
   specifics — gives the viewer a beat to orient before the list starts.

## Activities ("نشاط" slides)

Every "نشاط" slide in the source script says "راجع كل عبارة وحدد إن كانت صحيحة
أم خاطئة" (true/false review) or poses a scenario/decision question. For the
"راجع كل عبارة" ones (the majority), build a `TrueFalseData`:

```ts
const unitNTrueFalseA: ActivityData = {
  kind: 'trueFalse',
  statements: [
    { id: 'u{N}-t1', text: '...a true or false claim drawn from the محور content just narrated...', answer: true, explanation: '...why, citing the real concept...' },
    { id: 'u{N}-t2', text: '...', answer: false, explanation: '...' },
    // 3-4 statements per activity
  ],
};
```

Write the statements yourself (they are not in the source script verbatim —
the script just says "activity tests your understanding of X"), grounded
strictly in the real content of the محور the activity follows. Each unit has 3
activities (one per محور) — vary correct/incorrect mix, don't make them all
answer `true`.

The activity SLIDE itself (`kind: 'activity'`) still needs its own `narration`
= the source script's activity-intro paragraph verbatim, plus one small `cards`
array (single orienting card, same pattern as `lic-u1-activity-1` above) and
`activityLabel: 'نشاط تفاعلي · صواب أو خطأ'`.

For the handful of "نشاط" slides in the source that pose a scenario/decision
question instead of "راجع كل عبارة" (e.g. course/4 unit 2 slide 8 "التقييم
المسبق مقابل اللاحق", unit 3 slide 8 "هيكل وثيقة السياسة") — these can also be
built as `trueFalse` with statements testing the same distinction discussed in
the scenario, for consistency and lower risk (the `scenarioDecision` activity
kind requires more fields — `identify.options`, `correctPath`, etc. — only use
it if you have time to fill it out completely and correctly; `trueFalse` is
the safe default used for every activity in this recipe).

## Quiz questions

Every unit quiz + the pre-test + post-test have their correct/incorrect
feedback text already written in the source script — you have BOTH the
correct explanation AND what the wrong-answer feedback says the right answer
is. Combine into one `QuizQuestion`:

```ts
{
  id: 'u1-q1',
  prompt: '...write a question whose correct answer is the concept named in the "صحيح" feedback...',
  options: ['...', '...', '...', '...'], // 4 options, one matching the "الإجابة الصحيحة هي: X" text
  correctIndex: 0, // index of the matching option
  explanation: '...the "ممتاز، إجابتك صحيحة. ..." sentence from the source, verbatim...',
  source: 'دليل المتدرب — {unit/محور name}',
}
```

The source script gives you the ANSWER (via the صحيح feedback) but not the
other 3 wrong options or the question wording — write a clear, unambiguous
prompt and 3 plausible-but-wrong distractors grounded in real adjacent
concepts from the same محور (never invent a distractor that contradicts real
content). `passScore: 60` for every quiz (unit quizzes, pre-test, post-test)
per project convention.

## Icons & visuals

Do NOT invent new icon assets. Use `visual: '<single emoji>'` per slide (see
any example above — course/3 uses one thematic emoji per slide: 📊, 🗂️, 🎯,
🧠, etc.) matching the slide's topic. For `takeaways` in `makeChapterClosing`,
`icon: IconKey` must be one of the existing keys in `src/types/course.ts`
(`shield`, `layers`, `building`, `flow`, `integrity`, `alert`, `flag`, `chart`,
`cycle`, `handshake`, `gavel`, `scale`, `compass`, `book`, `target`, etc.) —
pick whichever fits, don't add new ones.

A reference set of the source PDFs' own brand imagery (MOH "أبعاد" capability
-development mark, dark green/gold geometric identity, icon set) was extracted
to `docs/brand-assets-from-source-pdfs/` for context on the ministry's visual
language (dark green `#0d2e21`-ish + gold accents) — this is background
context only, not assets to wire in; the app's existing dark-green/gold theme
and `public/icons/moh-library/` (66 icons) already match this identity.

## Verification before you're done

1. `npx tsc -b` from the repo root must be clean (no new errors attributable
   to your file).
2. Grep your own file for `narration:` and cross-check every string against
   `docs/course{4,5}-revised-plain.txt` — every `[Normal]` paragraph under a
   `النص الأساسي` heading in the source must appear verbatim as some slide's
   `narration`. Nothing skipped, nothing paraphrased.
3. Count slides: intro (3) + 5×(welcome+goals+3×(content+activity)+quiz+closing = 10) + closing (2) = 55 slides, matching the source's own "55 شريحة" stated in course3.md-style headers.
4. Spot-check that no slide has fewer than 3 acts unless its narration is
   genuinely short (goals/welcome/activity/quiz slides are fine with 1 act;
   every محور content slide should have 4+ acts).
