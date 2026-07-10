// Shared between SlideStage.tsx (runtime) and audioScripts.ts (ElevenLabs
// catalog) so the audio that gets generated always matches what the player
// actually speaks. Keep in one place — do not duplicate.
export const CHECK_INTROS = [
  'طيب، قبل ما نكمل، وقفة سريعة عندي سؤال لك:',
  'خليني أتأكد إنك ماسك الفكرة معي:',
  'ثانية بس، عندي سؤال يوضح النقطة أكثر:',
  'وهنا أحب أختبر فهمك سريعًا:',
];
