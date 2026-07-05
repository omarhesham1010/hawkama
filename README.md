# وحدة الحوكمة الصحية التفاعلية — الفصل الأول

> Premium Arabic (RTL) interactive e‑learning module — **نماذج وهياكل الحوكمة الصحية**
> Built from the source presentation `الحوكمة-تعليم-الكتروني-الفصل-الاول.pptx`.

وحدة تدريبية تفاعلية كاملة تحوّل محتوى العرض التقديمي إلى تجربة تعلّم إلكترونية احترافية
جاهزة لأنظمة إدارة التعلّم (LMS): دروس، أنشطة وألعاب تدريبية، محاكاة قرار، اختبار معرفة،
شرح صوتي، تتبّع تقدّم، ووضعان فاتح وداكن.

---

## ✨ أبرز الميزات / Features

- **مشغّل شرائح بأسلوب Articulate Storyline**: الفصل يُعرض شريحةً شريحة، وتظهر عناصر كل شريحة تدريجياً **بالتزامن مع السرد الصوتي** (Timeline)، مع أزرار: تشغيل/إيقاف · إعادة الشريحة · التالي/السابق · كتم الصوت · قائمة الشرائح · شريط تقدّم ورقم الشريحة.
- **مقاس بوربوينت ثابت 16:9 بلا أي تمرير (Scroll)**: الشريحة مصمّمة على مسطّح 1280×720 ويُكبَّر/يُصغَّر ليملأ أي شاشة دون سكرول.
- **روابط قابلة للمشاركة (Deep links)**: يتغيّر الرابط حسب موضعك (`#/course/5`)، فيمكنك إرسال رابط الفصل ليفتح **مباشرة** دون المرور بالصفحة الرئيسية.
- **شرح صوتي فوري بصوت رجل**: يبدأ بلا تأخير، ويُفضّل صوتاً عربياً ذكورياً («Shaker»/Naayf) مع معالجة انقطاع الأصوات الطويلة؛ ودعم ملفات MP3 حقيقية + اختيار الصوت والسرعة. **البطاقات تُقرأ صوتياً تلقائياً عند قلبها.**
- **أنشطة تفاعلية حقيقية**: **سحب وإفلات (Drag & Drop)** يعمل على الحاسب والجوال، وترتيب، ومحاكاة قرار، وبطاقات صوتية، واختبار معرفة مُقيَّم مع تفسيرات وكونفيتي.
- **هوية موحّدة فاخرة**: مزيج أخضر + تركوازي + ذهبي من العرض التقديمي (بلا وضع داكن)، إيموجي ورسومات رقمية تُوضّح المعاني وتُغني عن الصور، وخلفية متحركة أنيقة.
- **محتوى مبني على البيانات** (`slides.ts`) يسهل تعديله، مع سرد **يغطي كل النص المكتوب** على الشريحة.

> **ملاحظة عن الكتالوج:** عناوين الحقائب والفصول في الصفحة الرئيسية هي عناصر كتالوج تنظيمية (Placeholders) وليست محتوى تعليمياً — المحتوى التعليمي الحقيقي هو الفصل الأول فقط، المأخوذ بأمانة من العرض التقديمي.

---

## 🧱 التقنيات / Tech Stack

Vite · React 18 · TypeScript · Tailwind CSS · Web Speech API · LocalStorage
(لا يتطلب أي خادم خلفي / No backend required.)

---

## 🚀 التشغيل / Getting Started

```bash
# 1) تثبيت الحزم / install dependencies
npm install

# 2) تشغيل بيئة التطوير / start dev server
npm run dev

# 3) بناء نسخة الإنتاج / production build
npm run build

# 4) معاينة نسخة الإنتاج / preview the build
npm run preview
```

المتطلبات: Node.js 18+ (تم الاختبار على Node 24).

---

## 🎬 المشغّل التفاعلي (Storyline-style) / The slide player

الفصل مبني كـ **١٦ شريحة** (`src/data/slides.ts`). لكل شريحة:

- `narration` + `audioKey` (مثل `slide-02`) → يشغّل `/public/audio/slide-02.mp3` إن وُجد، وإلا قراءة آلية.
- `duration` (بالثواني) و`timeline`: قائمة أحداث `{ time, element, animation }` تُظهر العناصر تدريجياً.
- `content` (عناصر الشريحة) و/أو `activity` / `quiz` / `reflection`.

**تعديل التوقيت:** غيّر `time` لكل عنصر و`duration` للشريحة في `slides.ts`. أنواع الحركة المتاحة:
`fade-up` · `fade-in` · `slide-in` · `scale-in`. عند إعادة الشريحة تُعاد الحركة من البداية،
وعند الإيقاف المؤقت يتوقف الخط الزمني.

> **مزامنة الصوت:** يُدار الخط الزمني بساعة مستقلة (لضمان عمل الحركة مع القراءة الآلية أيضاً)،
> ويُشغَّل السرد بالتوازي. إن استخدمت ملفات MP3، اجعل `duration` مساوياً لطول التسجيل لأفضل تزامن.

## 🔊 كيف يعمل الشرح الصوتي / How narration works

يعمل الشرح الصوتي بنمطين تلقائياً:

1. **ملفات صوتية حقيقية (AI Audio):** إذا وُجد ملف بالمسار
   `public/audio/<narrationKey>.mp3` فسيُشغّل مباشرةً.
2. **قراءة آلية بديلة (Fallback):** إن لم يوجد الملف، يستخدم النظام
   **Web Speech API** لقراءة النص العربي آلياً — مع تفضيل **صوت رجل** تلقائياً
   (مثل «Microsoft Naayf» على ويندوز)، ونبرة أخفض قليلاً. ويمكن للمتعلّم اختيار
   الصوت والسرعة من زر «الصوت». لأفضل جودة، أضِف ملفات MP3 بصوت رجل في `/public/audio`.

