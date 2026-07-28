// Shared between SlideStage.tsx (runtime) and audioScripts.ts (ElevenLabs
// catalog) so the audio that gets generated always matches what the player
// actually speaks. Keep in one place — do not duplicate.
export const CHECK_INTROS = [
  'قبل أن نكمل، وقفة سريعة: عندي سؤال يوضح الفكرة أكثر:',
  'دعنا نتأكد أنك استوعبت الفكرة معي:',
  'للحظة، عندي سؤال يوضح النقطة أكثر:',
  'وهنا أحب أن أختبر فهمك سريعًا:',
];
