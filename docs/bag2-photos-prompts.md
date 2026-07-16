# قائمة الصور المطلوبة — الحقيبة الثانية: إدارة الاستجابة للطوارئ

هذا الملف يسرد كل صورة جديدة محتاجينها للحقيبة الثانية، مع البرومبت الخاص بيها، عشان تتولد بأي أداة توليد صور (Midjourney / DALL·E / Firefly إلخ) وتتحط في المسار المحدد.

**تحديث**: الموقع دلوقتي شغال بأيقونات SVG مرسومة بالكود (نفس أسلوب `CourseGlyph` بالحقيبة الأولى)، مو صور بيضاء فاضية زي قبل — كل ملف من الـ17 ملف تحته بقى `.svg` حقيقي بنفس اسم الملف (بدل `.webp`)، بنفس هوية الألوان (أخضر/ذهبي) وبنفس فكرة البرومبت المكتوب. لو حبيت تستبدلها بصور فوتوغرافية/فلات-إليستريشن حقيقية من أداة توليد صور فيما بعد، خلي الاسم والامتداد `.svg` كما هو أو حدّث المسار في `pptGeneratedVisualLayersFor` و`IntroMotionScene` داخل `SlideStage.tsx`.

**مواصفات عامة لكل الصور**: أسلوب فلات-إليستريشن (flat illustration) ثلاثي الأبعاد خفيف، بنفس هوية الحقيبة الأولى — درجات الأخضر الغامق والفاتح (#1F5C3A إلى #2F7657) مع لمسات ذهبية (#BF9B4A)، بدون نصوص داخل الصورة، بدون وجوه واقعية (رموز/أيقونات بشرية مبسطة فقط)، خلفية شفافة أو بيضاء نظيفة، تناسب سياق القطاع الصحي السعودي (يفضّل لمسات بصرية سعودية خفيفة زي نمط الهلال الأحمر السعودي أو ألوان العلم بشكل غير مباشر إذا كانت مناسبة).

---

## ١. صور المشاهد الرئيسية — المسار: `public/assets/visual-library/`

هذي الصور تُستخدم داخل بطاقات المحتوى (Cards) في كل الفصول، وتتطابق مع نظام الكلمات المفتاحية في الكود (كل صورة تظهر تلقائيًا في البطاقات اللي نصها يحتوي كلمات معينة).

| الملف | البرومبت | المقاس المقترح |
|---|---|---|
| `emergency-command-center.svg` | A flat 3D illustration of a modern emergency operations command center room, large wall of screens showing maps and data dashboards, a few simplified human silhouettes coordinating around a central table, green and gold color palette, clean white background, no text, no realistic faces, Saudi healthcare emergency management theme | 800×800 |
| `emergency-strategic-framework.svg` | A flat 3D illustration of a glowing strategic framework icon — an open book or shield merging into a decision tree / branching pathway, representing strategic planning before a crisis, green and gold palette, clean background, no text | 800×800 |
| `emergency-response-team.svg` | A flat 3D illustration of a coordinated emergency response team, simplified silhouettes wearing medical/emergency vests moving in sync around a hospital icon, sense of urgency and coordination, green and gold palette, clean background, no text, no faces | 800×800 |
| `emergency-continuity-shield.svg` | A flat 3D illustration of a shield protecting a hospital building icon from disruption arrows/cracks, symbolizing business continuity, green and gold palette, clean background, no text | 800×800 |
| `emergency-crisis-communication.svg` | A flat 3D illustration of a megaphone or speech-bubble radiating calm reassuring waves toward simplified silhouettes of a worried crowd, representing crisis communication and trust-building, green and gold palette, clean background, no text | 800×800 |
| `emergency-decision-pressure.svg` | A flat 3D illustration of a human silhouette at a crossroads/decision fork under a stopwatch or pressure-gauge icon, symbolizing decision-making under pressure, green and gold palette, clean background, no text | 800×800 |
| `emergency-proactive-scanning.svg` | A flat 3D illustration of a radar/telescope scanning outward with concentric wave circles detecting distant signal icons (a magnifying glass over a horizon), symbolizing proactive scanning and future foresight, green and gold palette, clean background, no text | 800×800 |
| `emergency-risk-matrix.svg` | A flat 3D illustration of a 2x2 risk heat-map matrix grid with colored zones (green/yellow/orange/red) and a few floating hazard icons (flood drop, lightning, virus particle) positioned on it, green and gold palette, clean background, no text | 800×800 |
| `emergency-surveillance-radar.svg` | A flat 3D illustration of a radar dish/early-warning tower with pulsing signal rings and a small alert bell icon, symbolizing surveillance and early warning systems, green and gold palette, clean background, no text | 800×800 |
| `emergency-supply-chain.svg` | A flat 3D illustration of a supply chain — a delivery truck, a medical box with a cross icon, and a warehouse/hospital connected by a dotted route line, symbolizing logistics and supply resilience, green and gold palette, clean background, no text | 800×800 |
| `emergency-after-action-review.svg` | A flat 3D illustration of simplified silhouettes seated in a circle around a large checklist/clipboard with a magnifying glass, symbolizing after-action review and lessons learned, calm collaborative tone (not a courtroom), green and gold palette, clean background, no text | 800×800 |
| `emergency-kpi-dashboard.svg` | A flat 3D illustration of an analytics dashboard screen with bar charts, a gauge meter, and an upward trend line, symbolizing KPI measurement, green and gold palette, clean background, no text | 800×800 |
| `emergency-stakeholder-network.svg` | A flat 3D illustration of a network map — a central hospital/shield icon connected by lines to surrounding simplified icons representing government, media, community and suppliers, symbolizing stakeholder management, green and gold palette, clean background, no text | 800×800 |

---

## ١ب. صور جديدة لسة محتاجة — المسار: `public/assets/visual-library/`

الثلاث صور دي مختلفة عن اللي فوق: مفيش لها آي محتوى مرسوم لسة، الملفات حاليًا مجرد مربع أبيض أو أخضر بسيط (مش رسمة) عشان تبان في الموقع إن فيه حتة محتاجة صورة، وتقدر تستبدلها متى جهزتها بنفس الاسم بالظبط من غير أي تعديل كود. اكتشفتها لما وسّعت نظام الصور ليغطي كل شرائح الحقيبة (كانت أنماط "الخط الزمني/المصفوفة/التركيز" الجديدة ملهاش صور خالص قبل كده).

| الملف | البرومبت | يظهر في | المقاس المقترح |
|---|---|---|---|
| `emergency-raci-matrix.svg` | A flat 3D illustration of a RACI responsibility matrix — a simple grid with role icons (Responsible/Accountable/Consulted/Informed) represented by four distinct simplified human silhouettes with small badge icons, green and gold palette, clean white background, no text, no realistic faces | شريحة "حوكمة الاستجابة ومصفوفة RACI" | 800×800 |
| `emergency-crisis-terms.svg` | A flat 3D illustration comparing four escalating severity levels — four simplified icons growing in size/intensity (a small dot, a spark, a flame, a burst), representing the event → emergency → crisis → disaster progression, green and gold palette, clean white background, no text | شريحة "فهم ديناميكيات الأزمات" (تعريف حدث/طارئ/أزمة/كارثة) | 800×800 |
| `emergency-leadership-traits.svg` | A flat 3D illustration of a calm, composed leader silhouette standing steady at the center of a storm-like swirl of pressure lines, radiating a sense of calm and empathy outward, green and gold palette, clean white background, no text, no realistic face | شريحة "القيادة أثناء الأزمات" | 800×800 |

---

## ٢. طبقات مشهد المقدمة المتحركة — المسار: `public/assets/visual-library/`

تُستخدم في شريحة الترحيب وخريطة الفصول بالمقدمة، بنفس أسلوب الحقيبة الأولى (طبقات شفافة تتحرك بحركة خفيفة).

| الملف | البرومبت | المقاس المقترح |
|---|---|---|
| `emergency-intro-preparedness-layer.svg` | A flat 3D isolated icon illustration of a shield with a checklist inside it, floating on transparent background, representing "Preparedness", green and gold gradient, soft drop shadow, no text | 600×600 (شفاف) |
| `emergency-intro-crisis-layer.svg` | A flat 3D isolated icon illustration of a compass needle inside a pressure/alert ring, floating on transparent background, representing "Crisis Management & Decision-Making", green and gold gradient, soft drop shadow, no text | 600×600 (شفاف) |
| `emergency-intro-foresight-layer.svg` | A flat 3D isolated icon illustration of a telescope or radar dish scanning outward, floating on transparent background, representing "Proactive Foresight", green and gold gradient, soft drop shadow, no text | 600×600 (شفاف) |
| `emergency-intro-recovery-layer.svg` | A flat 3D isolated icon illustration of an upward spiral arrow forming a checkmark, floating on transparent background, representing "Recovery & Continuous Improvement", green and gold gradient, soft drop shadow, no text | 600×600 (شفاف) |

---

## ٣. اعتبارات مهمة

- **شخصية ناصر (نفس الشخصية)**: هنستخدم نفس صور "ناصر" الموجودة بالفعل بالحقيبة الأولى (`public/nasser-assets/*.webp`) — الترحيب، التفكير، التأكيد، التحذير، إلخ. **مفيش حاجة جديدة مطلوبة هنا**، عشان يفضل نفس المدرب متعرف عليه في كل الحقائب.
- **إطار القالب (template-assets)**: هنستخدم نفس إطار وشعار الحقيبة الأولى بدون تعديل، إلا إذا حبيت نضيف شارة "الحقيبة ٢" صغيرة — لو عاوزها قولّي أضيفها كملف منفصل.
- **أيقونات البطاقات (CourseGlyph)**: مش محتاجين صور خارجية لها، لأنها مرسومة SVG جوه الكود نفسه (زي أيقونات الحوكمة/الامتثال/المخاطر بالحقيبة الأولى) — ممكن أضيف أنواع جديدة زي "طوارئ" و"تواصل أزمات" و"استشراف" و"لوجستيات" بنفس الأسلوب البرمجي بدون ما نحتاج صور، إلا لو حبيت شكل مختلف.
- **العدد الإجمالي**: ٢٠ صورة (١٣ مشاهد رئيسية مرسومة + ٣ صور جديدة لسة placeholder + ٤ طبقات مقدمة)، وده رقم معقول جدًا مقارنة بحجم الحقيبة (١١٣ سلايد مصدر تلخصت في هذا العدد المدروس من المشاهد المتكررة الاستخدام).
- **الأيقونات (CourseGlyph) والصور شغالين مع بعض، مش بدل بعض**: كل شريحة فيها عنوان جنبه أيقونة SVG صغيرة (رسمناها إحنا بالكود بنفس الهوية البصرية)، وكمان صورة أكبر تدعم المحتوى بصريًا (المشاهد المرسومة فوق). إضافة الصور دي ما كانش معناها شيل الأيقونات — الاتنين موجودين مع بعض في كل شريحة.