> يمكن استبدال القراءة الصوتية التلقائية بملفات صوت مولّدة بالذكاء الاصطناعي داخل مجلد
> `/public/audio`. أسماء الملفات المطلوبة موجودة في [`public/audio/README.md`](public/audio/README.md)،
> ونصوص السرد كاملةً في [`docs/audio-scripts.md`](docs/audio-scripts.md).

أزرار التحكم متوفرة في كل قسم: **تشغيل الشرح · إيقاف · إعادة · عرض النص**، مع شريط تحكم
عائم يظهر أثناء التشغيل.

## ElevenLabs Audio Generation

The production voice files can be generated from the centralized catalog in
`src/data/audioScripts.ts`. The catalog contains the eight main slide narrations
and every activity question, correct/incorrect feedback, scenario discussion,
and spoken completion that is used at runtime. The first question of each guided
activity is already part of its main slide narration, so it is not generated twice.

1. Join the client's ElevenLabs workspace and create an API key with Text to Speech access.
2. Copy the required voice ID from the voice page or the ElevenLabs API.
3. Copy `.env.example` to `.env` and replace the placeholder values:

```env
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

Preview the complete generation plan without an API key or API requests:

```bash
npm run audio:generate:dry-run
```

Check current coverage before or after generation. Strict mode exits with a
non-zero status while any required MP3 is missing:

```bash
npm run audio:check
npm run audio:check:strict
```

Generate only missing files, or deliberately regenerate every catalog file:

```bash
npm run audio:generate
npm run audio:generate:force
```

MP3 files are saved as `public/audio/<key>.mp3`. Existing files are skipped by
default, failed downloads never replace a valid file, and transient API failures
are retried with a delay. Run `npm run build` after generation; `sync-audio`
automatically adds every MP3 to `src/data/audioManifest.ts` and the SCORM build.

At runtime the app uses a listed MP3 before browser TTS. To verify that no TTS is
used, generate all catalog files, run `npm run build`, confirm the build reports
the expected MP3 count, and test every activity path while the audio source label
shows a fixed audio file. Temporarily renaming one generated MP3 and rebuilding is
the safest way to verify the Web Speech fallback. Restore the file and rebuild
before packaging SCORM.

Never commit `.env` or an API key. Only `.env.example` belongs in Git.

---

## ✏️ تعديل المحتوى / Editing content

كل النصوص التعليمية والأنشطة والأسئلة موجودة في ملف واحد:

```
src/data/courseContent.ts
```

- **الدروس:** عدّل مصفوفة `blocks` داخل كل قسم `type: 'lesson'`.
- **الأنشطة:** عدّل حقل `data` (تصنيف، ترتيب، بناء، محاكاة، بطاقات).
- **الاختبار:** عدّل `quiz.questions`.
- **السرد الصوتي:** عدّل حقل `narration` و`narrationKey`.

الأنواع معرّفة في `src/types/course.ts`، لذا يرشدك المحرّر لأي حقل مطلوب.

---

## 📁 هيكل المشروع / Project structure

```
src/
  App.tsx           ← مبدّل العرض: المنصة ⇄ مشغّل الشرائح
  SlidePlayer.tsx   ← مشغّل الشرائح (Storyline-style)
  components/
    player/     PlayerHeader · SlideStage · PlayerControls · SlideMenu
    platform/   PlatformHome · TrackModal (المنصة، الحقائب، الفصول)
    course/     LessonBlocks · Diagrams · HeroArt · BackgroundDecor (عناصر الشرائح)
    activities/ ClassificationActivity · FlipCardActivity · DecisionSimulation · KnowledgeCheck · …
    audio/      NarrationContext · NarrationSettings · AudioNarrationButton
    ui/         Icon · IconBadge · Chip · FeedbackBox · Badge · Confetti · ThemeToggle
  data/         slides.ts (شرائح الفصل + الخط الزمني) · courseContent.ts (مصدر المحتوى)
                · platformContent.ts (كتالوج الحقائب)
  hooks/        useTheme · useProgress · useNarration · useSlideTimeline
  lib/          utils · progressReader
  types/        course.ts · slides.ts
  styles/       index.css (الثيم + الأنيميشن)
public/
  audio/        ملفات الشرح الصوتي (slide-01.mp3 … slide-16.mp3)
  favicon.svg
docs/
  audio-scripts.md · content-coverage.md · needs-review.md
```

> ملاحظة: مكوّنات الواجهة القديمة (المسار المتدرّج) ما زالت في المستودع للرجوع إليها لكنها غير
> مستخدمة؛ المدخل الفعلي الآن هو `App → PlatformHome → SlidePlayer`.

---

## ✅ ملاحظات عن أمانة المحتوى / Content fidelity

- المحتوى التعليمي مأخوذ حرفياً من العرض التقديمي؛ لم تُضَف قوانين أو حقائق خارجية.
- الأنشطة التي لا يوفّر لها العرض مفتاح إجابة رسمياً تُعرض إجاباتها بوسم
  **«إجابة مقترحة - تحتاج مراجعة»** (انظر [`docs/needs-review.md`](docs/needs-review.md)).
- أسئلة التأمّل تبقى مفتوحة للنقاش دون تصحيح صائب/خاطئ.

---

## 🌐 النشر على LMS / LMS deployment

بعد `npm run build` يُنتَج مجلد `dist/` ثابت (static). قيمة `base: './'` في
`vite.config.ts` تجعل الوحدة تعمل من أي مسار فرعي داخل الـ LMS. ارفع محتويات `dist/`
كما هي.
