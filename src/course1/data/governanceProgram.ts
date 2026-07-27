import type { PptCard, PptLayout, Slide, SlideKind } from '../../types/slides';
import type { QuizData } from '../../types/course';

const emptyTimeline: Slide['timeline'] = [];

const CARD_BRIDGES = [
  'وبعد أن اتضحت البداية، ننتقل إلى',
  'ومن الطبيعي أن يكون السؤال التالي عن',
  'ونربط هنا ما سبق بفكرة',
  'ولكي تكتمل الصورة، نضيف',
  'وهذا يقودنا مباشرة إلى نقطة مهمة، وهي',
  'وننتقل الآن إلى جانب آخر، وهو',
  'وتأتي بعدها بطبيعة الحال',
];

const OPENING_BRIDGES = [
  'لنبدأ بتفكيك الموضوع معًا، وأول ما يستحق التوقف عنده هو',
  'وقبل الدخول في التفاصيل، أول سؤال نطرحه هو',
  'وأول زاوية ينبغي أن نفهمها جيدًا هي',
  'ولكي تتضح الفكرة من أساسها، نبدأ بـ',
  'وفي البداية، لنركز معًا على',
  'ومدخلنا الطبيعي لهذا الموضوع هو',
];

const TITLE_BRIDGES = [
  'لنركز في هذه الشريحة على',
  'محورنا هنا هو',
  'وفي هذه المحطة نتحدث عن',
  'موضوعنا الآن هو',
  'وتدور هذه الشريحة حول',
  'وننتقل الآن إلى',
];

const POINT_BRIDGES = [
  'أول ما يستحق التوقف عنده:',
  'وهذا يقودنا إلى نقطة أخرى مهمة:',
  'وكما هو متوقع، تُكمّلها:',
  'وفي السياق ذاته، لاحظوا:',
  'وأخيرًا، ولكي تكتمل الصورة:',
  'ولا ينبغي أن نغفل عن:',
  'ونضيف هنا نقطة تكمّل الصورة:',
  'ونصل الآن إلى نقطة تستحق التركيز:',
  'ومن الأمور المهمة التي نذكرها:',
  'وعلى النهج ذاته:',
];

const DETAIL_BRIDGES = [
  'وببساطة، فإن ما يحدث فعليًا هو أن',
  'وعمليًا، فإن المطلوب هو أن',
  'وهذا يعني، على أرض الواقع، أن',
  'وإذا ربطناها بعملكم اليومي، نجد أن',
  'ويتمثل الدور الحقيقي هنا في أن',
  'والخلاصة التي ينبغي أن نستوعبها أن',
  'وببساطة، فإن الأثر العملي هو أن',
  'وإذا أسقطناها على الواقع، نجد أن',
  'والنقطة الجوهرية هنا أن',
  'وبمزيد من التفصيل، فإن معناها أن',
];

/** A short, grounded "so what does this mean in practice" closer — reuses
 *  only the topic language already present in the card, never invents new
 *  facts, but frames it as reasoning/application instead of another bullet. */
const PRACTICAL_OPENERS = [
  'ولكي نطبّقها في عملنا،',
  'ولنتأمل ذلك على النحو التالي:',
  'وأقرب مثال عملي لها:',
  'وفي موقف حقيقي، يعني ذلك أن',
];

/** Bridge phrases must NOT repeat every few sentences (sounds like a
 *  stamped AI template, e.g. "أول شيء يستاهل وقفة" firing at the start of
 *  almost every card's bullet list). A plain rotating index still repeats
 *  every `pool.length` picks, which a single content-heavy slide can blow
 *  through several times over. Instead, deal from a shuffled "bag" of the
 *  whole pool (drawn without replacement) and reshuffle only once it's
 *  empty — that guarantees no phrase repeats within any window smaller
 *  than the pool size, and swaps the reshuffle's first card if it would
 *  land right after itself, so it never repeats back-to-back either. */
function rotatingPicker(pool: string[]) {
  let bag: string[] = [];
  let last: string | null = null;
  const refill = () => {
    bag = [...pool];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag.length > 1 && bag[0] === last) {
      [bag[0], bag[1]] = [bag[1], bag[0]];
    }
  };
  return () => {
    if (bag.length === 0) refill();
    const phrase = bag.shift() as string;
    last = phrase;
    return phrase;
  };
}
const nextPointBridge = rotatingPicker(POINT_BRIDGES);
const nextDetailBridge = rotatingPicker(DETAIL_BRIDGES);
const nextCardBridge = rotatingPicker(CARD_BRIDGES);
const nextOpeningBridge = rotatingPicker(OPENING_BRIDGES);

function practicalTakeaway(card: PptCard) {
  if (!card.rationale) return '';
  const opener = PRACTICAL_OPENERS[(card.title.length + (card.text?.length ?? 0)) % PRACTICAL_OPENERS.length];
  return `${opener} ${withStop(card.rationale)}`;
}

/** Grounded "so what does this mean day-to-day" closer for cards that have
 *  no authored rationale — keyword-matched to the card's own topic so it
 *  reads like a teacher connecting the idea to practice, not a bullet re-read.
 *  Never introduces facts beyond generic professional-application language. */
function spokenTakeaway(card: PptCard) {
  if (card.rationale) return practicalTakeaway(card);
  const opener = PRACTICAL_OPENERS[card.title.length % PRACTICAL_OPENERS.length];
  const text = `${card.title} ${card.text ?? ''}`;
  if (text.includes('حوكمة') || text.includes('الإطار')) {
    return `${opener} حدّد من صاحب القرار، ومن يراجعه، وما الدليل الموثّق الذي يثبت أنه نُفِّذ بالشكل الصحيح.`;
  }
  if (text.includes('امتثال') || text.includes('التطبيق') || text.includes('ضوابط')) {
    return `${opener} حوّل المتطلب إلى ضابط يمكن قياسه فعليًا، وتابع أي فجوة فيه أولًا بأول.`;
  }
  if (text.includes('أخلاقيات') || text.includes('نزاهة') || text.includes('تضارب')) {
    return `${opener} تأكد من الحياد والإفصاح المبكر، ووثّق أي معالجة قبل أن تتحول إلى مشكلة.`;
  }
  if (text.includes('مخاطر') || text.includes('خطر')) {
    return `${opener} قدّر الاحتمالية والأثر أولًا، ثم اختر الإجراء المناسب.`;
  }
  if (text.includes('مجلس') || text.includes('لجنة') || text.includes('لجان')) {
    return `${opener} ميّز بوضوح بين من يوجّه القرار، ومن ينفّذه، ومن يراقبه.`;
  }
  if (text.includes('تدريب') || text.includes('توعية') || text.includes('ثقافة')) {
    return `${opener} قِس الأثر بتغيّر السلوك الفعلي، لا بعدد الحضور في القاعة فحسب.`;
  }
  return '';
}

let slideOpeningSequence = 0;

/** Spoken-only number normalization: Nasser reads round-thousand figures
 *  (like ISO standard numbers) as "٣١ ألف" instead of the raw digit string,
 *  which TTS engines otherwise read out digit-by-digit or awkwardly. Only
 *  applied to narration text — the on-screen card text keeps the raw number
 *  (e.g. "أيزو 31000") untouched. */
function humanizeNumbers(text: string): string {
  return text.replace(/\b(\d{1,3})000\b/g, (_match, n: string) => `${n} ألف`);
}

function withStop(value: string) {
  const text = value.trim();
  return /[.؟!]$/.test(text) ? text : `${text}.`;
}

function segmentsOf(value: string) {
  return value
    .split(/\n+|\s+[–-]\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function explainSegments(value: string) {
  const segments = segmentsOf(value);
  if (segments.length <= 1) return withStop(value);
  return segments.map((segment) => `${nextPointBridge()} ${withStop(segment)}`).join(' ');
}

function explainPoints(points: string[]) {
  return points.map((point) => `${nextPointBridge()} ${explainSegments(point)}`).join(' ');
}

function quickCheck({
  title,
  text,
  answer,
  rationale,
  tone = 'blue',
}: {
  title: string;
  text: string;
  answer: string;
  rationale: string;
  tone?: PptCard['tone'];
}): PptCard {
  return {
    index: 'تفاعل',
    title,
    text,
    answer,
    rationale,
    tone,
  };
}

function cardNarration(card: PptCard, index: number) {
  const bridge = index === 0 ? nextOpeningBridge() : nextCardBridge();
  const parts = [`${bridge} ${card.title}.`];

  if (card.text) {
    const segments = segmentsOf(card.text);
    if (segments.length > 1) {
      parts.push(`وتتضح هذه الفكرة من خلال تسلسل مترابط. ${explainSegments(card.text)}`);
    } else if (card.text.includes('؟')) {
      parts.push(`وهنا نختبر الفكرة من خلال أسئلة واضحة: ${withStop(card.text)}`);
    } else {
      parts.push(`${nextDetailBridge()} ${withStop(card.text)}`);
    }
  }
  if (card.bullets?.length) {
    parts.push(`وتتضح تفاصيلها من خلال عناصر مترابطة. ${explainPoints(card.bullets)}`);
  }

  if (!card.text?.includes('؟')) {
    const takeaway = spokenTakeaway(card);
    if (takeaway) parts.push(takeaway);
  }

  return parts.join(' ');
}

function fullNarration(lead: string, cards: PptCard[], close = '') {
  return [lead, ...cards.map((card, index) => cardNarration(card, index)), close]
    .filter(Boolean)
    .join(' ');
}

function narrationCoversTitle(title: string, narration: string) {
  const words = title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1);
  const spoken = new Set(
    narration
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\p{M}/gu, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/),
  );
  return words.every((word) => spoken.has(word));
}

function makeSlide({
  id,
  title,
  audioKey,
  narration,
  visual,
  layout,
  cards,
  kind = 'content',
  intro,
  prompt,
  checks,
  courseName,
  subtitle,
  unitTitle,
}: {
  id: string;
  title: string;
  audioKey: string;
  narration: string;
  visual: string;
  layout: PptLayout;
  cards?: PptCard[];
  kind?: SlideKind;
  intro?: string;
  prompt?: string;
  checks?: PptCard[];
  courseName?: string;
  subtitle?: string;
  unitTitle?: string;
}): Slide {
  const titleVariation = slideOpeningSequence % TITLE_BRIDGES.length;
  slideOpeningSequence += 1;
  const completeNarration = humanizeNumbers(
    narrationCoversTitle(title, narration) ? narration : `${TITLE_BRIDGES[titleVariation]} ${title}. ${narration}`,
  );

  return {
    id,
    index: 0,
    title,
    audioKey,
    narration: completeNarration,
    duration: Math.max(10, Math.ceil(completeNarration.length / 10.5)),
    kind,
    visual,
    layout,
    timeline: emptyTimeline,
    ppt: {
      eyebrow: layout === 'pptIntro' ? 'تحت إشراف المدرب ناصر' : undefined,
      courseName,
      subtitle,
      unitTitle,
      intro,
      prompt,
      cards,
      checks,
    },
  };
}

function indexSlides(items: Slide[]) {
  return items.map((slide, index) => ({ ...slide, index: index + 1 }));
}

function makeQuizSlide({
  id,
  audioKey,
  title,
  narration,
  quiz,
}: {
  id: string;
  audioKey: string;
  title: string;
  narration: string;
  quiz: QuizData;
}): Slide {
  return {
    id,
    index: 0,
    title,
    audioKey,
    narration,
    duration: Math.max(10, Math.ceil(narration.length / 10.5)),
    kind: 'quiz',
    visual: '🧠',
    timeline: emptyTimeline,
    activityLabel: 'اختبار ختامي · 5 أسئلة',
    quiz,
  };
}

function makeChapterClosing({
  id,
  audioKey,
  title,
  narration,
  takeaways,
}: {
  id: string;
  audioKey: string;
  title: string;
  narration: string;
  takeaways: Array<{ title: string; text: string; emoji: string }>;
}): Slide {
  return {
    id,
    index: 0,
    title,
    audioKey,
    narration,
    duration: Math.max(10, Math.ceil(narration.length / 10.5)),
    kind: 'completion',
    visual: '🏆',
    timeline: emptyTimeline,
    content: {
      takeaways: {
        kind: 'points',
        variant: 'grid',
        items: takeaways,
      },
    },
  };
}

const chapterOneQuiz: QuizData = {
  passScore: 60,
  questions: [
    {
      id: 'ch1-q1',
      prompt: 'ما المقصود بالحوكمة داخل المنشأة الصحية؟',
      options: [
        'تنفيذ الأعمال اليومية فقط',
        'إطار يحدد الأدوار والمسؤوليات وآليات المساءلة والشفافية',
        'مراجعة السجلات المالية فقط',
        'تدريب الموظفين على السياسات فقط',
      ],
      correctIndex: 1,
      explanation: 'الحوكمة تحدد توزيع الأدوار والمسؤوليات بين المجلس والإدارة واللجان مع المساءلة والشفافية.',
      source: 'الفصل الأول · نماذج وهياكل الحوكمة الصحية',
    },
    {
      id: 'ch1-q2',
      prompt: 'من يمثل الخط الثالث في نموذج ثلاثة خطوط دفاع؟',
      options: ['الإدارة التنفيذية', 'إدارة المخاطر والامتثال', 'التدقيق الداخلي المستقل', 'لجنة المشتريات'],
      correctIndex: 2,
      explanation: 'الخط الثالث هو التدقيق الداخلي المستقل، بينما الإدارة التنفيذية هي الخط الأول.',
      source: 'الفصل الأول · نموذج ثلاثة خطوط دفاع',
    },
    {
      id: 'ch1-q3',
      prompt: 'إرسال تنبيهات تلقائية للأطباء المتأخرين في التوثيق يُعد:',
      options: ['قرار حوكمة', 'إجراء امتثال', 'تضارب مصالح', 'تدقيقًا خارجيًا'],
      correctIndex: 1,
      explanation: 'التنبيه إجراء تطبيقي لمتابعة الالتزام بالسياسة، ولذلك يُعد إجراء امتثال.',
      source: 'الفصل الأول · نشاط الحوكمة أم الامتثال',
    },
    {
      id: 'ch1-q4',
      prompt: 'ما الإجراء المؤسسي الصحيح عند وجود تضارب مصالح فعلي؟',
      options: [
        'الاكتفاء بالإفصاح الشفهي',
        'تجاهل الحالة ما دام القرار لم يصدر',
        'الإفصاح والتنحي والتوثيق وإشراف لجنة الامتثال والأخلاقيات',
        'نقل الموظف إلى لجنة أخرى دون توثيق',
      ],
      correctIndex: 2,
      explanation: 'المعالجة تتطلب الإفصاح والتنحي عن القرار وتوثيق الحالة وإشراف الجهة المختصة.',
      source: 'الفصل الأول · تضارب المصالح',
    },
    {
      id: 'ch1-q5',
      prompt: 'متى ينبغي مراجعة السياسات الصحية وتطويرها؟',
      options: [
        'كل خمس سنوات فقط',
        'عند حدوث مخالفة مالية فقط',
        'سنوياً أو عند صدور لوائح جديدة',
        'بعد تغيير مجلس الإدارة فقط',
      ],
      correctIndex: 2,
      explanation: 'تُراجع السياسات سنويًا أو عند صدور لوائح جديدة لسد الفجوات ومواكبة المستجدات.',
      source: 'الفصل الأول · صياغة وتطوير السياسات',
    },
  ],
};

const chapterTwoQuiz: QuizData = {
  passScore: 60,
  questions: [
    {
      id: 'ch2-q1',
      prompt: 'ما التعريف الأدق للامتثال؟',
      options: [
        'تطبيق المتطلبات الخارجية فقط',
        'تلبية المتطلبات الإلزامية والاختيارية لتجنب مخاطر عدم الامتثال',
        'إعداد التقارير السنوية فقط',
        'معاقبة الموظفين بعد وقوع المخالفة',
      ],
      correctIndex: 1,
      explanation: 'الامتثال يشمل الأنظمة واللوائح الإلزامية والسياسات والمعايير الداخلية.',
      source: 'الفصل الثاني · مفهوم الامتثال',
    },
    {
      id: 'ch2-q2',
      prompt: 'في أي مرحلة من دورة PDCA يتم اختبار فعالية الضوابط؟',
      options: ['التخطيط Plan', 'التنفيذ Do', 'التحقق Check', 'الاستجابة Act'],
      correctIndex: 2,
      explanation: 'مرحلة التحقق Check تشمل مراقبة التطبيق واختبار فعالية السياسات والضوابط.',
      source: 'الفصل الثاني · أيزو 37301',
    },
    {
      id: 'ch2-q3',
      prompt: 'ما الهدف من المراقبة الناضجة للامتثال؟',
      options: [
        'البحث عن أخطاء الموظفين',
        'زيادة عدد التقارير',
        'اكتشاف الانحراف مبكرًا قبل تحوله إلى حادثة',
        'إغلاق الملاحظات بأسرع وقت',
      ],
      correctIndex: 2,
      explanation: 'المراقبة الناضجة حماية مبكرة وليست تفتيشًا للبحث عن الخطأ.',
      source: 'الفصل الثاني · مراقبة الامتثال',
    },
    {
      id: 'ch2-q4',
      prompt: 'أي مؤشر يساعد على قياس أثر التدريب على الامتثال؟',
      options: [
        'عدد صفحات المادة التدريبية',
        'انخفاض معدل المخالفات والتحسن في نتائج الاختبارات',
        'عدد المدربين فقط',
        'مدة الاجتماع الافتتاحي',
      ],
      correctIndex: 1,
      explanation: 'الأثر يُقاس بتغير المعرفة والسلوك، مثل تحسن الاختبارات وانخفاض المخالفات.',
      source: 'الفصل الثاني · قياس أثر التدريب',
    },
    {
      id: 'ch2-q5',
      prompt: 'ماذا تعني نتيجة من 21 إلى 24 في تقييم جاهزية الامتثال؟',
      options: ['مخاطر عالية', 'امتثال جزئي وشكلي', 'جاهزية جيدة تحتاج ضبطًا', 'نضج مؤسسي متقدم'],
      correctIndex: 3,
      explanation: 'النتيجة من 21 إلى 24 تدل على نضج مؤسسي متقدم.',
      source: 'الفصل الثاني · التقييم الذاتي',
    },
  ],
};

const chapterThreeQuiz: QuizData = {
  passScore: 60,
  questions: [
    {
      id: 'ch3-q1',
      prompt: 'كيف يعرّف أيزو 31000 الخطر؟',
      options: [
        'الخسارة المالية المؤكدة',
        'تأثير عدم اليقين على تحقيق الأهداف',
        'أي مخالفة تنظيمية فقط',
        'حدث سلبي وقع بالفعل',
      ],
      correctIndex: 1,
      explanation: 'الخطر هو تأثير عدم اليقين على تحقيق الأهداف، وقد يمثل فرصة أو تهديدًا.',
      source: 'الفصل الثالث · تعريف الخطر',
    },
    {
      id: 'ch3-q2',
      prompt: 'على ماذا تعتمد مصفوفة تقييم المخاطر؟',
      options: ['الأثر × الاحتمالية', 'التكلفة × عدد الموظفين', 'الوقت × عدد التقارير', 'الضابط × السياسة'],
      correctIndex: 0,
      explanation: 'تُقارن المخاطر بمعايير القبول باستخدام مصفوفة الأثر والاحتمالية.',
      source: 'الفصل الثالث · تقييم المخاطر',
    },
    {
      id: 'ch3-q3',
      prompt: 'متى يُقاس الخطر المتبقي؟',
      options: ['قبل تحديد الأهداف', 'قبل تطبيق الضوابط', 'بعد تطبيق الضوابط', 'بعد إغلاق سجل المخاطر'],
      correctIndex: 2,
      explanation: 'الخطر المتبقي هو ما يبقى بعد تطبيق الضوابط وتقييم فعاليتها.',
      source: 'الفصل الثالث · سجل المخاطر',
    },
    {
      id: 'ch3-q4',
      prompt: 'أي مما يلي يُعد مؤشر مخاطر رئيسيًا KRIs؟',
      options: [
        'عدد الاجتماعات الأسبوعية',
        'معدل تكرار نفس المخالفة',
        'عدد صفحات السياسة',
        'عدد أعضاء مجلس الإدارة',
      ],
      correctIndex: 1,
      explanation: 'معدل تكرار المخالفة يكشف اتجاه الخطر وفعالية المعالجة.',
      source: 'الفصل الثالث · مؤشرات المخاطر',
    },
    {
      id: 'ch3-q5',
      prompt: 'ما القيمة الأساسية لسجل المخاطر في الحوكمة؟',
      options: [
        'حفظ افتراضات غير قابلة للقياس',
        'استبدال قرارات مجلس الإدارة',
        'توجيه اللجان وتحديد أولويات المراجعة وربط المخاطر بالقرار',
        'إلغاء الحاجة إلى الضوابط',
      ],
      correctIndex: 2,
      explanation: 'السجل أداة حية تدعم المجلس واللجان وتربط المخاطر بالأولويات والقرار المؤسسي.',
      source: 'الفصل الثالث · ربط السجل بالحوكمة',
    },
  ],
};

const programCards: PptCard[] = [
  {
    title: 'الحوكمة التنظيمية والامتثال',
    text: 'المعرفة التنظيمية، هياكل الحوكمة، الأخلاقيات وتضارب المصالح',
    bullets: ['المعرفة التنظيمية', 'هياكل الحوكمة', 'الأخلاقيات وتضارب المصالح'],
  },
  {
    title: 'الامتثال والتدقيق والضوابط',
    text: 'إدارة الامتثال، مراقبة الضوابط، التدريب والتوعية',
    bullets: ['إدارة الامتثال', 'مراقبة الضوابط', 'التدريب والتوعية'],
    tone: 'gold',
  },
  {
    title: 'إدارة المخاطر المؤسسية',
    text: 'إطار آيزو 31000، إدارة المخاطر والضوابط، تحليل المخاطر',
    bullets: ['إطار أيزو 31000', 'إدارة المخاطر والضوابط', 'تحليل المخاطر'],
    tone: 'blue',
  },
];

export const governanceIntroSlides = indexSlides([
  makeSlide({
    id: 'program-welcome',
    audioKey: 'bag1-ch0-s1-welcome-course1',
    title: 'الحوكمة والمخاطر والامتثال',
    narration:
      'السلام عليكم ورحمة الله وبركاته، وأهلًا وسهلًا بكم جميعًا. معكم ناصر، وهذه مقدمة الحقيبة التدريبية. نبدأ بسم الله حقيبة الحوكمة والمخاطر والامتثال، وهي رحلة تدريبية من بناء الحوكمة إلى اتخاذ القرار القائم على المخاطر، عبر ثلاثة فصول مترابطة تجمع الحوكمة والامتثال وإدارة المخاطر في مسار تدريبي واحد. نسير معًا من بناء الحوكمة وتوزيع المسؤوليات، إلى الامتثال واختبار الضوابط، ثم نختم بإدارة المخاطر وربطها بالقرار المؤسسي. وهدفنا ليس حفظ المصطلحات فقط، بل فهمها وتطبيقها داخل بيئة العمل بطريقة واضحة ومهنية. نسأل الله للجميع التوفيق، ونبدأ على بركة الله.',
    visual: '🎓',
    layout: 'pptIntro',
    kind: 'welcome',
    courseName: 'الحوكمة والمخاطر والامتثال',
    subtitle: 'مقدمة الحقيبة',
    unitTitle: 'رحلة تدريبية من الحوكمة إلى القرار القائم على المخاطر',
    intro: 'ثلاثة فصول مترابطة تجمع الحوكمة والامتثال وإدارة المخاطر في مسار تدريبي واحد.',
  }),
  makeSlide({
    id: 'program-map',
    audioKey: 'bag1-ch0-s2-map-course1',
    title: 'محتويات البرنامج التدريبي',
    narration:
      'محورنا هنا هو محتويات البرنامج التدريبي. وقبل الدخول في التفاصيل، نستعرض معًا خريطة البرنامج التدريبي، وكيف يُبنى كل فصل على الفصل الذي يسبقه. فأول محطة معنا هي الفصل الأول، الحوكمة التنظيمية والامتثال، ويشمل المعرفة التنظيمية، وهياكل الحوكمة، والأخلاقيات وتضارب المصالح. وبعد أن تتضح هذه البداية، ننتقل إلى الفصل الثاني، الامتثال والتدقيق والضوابط، ونركز فيه على إدارة الامتثال، ومراقبة الضوابط، والتدريب والتوعية. ثم نصل إلى الفصل الثالث، إدارة المخاطر المؤسسية، ويشمل إطار آيزو 31 ألف، وإدارة المخاطر والضوابط، وتحليل المخاطر. وبهذا الترتيب، نبدأ بتحديد من يقرر وكيف يُحاسَب، ثم نتأكد من التطبيق وفعالية الضوابط، وبعدها نربط المخاطر بالقرار. وإذا اتضحت الخريطة، نبدأ الفصل الأول بإذن الله.',
    visual: '🗺️',
    layout: 'pptThreeColumns',
    cards: programCards,
  }),
]);

const chapterOneOverview: PptCard[] = [
  {
    title: 'المعرفة التنظيمية وتفسير اللوائح',
    bullets: ['الإطار التنظيمي للقطاع الصحي', 'تفسير اللوائح والسياسات', 'صياغة وتطوير السياسات الصحية'],
  },
  {
    title: 'هياكل الحوكمة والسياسات',
    bullets: ['نماذج الحوكمة الصحية', 'تطوير وتطبيق أطر الحوكمة', 'العلاقة بين الحوكمة والامتثال'],
    tone: 'gold',
  },
  {
    title: 'إدارة الأخلاقيات وتضارب المصالح',
    bullets: [
      'أخلاقيات العمل العام',
      'إدارة تضارب المصالح',
      'النزاهة المؤسسية وحوكمتها',
      'حوكمة الأخلاقيات والنزاهة وتضارب المصالح (الامتثال)',
    ],
    tone: 'blue',
  },
];

const regulatoryCards: PptCard[] = [
  {
    index: '01',
    title: 'رؤية 2030 والتحول الصحي',
    text: 'الانتقال من نموذج العلاج إلى الوقاية وجودة الحياة مع التركيز على سهولة الوصول، الجودة، الكفاءة، والاستدامة المالية.',
  },
  {
    index: '02',
    title: 'المستويات التنظيمية الستة',
    text: 'الإطار الأعلى (سياسات واستراتيجية) - المؤسسي (وزارة الصحة، CCHI، SFDA، SCFHS، وقاية) - التشغيلي (المجمعات الصحية)',
  },
  {
    index: '03',
    title: 'الجودة والاعتماد',
    text: 'CBAHI، JCI، أيزو 9001، أيزو 45001، أيزو 27001، أيزو 31000، HIMSS – معايير تضمان الجودة وحماية المرضى والعاملين.',
  },
  {
    index: '04',
    title: 'إطار الحوكمة والرقابة',
    text: 'مؤشرات الأداء KPIs، الشفافية والمساءلة، الرقابة الداخلية والخارجية، أنظمة بلاغات الشكاوى.',
  },
  {
    index: '05',
    title: 'تفسير اللوائح',
    text: 'تحويل النص التنظيمي إلى سياسات داخلية واضحة تحدد المسؤوليات وآليات التطبيق والمتابعة المستمرة.',
  },
  {
    index: '06',
    title: 'التطبيق العملي',
    text: 'كل لائحة تُترجم إلى سياسة داخلية وإجراءات تشغيلية وتوزيع مسؤوليات ومتابعة الالتزام دورياً.',
  },
];

const policyCards: PptCard[] = [
  {
    index: '01',
    title: 'تعريف السياسة الصحية',
    text: 'وثيقة رسمية تحدد كيفية التعامل في موضوع معين داخل المنشأة لضمان الاتساق في الأداء والامتثال للأنظمة وتحقيق الجودة.',
  },
  {
    index: '02',
    title: 'مراحل الصياغة',
    text: 'تحديد الحاجة أو المشكلة - مراجعة الأنظمة ذات الصلة - صياغة السياسة (الهدف، النطاق، المسؤوليات، الإجراءات) - الاعتماد والتطبيق.',
  },
  {
    index: '03',
    title: 'التطوير الدوري',
    text: 'مراجعة السياسات سنوياً أو عند صدور لوائح جديدة لسد الفجوات وتحسين الأداء وتحديثها بناءً على المستجدات.',
  },
  {
    index: '04',
    title: 'مثال تطبيقي – مكافحة العدوى',
    text: 'الهدف: ضمان بيئة آمنة - النطاق: جميع الأقسام الطبية - الإجراءات: بروتوكولات الوقاية - المراجعة: سنوياً أو عند حادثة.',
    tone: 'gold',
  },
];

const policyActivityCards: PptCard[] = [
  {
    index: '01',
    title: 'السيناريو (1)',
    text: 'سياسة تلقيح الموظفين لجميع العاملين – توفير اللقاحات، آلية التسجيل، التوثيق',
    rationale: 'ابدأ بتحديد الهدف والنطاق، ثم مسؤولية توفير اللقاح وآلية التسجيل ودليل التوثيق ومواعيد المراجعة.',
  },
  {
    index: '02',
    title: 'السيناريو (2)',
    text: 'حماية بيانات المرضى (خصوصية) – صلاحيات الوصول، حماية السجلات، الإبلاغ عن الاختراقات',
    rationale: 'اربط السياسة بصلاحيات الوصول، وحماية السجلات، ومسار الإبلاغ عن الاختراق، والمسؤول عن الاستجابة.',
  },
  {
    index: '03',
    title: 'السيناريو (3)',
    text: 'التعامل مع الأوبئة وإجراءات الطوارئ – بروتوكولات الحجر، إدارة الحالات، التنسيق مع الجهات',
    rationale: 'حدّد بروتوكولات الحجر وإدارة الحالات وآلية التنسيق مع الجهات، ثم ضع نقطة واضحة لتفعيل الخطة.',
  },
  {
    index: '04',
    title: 'السيناريو (4)',
    text: 'إدارة مخاطر الجهات الخارجية – تقييم المورّدين، معايير العقود، متابعة الامتثال',
    rationale: 'حوّل تقييم المورّدين ومعايير العقود ومتابعة الامتثال إلى ضوابط موثقة لها مسؤول ومؤشر متابعة.',
  },
  {
    index: '05',
    title: 'السيناريو (5)',
    text: 'حقوق المريض والإبلاغ عن الحوادث – الحق في المعلومة، آليات الشكاوى، التحقيق وإجراء التصحيح',
    rationale: 'اجمع حق المريض في المعلومة مع آلية الشكاوى والتحقيق وإجراء التصحيح ضمن مسار واحد واضح وقابل للتتبع.',
  },
];

const governanceModelCards: PptCard[] = [
  {
    index: '01',
    title: 'تعريف الحوكمة',
    text: 'الإطار الذي يحدد توزيع الأدوار والمسؤوليات بين مجلس الإدارة، الإدارة التنفيذية، واللجان المتخصصة مع آليات المساءلة والشفافية.',
  },
  {
    index: '02',
    title: 'نموذج ثلاثة خطوط دفاع',
    text: 'الخط الأول: الإدارة التنفيذية (التنفيذ اليومي)\nالخط الثاني: إدارة المخاطر والامتثال\nالخط الثالث: التدقيق الداخلي المستقل',
  },
  {
    index: '03',
    title: 'مجلس الإدارة',
    text: 'اعتماد الاستراتيجية، الإشراف على الأداء، ضمان الامتثال، حماية حقوق أصحاب المصلحة – مجلس يوجه ويشرف لا يُشغل.',
  },
  {
    index: '04',
    title: 'اللجان التابعة',
    text: 'لجنة الجودة وسلامة المرضى: مراجعة نسب الأخطاء الجسيمة وخطط التحسين.\nلجنة الامتثال والأخلاقيات: برامج الامتثال وتضارب المصالح.',
  },
  {
    index: '05',
    title: 'مصفوفة الصلاحيات DoA',
    text: 'وثيقة تحدد من يملك القرار، بأي مستوى، وأي حدود مالية أو تنظيمية – تضبط القرار وتوضح المساءلة.',
  },
  {
    index: '06',
    title: 'ملخص العلاقة التكاملية',
    text: 'مجلس الإدارة يوجه - اللجان تحلل وتوصي -مصفوفة الصلاحيات تضبط - السياسات تحدد الالتزام - الإجراءات تترجمه ممارسةً.',
  },
];

const frameworkCards: PptCard[] = [
  {
    title: 'مكونات إطار الحوكمة الفعّال',
    bullets: [
      'مجلس الإدارة: يوجه ويشرف',
      'اللجان المتخصصة: تحلل وتوصي',
      'مصفوفة الصلاحيات: تضبط القرار',
      'السياسات: تحدد الالتزام',
      'الإجراءات: تترجم الالتزام إلى ممارسة يومية',
    ],
  },
  {
    title: 'خطوات بناء الإطار',
    bullets: [
      'تحديد القيم والأهداف المؤسسية',
      'وضع السياسات وآليات الامتثال',
      'تصميم هياكل المساءلة والشفافية',
      'إدارة البيانات الصحية بمسؤولية',
      'إدارة الموارد البشرية بكفاءة',
      'التطبيق عبر تدريب مستمر وتقييم دوري',
    ],
    tone: 'gold',
  },
];

const governanceComplianceCards: PptCard[] = [
  {
    title: 'الحوكمة تحدد الإطار',
    text: 'من يقرر - ماذا يُقرر - كيف يُحاسَب',
    bullets: [
      'توزع الأدوار بين مجلس الإدارة والإدارة واللجان',
      'مصفوفة الصلاحيات (DoA) تضبط القرار وتمنع التداخل',
      'السياسات تُترجم الاستراتيجية إلى ممارسة يومية',
      'آليات المساءلة والشفافية تحمي القرار',
      'تحدد من يُبلَّغ ومتى وبأي آلية',
    ],
  },
  {
    title: 'الامتثال يضمن التطبيق',
    text: 'ماذا يُلزَم - كيف يُراقَب - أين الفجوات',
    bullets: [
      'يحوّل المتطلبات التنظيمية إلى ضوابط قابلة للقياس',
      'يراقب التطبيق الفعلي ويختبر فعالية الضوابط',
      'يعالج أسباب عدم الامتثال الجذرية لا الظاهرية',
      'يرفع تقارير دورية للقيادة لدعم القرار',
      'يبني ثقافة مؤسسية تلتزم بروح النظام لا حرفه',
    ],
    tone: 'gold',
  },
  {
    title: 'التكامل = استدامة الأداء',
    text: 'معاً يحميان المنشأة',
    bullets: [
      'الحوكمة بلا امتثال: سلطة بلا أثر',
      'الامتثال بلا حوكمة: تنفيذ بلا توجيه',
      'التكامل بينهما يصنع منشأة مستدامة',
      'يُترجم الاستراتيجية إلى ممارسة يومية محمية',
      'يبني ثقة المرضى والجهات التنظيمية والمجتمع',
    ],
    tone: 'blue',
  },
];

const governanceActivityCards: PptCard[] = [
  {
    title: 'حوكمة/ امتثال؟',
    text: 'إصدار سياسة جديدة تلزم بالتوثيق الإلكتروني خلال 24 ساعة',
    answer: 'حوكمة',
    rationale: 'لأنها تحدد قاعدة وسياسة ملزمة وطريقة اتخاذ القرار.',
  },
  {
    title: 'حوكمة/ امتثال؟',
    text: 'إنشاء لجنة مراجعة تقارير الخروج شهرياً',
    answer: 'حوكمة',
    rationale: 'لأنها تنشئ جهة مسؤولة عن المراجعة والمتابعة ضمن هيكل واضح.',
  },
  {
    title: 'حوكمة/ امتثال؟',
    text: 'إرسال تنبيهات تلقائية للأطباء المتأخرين في التوثيق',
    answer: 'امتثال',
    rationale: 'لأنها إجراء تطبيقي لمتابعة الالتزام بالسياسة.',
  },
  {
    title: 'حوكمة/ امتثال؟',
    text: 'ربط الامتثال بالتوثيق بمؤشرات أداء الطبيب السنوية',
    answer: 'امتثال',
    rationale: 'لأنها تقيس الالتزام وتربطه بمؤشرات أداء دورية.',
  },
];

const ethicsCards: PptCard[] = [
  {
    index: '01',
    title: 'أخلاقيات العمل العام',
    text: 'منظومة القيم التي تحكم سلوك الموظف: النزاهة، العدالة، الحياد، الشفافية، تغليب المصلحة العامة – ليست التزاماً مجرداً بل سلوكاً يومياً',
  },
  {
    index: '02',
    title: 'الأساس النظامي في المملكة',
    text: 'نظام الخدمة المدنية، نظام الانضباط الوظيفي، نظام مكافحة الرشوة، وثيقة السلوك الوظيفي وأخلاقيات الوظيفة العامة',
  },
  {
    index: '03',
    title: 'تضارب المصالح',
    text: 'حالة تتعارض فيها المصلحة الشخصية مع المصلحة العامة – أنواعه: فعلي (حالي) ومحتمل (مستقبلي) – ليس خطأً بالضرورة لكنه يصبح خطراً إن لم يُفصح عنه',
  },
  {
    index: '04',
    title: 'إطار الإدارة الأربعي',
    text: 'الإفصاح (إلزام الجميع) - التقييم (تحديد نوع التضارب) - المعالجة (تنحٍّ أو نقل صلاحية أو منع كامل) - التوثيق والمراقبة',
    tone: 'gold',
  },
  {
    index: '05',
    title: 'النزاهة المؤسسية',
    text: 'سلوك مؤسسي مستمر يبدأ من الأعلى – Tone at the Top – مكوناتها: القيادة النموذجية، السياسات، قنوات الإبلاغ الآمنة، التوعية، الرقابة الداخلية',
  },
  {
    index: '06',
    title: 'أمثلة في القطاع الصحي',
    text: 'عضو لجنة الشراء له مصلحة مع مورّد - إفصاح + استبعاد\nطبيب يُحيل لجهة خاصة لديه فيها مصلحة - إشراف لجنة الأخلاقيات',
    tone: 'gold',
  },
];

const conflictCards: PptCard[] = [
  {
    title: 'السيناريو',
    text: 'موظف في لجنة شراء أجهزة طبية لديه أسهم أو مصلحة تجارية مع إحدى الشركات المتنافسة',
  },
  {
    title: 'تحديد المخالفة',
    text: 'هل هو تضارب فعلي (حالي) أم محتمل (مستقبلي)؟ تضارب مصالح / إخلال بالحياد / استغلال نفوذ',
    tone: 'gold',
  },
  {
    title: 'الإجراء الصحيح',
    text: 'الإفصاح - التنحي عن القرار - توثيق الحالة - إشراف لجنة الامتثال والأخلاقيات',
  },
  {
    title: 'نقاط للنقاش',
    text: 'هل يكفي الإفصاح وحده؟ ما آليات الحماية المؤسسية الواجب تفعيلها؟ كيف نضمن أن الامتثال ليس شكلياً؟',
    tone: 'gold',
  },
];

export const governanceChapterOneSlides = indexSlides([
  makeSlide({
    id: 'ch1-welcome',
    audioKey: 'bag1-ch1-s1-welcome-course1',
    title: 'الحوكمة التنظيمية والامتثال',
    narration:
      'حيّاكم الله من جديد، والسلام عليكم ورحمة الله وبركاته. نبدأ الآن الفصل الأول من حقيبة الحوكمة والمخاطر والامتثال: الحوكمة التنظيمية والامتثال. ومحاورنا في هذا الفصل هي: التخطيط، ثم أنظمة القيادة، ثم تنسيق المعلومات. نبني في هذا الفصل الأساس الذي تعتمد عليه بقية الحقيبة؛ نبدأ بالتخطيط، ثم نفهم أنظمة القيادة، ثم نوضح كيف تنتقل المعلومات والمسؤوليات داخل المنشأة. وبإذن الله، نربط كل مفهوم بموقف عملي، لأن الحوكمة تظهر في القرار اليومي، وليست مجرد وثائق.',
    visual: '🏛️',
    layout: 'pptIntro',
    kind: 'welcome',
    courseName: 'الحوكمة والمخاطر والامتثال',
    subtitle: 'الفصل الأول',
    unitTitle: 'الحوكمة التنظيمية والامتثال',
    intro: 'المحاور: التخطيط - أنظمة القيادة - تنسيق المعلومات',
  }),
  makeSlide({
    id: 'ch1-overview',
    audioKey: 'bag1-ch1-s2-overview-course1',
    title: 'الفصل الأول: الحوكمة التنظيمية والامتثال',
    narration: fullNarration(
      'لنرتب مسار الفصل قبل أن نبدأ؛ فأمامنا ثلاثة محاور مترابطة.',
      chapterOneOverview,
      'نبدأ بالمعرفة التنظيمية، ثم نبني هياكل الحوكمة، وبعدها نختبر أثر الأخلاقيات وتضارب المصالح على نزاهة القرار.',
    ),
    visual: '🧭',
    layout: 'pptThreeColumns',
    cards: chapterOneOverview,
    checks: [
      quickCheck({
        title: 'قبل ما نبدأ: أي محور يحمي نزاهة القرار؟',
        text: 'اختر ذهنيًا المحور الأقرب لحماية القرار من التحيز قبل كشف الإجابة.',
        answer: 'إدارة الأخلاقيات وتضارب المصالح',
        rationale: 'لأن الحوكمة والامتثال يضعان الإطار، لكن تضارب المصالح يختبر نزاهة القرار وقت التطبيق.',
      }),
    ],
  }),
  makeSlide({
    id: 'ch1-regulatory-framework',
    audioKey: 'bag1-ch1-s3-regulatory-framework-course1',
    title: 'الإطار التنظيمي للقطاع الصحي',
    narration: fullNarration(
      'نبدأ بالإطار التنظيمي للقطاع الصحي. لنركز معًا على كيف تتحول الرؤية والأنظمة والمعايير إلى ممارسة داخل المنشأة.',
      regulatoryCards,
      'والخلاصة هنا أن النص التنظيمي لا يكتمل أثره إلا حين يتحول إلى سياسة وإجراء ومسؤولية ومتابعة دورية.',
    ),
    visual: '🏥',
    layout: 'pptSixCards',
    cards: regulatoryCards,
  }),
  makeSlide({
    id: 'ch1-health-policies',
    audioKey: 'bag1-ch1-s4-health-policies-course1',
    title: 'صياغة وتطوير السياسات الصحية',
    narration: fullNarration(
      'وبعد أن فهمنا الإطار التنظيمي، ننتقل إلى الترجمة العملية: صياغة وتطوير السياسات الصحية.',
      policyCards,
      'ولاحظوا أن السياسة الجيدة تبدأ بحاجة واضحة، وتُعتمد وتُطبق، ثم تخضع للمراجعة الدورية حتى تظل مناسبة للواقع والمتطلبات.',
    ),
    visual: '📜',
    layout: 'pptTitleCards',
    cards: policyCards,
    checks: [
      quickCheck({
        title: 'اختبر فهمك: ما علامة السياسة الجيدة؟',
        text: 'فكر في سياسة مكتوبة عندك: هل يعرف الموظف ماذا يفعل بعدها مباشرة؟',
        answer: 'واضحة وقابلة للتطبيق والمراجعة',
        rationale: 'إذا بقيت السياسة عامة بلا إجراء أو مالك أو مراجعة، تتحول إلى وثيقة ساكنة لا تضبط السلوك.',
      }),
    ],
  }),
  makeSlide({
    id: 'ch1-policy-activity',
    audioKey: 'bag1-ch1-s5-policy-activity-course1',
    title: 'نشاط: تطوير سياسة صحية',
    narration: fullNarration(
      'والآن نطبّق ما تعلمناه. أمامك خمسة سيناريوهات لتطوير سياسة صحية؛ اختر كل سيناريو واضغط عليه، وفكّر كيف تبني له هدفًا ونطاقًا ومسؤوليات وإجراءات ومراجعة.',
      policyActivityCards,
      'لا تبحث عن صياغة طويلة؛ ابحث عن سياسة واضحة يعرف كل شخص فيها دوره ودليل التحقق من التطبيق.',
    ),
    visual: '🧠',
    layout: 'pptSixCards',
    kind: 'activity',
    cards: policyActivityCards,
  }),
  makeSlide({
    id: 'ppt-governance-models',
    audioKey: 'bag1-ch1-s6-governance-models-course1',
    title: 'نماذج وهياكل الحوكمة الصحية',
    narration: fullNarration(
      'وبعد أن ترجمنا اللوائح إلى سياسات، نرتب الآن نموذج الحوكمة نفسه، ونحدد من يوجّه، ومن ينفّذ، ومن يراجع.',
      governanceModelCards,
      'بهذا التكامل يصير القرار واضحًا، وتكون المساءلة مرتبطة بصلاحية محددة وليست موزعة بين الجميع.',
    ),
    visual: '🏛️',
    layout: 'pptTitleCards',
    cards: governanceModelCards,
  }),
  makeSlide({
    id: 'ppt-framework',
    audioKey: 'bag1-ch1-s7-framework-course1',
    title: 'تطوير وتطبيق أطر الحوكمة',
    narration: fullNarration(
      'والآن نبني الإطار بصورة متكاملة؛ فلدينا مكونات ثابتة، وخطوات تحوّل هذه المكونات إلى ممارسة فعلية.',
      frameworkCards,
      'الإطار الفعّال يجمع بين التوجيه والضبط والتطبيق، ويتطور بالتدريب والتقييم الدوري.',
    ),
    visual: '🧩',
    layout: 'pptTwoPanels',
    cards: frameworkCards,
    checks: [
      quickCheck({
        title: 'سؤال ربط: ما أول شيء نبحث عنه في أي إطار حوكمة؟',
        text: 'لا تبدأ بالنماذج الجميلة؛ ابدأ بما يثبت أن الإطار يعمل.',
        answer: 'وضوح الأدوار والصلاحيات وآلية المساءلة',
        rationale: 'أي إطار بلا أدوار ومساءلة يتحول إلى شكل تنظيمي، وليس نظامًا يحكم القرار.',
      }),
    ],
  }),
  makeSlide({
    id: 'ppt-governance-compliance',
    audioKey: 'bag1-ch1-s8-governance-compliance-course1',
    title: 'العلاقة بين الحوكمة والامتثال',
    narration: fullNarration(
      'هنا تتضح الصورة كاملة: الحوكمة تحدد الاتجاه والصلاحيات، والامتثال يتأكد أن هذا الاتجاه يتحول إلى تطبيق حقيقي.',
      governanceComplianceCards,
      'إذا اجتمعت الحوكمة والامتثال، صار عندنا قرار موجه، وتطبيق قابل للقياس، ومنشأة تحافظ على الثقة والاستدامة.',
    ),
    visual: '🔗',
    layout: 'pptThreeColumns',
    cards: governanceComplianceCards,
  }),
  makeSlide({
    id: 'ppt-activity-governance-or-compliance',
    audioKey: 'bag1-ch1-s9-activity-governance-or-compliance-course1',
    title: 'نشاط: الحوكمة أم الامتثال؟ — تمييز الأدوار',
    narration:
      'نبدأ الآن نشاط التمييز بين الحوكمة والامتثال. لاحظت لجنة الجودة في مستشفى أن ثلاثين بالمئة من الأطباء لا يوثقون تقارير الخروج وفق السياسة المعتمدة. صنّف كل إجراء أدناه: هل هو قرار حوكمة أم إجراء امتثال؟ ولماذا؟ سنأخذ كل إجراء على حدة، ولن نكشف التصنيف قبل اختيارك. الإجراء الأول: إصدار سياسة جديدة تلزم بالتوثيق الإلكتروني خلال أربع وعشرين ساعة. فكر: هل هذا قرار حوكمة أم إجراء امتثال؟ اختر إجابتك، وبعدها نناقش السبب معًا.',
    visual: '🧠',
    layout: 'pptActivitySort',
    kind: 'activity',
    intro:
      'لاحظت لجنة الجودة في مستشفى أن 30٪ من الأطباء لا يوثقون تقارير الخروج وفق السياسة المعتمدة. صنّف كل إجراء أدناه: هل هو قرار حوكمة أم إجراء امتثال؟ ولماذا؟',
    prompt: 'صنّف كل إجراء أدناه: هل هو قرار حوكمة أم إجراء امتثال؟ ولماذا؟',
    cards: governanceActivityCards,
  }),
  makeSlide({
    id: 'ppt-ethics-conflict',
    audioKey: 'bag1-ch1-s10-ethics-conflict-course1',
    title: 'أخلاقيات العمل وتضارب المصالح',
    narration: fullNarration(
      'وبعد أن ضبطنا هيكل القرار وآليات الامتثال، ننتقل إلى العنصر البشري: أخلاقيات العمل وتضارب المصالح.',
      ethicsCards,
      'فالنظام يضع الحدود، لكن النزاهة هي التي تحمي القرار وقت الضغط، والإفصاح وحده بداية المعالجة لا نهايتها.',
    ),
    visual: '⚖️',
    layout: 'pptSixCards',
    cards: ethicsCards,
    checks: [
      quickCheck({
        title: 'موقف سريع: متى يصبح تضارب المصالح خطرًا؟',
        text: 'هل يبدأ الخطر عند وقوع الضرر، أم قبل ذلك؟',
        answer: 'عند وجود احتمال تأثير المصلحة على القرار',
        rationale: 'لذلك نطلب الإفصاح والحياد مبكرًا؛ الحماية تبدأ قبل وقوع الضرر أو الشبهة.',
      }),
    ],
  }),
  makeSlide({
    id: 'ppt-conflict-scenario',
    audioKey: 'bag1-ch1-s11-conflict-scenario-course1',
    title: 'نشاط: سيناريوهات تضارب المصالح',
    narration:
      'نأخذ الآن سيناريو تدريبيًا في تضارب المصالح. السيناريو هو: موظف في لجنة شراء أجهزة طبية لديه أسهم أو مصلحة تجارية مع إحدى الشركات المتنافسة. ولاحظ أن الموظف يشارك في بيئة قرار قد تتأثر فيها المصلحة العامة بمصلحة شخصية. لا نستعجل الإجابة؛ فكّر أولًا: ما نوع المخالفة هنا؟ وهل تضارب المصالح فعلي أم محتمل؟ وبعد أن تحدد رأيك، اضغط زر مناقشة الإجابة حتى نحللها معًا.',
    visual: '🎬',
    layout: 'pptScenario',
    kind: 'activity',
    cards: conflictCards,
  }),
  makeQuizSlide({
    id: 'ch1-quiz',
    audioKey: 'bag1-ch1-s12-quiz-course1',
    title: 'اختبار الفصل الأول',
    narration:
      'ممتاز، وصلنا الآن إلى اختبار الفصل الأول. أمامك خمسة أسئلة قصيرة تقيس فهمك للحوكمة والسياسات والامتثال وتضارب المصالح. اقرأ كل سؤال بهدوء واختر إجابة واحدة، وبعد كل إجابة يظهر لك التفسير، وفي النهاية تظهر نتيجتك من خمسة مع النسبة المئوية. درجة الاجتياز ستون بالمئة، ويمكنك إعادة الاختبار إذا احتجت إلى ذلك. بالتوفيق.',
    quiz: chapterOneQuiz,
  }),
  makeChapterClosing({
    id: 'ch1-closing',
    audioKey: 'bag1-ch1-s13-closing-course1',
    title: 'ختام الفصل الأول',
    narration:
      'الحمد لله، بذلك نكون قد أتممنا الفصل الأول. تعرّفنا على نماذج وهياكل الحوكمة، وفهمنا كيف تتكامل الأدوار والمسؤوليات وآليات المساءلة والشفافية. وميّزنا بين قرار الحوكمة وإجراء الامتثال، ثم طبّقنا ذلك على أخلاقيات العمل وتضارب المصالح. وتظهر نتيجتك أمامك الآن، وهي تساعدك على معرفة مستوى إتقانك والنقاط التي تستحق مراجعة إضافية. وتذكّر أن الحوكمة الفاعلة تبدأ بقرار واضح، ومسؤولية محددة، ودليل يمكن التحقق منه. شكرًا لحسن استماعكم ومشاركتكم، ونلتقي بإذن الله في الفصل الثاني.',
    takeaways: [
      { title: 'هيكل واضح', text: 'أدوار ومسؤوليات وصلاحيات محددة تدعم المساءلة.', emoji: '🏛️' },
      { title: 'امتثال فعلي', text: 'تحويل السياسات والقرارات إلى ممارسات قابلة للتحقق.', emoji: '✅' },
      { title: 'نزاهة القرار', text: 'الإفصاح والمعالجة المؤسسية لتضارب المصالح.', emoji: '⚖️' },
    ],
  }),
]);

const chapterTwoOverview: PptCard[] = [
  {
    title: 'إدارة الامتثال والتدقيق',
    bullets: ['نماذج الامتثال', 'دور التدقيق في الحوكمة', 'تكامل الامتثال مع العمليات'],
  },
  {
    title: 'مراقبة الامتثال واختبار الضوابط',
    bullets: ['اختبار الضوابط', 'مؤشرات الامتثال', 'أدوات المراقبة المستمرة'],
    tone: 'gold',
  },
  {
    title: 'برامج التدريب والتوعية',
    bullets: ['بناء ثقافة الامتثال', 'تصميم برامج التوعية', 'قياس أثر التدريب'],
    tone: 'blue',
  },
];

const complianceConceptCards: PptCard[] = [
  {
    index: '01',
    title: 'تعريف الامتثال',
    text: 'تلبية المنشأة لجميع متطلبات إلزامية (أنظمة ولوائح) ومتطلبات اختيارية (سياسات داخلية ومعايير مهنية) لتجنب مخاطر عدم الامتثال.',
  },
  {
    index: '02',
    title: 'مستويان للمتطلبات',
    text: 'المستوى الأول: المتطلبات الخارجية الإلزامية (أنظمة، قوانين، تصاريح، تراخيص)\nالمستوى الثاني: المتطلبات الداخلية الاختيارية (عقود، سياسات داخلية).',
  },
  {
    index: '03',
    title: 'الوظائف الخمس الرئيسية',
    text: 'تحديد المخاطر والمشورة - الوقاية وتصميم الضوابط - المراقبة وقياس الفعالية - الحل والمعالجة عند حدوث عدم الامتثال - الدور الاستشاري وبناء الوعي.',
    tone: 'gold',
  },
  {
    index: '04',
    title: 'مخاطر عدم الامتثال',
    text: 'عقوبات تشريعية وجزائية - فقدان الترخيص أو الاعتماد - الإضرار بسمعة المنشأة وثقة المجتمع - خسائر مالية - تهديد سلامة المرضى.',
  },
];

const pdcaCards: PptCard[] = [
  {
    index: '01',
    title: 'التخطيط Plan',
    text: 'تحديد المتطلبات التنظيمية والمخاطر، تحديد الأدوار والمسؤوليات، وضع سياسة الامتثال وتصميم نظام الامتثال الشامل',
  },
  {
    index: '02',
    title: 'التنفيذ Do',
    text: 'تطبيق السياسات الصحية المعتمدة، تدريب الكوادر ورفع الوعي، تصميم ضوابط تشغيلية تمنع المخالفات، توثيق كل ما يتعلق بالامتثال',
  },
  {
    index: '03',
    title: 'التحقق Check',
    text: 'مراقبة تطبيق السياسات والضوابط، اختبار فعاليتها تصميماً وتشغيلاً، تحليل نتائج المراقبة والتدقيق، التعامل مع البلاغات المهنية',
    tone: 'gold',
  },
  {
    index: '04',
    title: 'الاستجابة Act',
    text: 'معالجة أسباب عدم الامتثال الجذرية لا الظاهرية، تحديث الضوابط عند تغير المخاطر، منع التكرار، رفع مستوى نضج الامتثال',
  },
];

const selfAssessmentCards: PptCard[] = [
  {
    index: '01',
    title: 'دليل الامتثال',
    text: 'هل توجد وثيقة معتمدة؟ هل تحدد النظام والمسؤوليات بوضوح؟ هل تم تحديثها مع تغير الأنظمة؟',
    rationale: 'قيّم وجود الدليل واعتماده ووضوح المسؤوليات وتحديثه. الدليل غير المحدّث يخلق التزامًا شكليًا.',
  },
  {
    index: '02',
    title: 'السياسة ومدونة السلوك',
    text: 'هل توجد سياسة الامتثال مكتوبة؟ هل يُدرَّب عليها الموظفون؟ هل تغطي النزاهة وتضارب المصالح؟',
    rationale: 'تحقق من الكتابة والتدريب والتغطية. السياسة التي لا يعرفها الموظفون لا تستطيع توجيه السلوك.',
  },
  {
    index: '03',
    title: 'ثقافة الامتثال',
    text: 'هل يشعر الموظفون بالأمان عند الإبلاغ؟ هل تتعامل القيادة بعدالة مع الأخطاء؟ هل الامتثال حاضر في اجتماعات القيادة؟',
    rationale: 'اقرأ الثقافة من شعور الموظفين بالأمان وعدالة القيادة وحضور الامتثال في القرار، وليس من الشعارات.',
  },
  {
    index: '04',
    title: 'الاستراتيجية والحوكمة',
    text: 'هل توجد أولويات واضحة مرتبطة بالجودة وسلامة المرضى؟ هل أدوار مجلس الإدارة والإدارة التنفيذية واضحة؟',
    rationale: 'اربط الأولويات بالجودة وسلامة المرضى، وحدد دور المجلس ودور الإدارة التنفيذية بلا تداخل.',
  },
  {
    index: '05',
    title: 'قراءة النتائج (0–24)',
    text: '0–6: مخاطر عالية، البنية التأسيسية ضعيفة - 7–14: امتثال جزئي وشكلي - 15–20: جاهزية جيدة تحتاج ضبطاً - 21–24: نضج مؤسسي متقدم',
    rationale: 'اجمع نتيجتك ثم اقرأ المستوى بصدق. النتيجة ليست غاية، بل نقطة بداية لخطة التحسين.',
    tone: 'gold',
  },
];

const monitoringCards: PptCard[] = [
  {
    index: '01',
    title: 'فلسفة المراقبة الناضجة',
    text: 'ليست روح التفتيش أو البحث عن الخطأ، بل حماية مبكرة – الهدف: اكتشاف الانحراف قبل تحوله لحادثة وحماية سلامة المرضى وسمعة المنشأة',
  },
  {
    index: '02',
    title: 'تخطيط المراقبة (قائم على المخاطر)',
    text: 'التركيز على المتطلبات عالية الخطورة، المرتبطة بالترخيص والاعتماد، ذات الأثر المباشر على سلامة المرضى أو الضوابط الجسيمة التي إن فشلت يُصدَر الخطر',
  },
  {
    index: '03',
    title: 'منهجيات المراقبة الأربع',
    text: 'ميدانية (زيارات ومشاهدة التطبيق الفعلي) - مكتبية (مراجعة وثائق وسجلات) - ذاتية (Self-Assessment مع تحقق لاحق) - رقمية/مستمرة (لوحات ومؤشرات KCIs)',
    tone: 'gold',
  },
  {
    index: '04',
    title: 'اختبار حقيقة الضوابط',
    text: 'هل تُطبَّق ما ثُبِّت؟ هل يفهمها الموظفون؟ هل تتوافق مع ضغط العمل الفعلي؟ هل توجد أدلة إثبات موثقة؟ الامتثال غير المثبت لا يُعدّ امتثالاً',
  },
  {
    index: '05',
    title: 'رفع تقارير المراقبة',
    text: 'تجيب على: ما مستوى الامتثال؟ أين الفجوات؟ ما الذي يحتاج قراراً عاجلاً؟ – تقارير تشغيلية، تحليلية، مختصرة للمجلس',
  },
  {
    index: '06',
    title: 'متابعة خطط التصحيح',
    text: "هل نُفِّذت الخطة؟ هل عالجت السبب الجذري؟ هل انخفض الخطر المتبقي؟ الفرق بين منشأة 'تُغلق التقارير' ومنشأة 'تُصحح الأداء'",
    tone: 'blue',
  },
];

const cultureCards: PptCard[] = [
  {
    index: '01',
    title: 'ثقافة الامتثال',
    text: 'لا ينجح أي برنامج مهما بلغت قوة سياساته إن لم يُبنَ على ثقافة مؤسسية داعمة – الثقافة تُقاس بطريقة اتخاذ القرار تحت الضغط لا في الأوقات السهلة.',
  },
  {
    index: '02',
    title: 'دور القيادة محوري',
    text: 'في القدوة، في الرسائل، في طريقة التعامل مع المخالفات، في الفصل الواضح بين السلوك المتوقع والمقبول – Tone at the Top يصنع الثقافة.',
  },
  {
    index: '03',
    title: 'تصميم برامج التوعية',
    text: 'تحديد الجمهور المستهدف - اختيار الأسلوب (حضوري، إلكتروني، سيناريوهات) - تنفيذ التدريب - قياس الأثر بمؤشرات واضحة',
    tone: 'gold',
  },
  {
    index: '04',
    title: 'أدوات التوعية الفعّالة',
    text: 'ورش عمل تفاعلية، قصص حقيقية ودروس مستفادة، اختبارات قبل وبعد، رسائل قيادية منتظمة، قنوات إبلاغ آمنة تحمي المُبلِّغ.',
  },
  {
    index: '05',
    title: 'قياس أثر التدريب',
    text: 'نسبة إتمام البرامج الإلزامية، التحسن في نتائج الاختبارات، انخفاض معدل المخالفات، زيادة البلاغات الطوعية (مؤشر ثقافة إيجابية).',
  },
  {
    index: '06',
    title: 'الاستدامة',
    text: 'برنامج الامتثال الناجح لا يعتمد على أفراد بعينهم، لا يتأثر بتغييرات مؤقتة، ويبقى جزءاً من هوية المنشأة الصحية لا عبئاً خارجياً.',
    tone: 'blue',
  },
];

const actionPlanCards: PptCard[] = [
  {
    index: '01',
    title: 'الجزء (1) التقييم الذاتي',
    text: 'تقييم كل محور من 0 إلى 4، ثم تحديد أبرز 3 فجوات مؤسسية وتحديد ما إذا كانت تشكل خطراً مباشراً على سلامة المرضى أو سمعة المنشأة.',
    rationale: 'ابدأ بالتقييم من 0 إلى 4، ثم اختر أهم ثلاث فجوات واربط كل فجوة بأثرها على سلامة المرضى أو السمعة.',
  },
  {
    index: '02',
    title: 'الجزء (2) الفجوات والإجراءات',
    text: 'لكل فجوة: تحديد الإجراء المطلوب، المسؤول عن التنفيذ، المدة الزمنية المتوقعة، ومؤشر النجاح القابل للقياس.',
    rationale: 'لا تترك الفجوة كعنوان. اربطها بإجراء ومسؤول ومدة ومؤشر نجاح يمكن التحقق منه.',
  },
  {
    index: '03',
    title: 'الجزء (3) نموذج خطة العمل',
    text: 'الفجوة - الإجراء - المسؤول - المدة - المؤشر\nمثال: غياب دليل الامتثال - إعداد واعتماد الدليل - مسؤول الامتثال- 3 أشهر - اعتماد الدليل وتوزيعه.',
    rationale: 'طبّق النموذج كما هو: فجوة، ثم إجراء، ثم مسؤول، ثم مدة، ثم مؤشر. المثال يحول غياب الدليل إلى مهمة قابلة للمتابعة.',
    tone: 'gold',
  },
];

export const governanceChapterTwoSlides = indexSlides([
  makeSlide({
    id: 'ch2-welcome',
    audioKey: 'bag1-ch2-s1-welcome-course1',
    title: 'الامتثال والتدقيق والضوابط',
    narration:
      'بسم الله نواصل رحلتنا، والسلام عليكم ورحمة الله وبركاته. وصلنا في حقيبة الحوكمة والمخاطر والامتثال إلى الفصل الثاني: الامتثال والتدقيق والضوابط. ومحاورنا هي: إدارة الامتثال، ثم مراقبة الضوابط، ثم التدريب والتوعية. وكما تحدثنا في الفصل الأول عن الحوكمة وتوزيع الأدوار وحماية القرار، ننتقل اليوم إلى السؤال العملي: كيف نتأكد أن الأنظمة والسياسات مطبقة فعلًا؟ نبدأ مستعينين بالله.',
    visual: '✅',
    layout: 'pptIntro',
    kind: 'welcome',
    courseName: 'الحوكمة والمخاطر والامتثال',
    subtitle: 'الفصل الثاني',
    unitTitle: 'الامتثال والتدقيق والضوابط',
    intro: 'المحاور: إدارة الامتثال - مراقبة الضوابط - التدريب والتوعية',
  }),
  makeSlide({
    id: 'ch2-overview',
    audioKey: 'bag1-ch2-s2-overview-course1',
    title: 'الفصل الثاني: الامتثال والتدقيق والضوابط',
    narration: fullNarration(
      'لنستعرض بناء الفصل الثاني؛ فكل محور يجيب عن جزء من دورة الامتثال.',
      chapterTwoOverview,
      'نبدأ بإدارة الامتثال، ثم نختبر الضوابط ونراقبها، وبعدها نبني الثقافة التي تجعل الالتزام مستمرًا.',
    ),
    visual: '🧭',
    layout: 'pptThreeColumns',
    cards: chapterTwoOverview,
    checks: [
      quickCheck({
        title: 'قبل التفاصيل: ما سؤال الفصل الثاني الرئيسي؟',
        text: 'الحوكمة قالت لنا من يقرر. ماذا يسأل الامتثال؟',
        answer: 'هل طبقنا المطلوب كما ينبغي وبالدليل؟',
        rationale: 'الامتثال يحول السياسات إلى تحقق وقياس ومعالجة فجوات، وليس مجرد معرفة بالمتطلبات.',
      }),
    ],
  }),
  makeSlide({
    id: 'ch2-compliance-concept',
    audioKey: 'bag1-ch2-s3-compliance-concept-course1',
    title: 'مفهوم الامتثال وأهميته ووظيفته',
    narration: fullNarration(
      'نبدأ بمفهوم الامتثال وأهميته ووظيفته، لأن جودة المراقبة تعتمد أولًا على وضوح ما نلتزم به ولماذا.',
      complianceConceptCards,
      'الامتثال هنا وظيفة وقائية واستشارية ورقابية، والهدف النهائي حماية المنشأة والمريض والثقة المؤسسية.',
    ),
    visual: '📋',
    layout: 'pptTitleCards',
    cards: complianceConceptCards,
  }),
  makeSlide({
    id: 'ch2-pdca',
    audioKey: 'bag1-ch2-s4-pdca-course1',
    title: 'أيزو 37301 – دورة PDCA للامتثال',
    narration: fullNarration(
      'ولكي يتحول الامتثال إلى نظام مستمر، نستخدم دورة أيزو 37301 المعروفة بـ PDCA.',
      pdcaCards,
      'فالدورة لا تتوقف عند التنفيذ؛ إذ يعيدنا التحقق والاستجابة إلى التخطيط بنظام أنضج وقدرة أعلى على منع التكرار.',
    ),
    visual: '🔄',
    layout: 'pptTitleCards',
    cards: pdcaCards,
    checks: [
      quickCheck({
        title: 'أين يقع التعلم الحقيقي في دورة PDCA؟',
        text: 'هل يكفي أن ننفذ الخطة، أم نحتاج خطوة تكشف الفجوة؟',
        answer: 'في التحقق والتحسين بعد التنفيذ',
        rationale: 'التنفيذ يعطي نشاطًا، لكن التحقق والتحسين يحولان النشاط إلى تعلم مؤسسي يمنع تكرار الخلل.',
      }),
    ],
  }),
  makeSlide({
    id: 'ch2-self-assessment',
    audioKey: 'bag1-ch2-s5-self-assessment-course1',
    title: 'نشاط: التقييم الذاتي لجاهزية الامتثال',
    narration: fullNarration(
      'والآن دورك في التقييم؛ قيّم كل محور من صفر إلى أربعة، واضغط على المحور بعد التفكير حتى تسمع مناقشتي للنقطة.',
      selfAssessmentCards,
      'بعد جمع الدرجات، استخدم قراءة النتائج لتحدد نقطة البداية، ثم اختر الفجوة الأعلى أثرًا بدل توزيع الجهد على كل شيء.',
    ),
    visual: '🧠',
    layout: 'pptSixCards',
    kind: 'activity',
    cards: selfAssessmentCards,
  }),
  makeSlide({
    id: 'ch2-monitoring',
    audioKey: 'bag1-ch2-s6-monitoring-course1',
    title: 'مراقبة الامتثال واختبار الضوابط',
    narration: fullNarration(
      'وبعد التقييم الذاتي، ننتقل إلى المراقبة واختبار الضوابط؛ والفكرة هنا حماية مبكرة، لا البحث عن الخطأ.',
      monitoringCards,
      'فالمنشأة الناضجة لا تكتفي بإغلاق التقرير؛ بل تتأكد من معالجة السبب الجذري ومن انخفاض الخطر المتبقي فعليًا.',
    ),
    visual: '🔍',
    layout: 'pptSixCards',
    cards: monitoringCards,
  }),
  makeSlide({
    id: 'ch2-culture',
    audioKey: 'bag1-ch2-s7-culture-course1',
    title: 'بناء ثقافة الامتثال وبرامج التوعية',
    narration: fullNarration(
      'المراقبة وحدها لا تكفي؛ فنحن بحاجة إلى ثقافة تجعل الموظف يختار التصرف الصحيح حتى تحت الضغط.',
      cultureCards,
      'الثقافة يصنعها سلوك القيادة، ويثبتها تدريب مناسب، وتقيسها مؤشرات تظهر تغير السلوك لا مجرد حضور الدورة.',
    ),
    visual: '🎓',
    layout: 'pptSixCards',
    cards: cultureCards,
    checks: [
      quickCheck({
        title: 'كيف نعرف أن ثقافة الامتثال تحسنت؟',
        text: 'هل نقيس الحضور فقط، أم نبحث عن تغير السلوك؟',
        answer: 'نقيس تغير السلوك ومؤشرات البلاغات والمخالفات ونتائج الاختبارات',
        rationale: 'الحضور مؤشر بداية، لكن الثقافة تظهر في القرار تحت الضغط وفي الإبلاغ الطوعي وانخفاض المخالفات.',
        tone: 'gold',
      }),
    ],
  }),
  makeSlide({
    id: 'ch2-action-plan',
    audioKey: 'bag1-ch2-s8-action-plan-course1',
    title: 'نشاط: بناء خطة العمل القيادي',
    narration: fullNarration(
      'نختم الفصل الثاني ببناء خطة عمل قيادية؛ تقدّم خطوة خطوة، واضغط على كل جزء بعد أن تكتب إجابتك الأولية.',
      actionPlanCards,
      'فالخطة الجيدة لا تنتهي عند اسم الإجراء؛ إذ ينبغي أن توضح المسؤول والمدة والمؤشر حتى يمكن متابعتها ومساءلة أصحابها.',
    ),
    visual: '🗂️',
    layout: 'pptThreeColumns',
    kind: 'activity',
    cards: actionPlanCards,
  }),
  makeQuizSlide({
    id: 'ch2-quiz',
    audioKey: 'bag1-ch2-s9-quiz-course1',
    title: 'اختبار الفصل الثاني',
    narration:
      'والآن نختبر فهمنا للفصل الثاني في خمسة أسئلة عن مفهوم الامتثال، ودورة بي دي سي إيه، ومراقبة الضوابط، وثقافة الامتثال. اختر الإجابة الأنسب، وراجع التفسير بعد كل سؤال. وفي النهاية يظهر لك عدد الإجابات الصحيحة والنسبة، ودرجة الاجتياز ستون بالمئة. وفقكم الله.',
    quiz: chapterTwoQuiz,
  }),
  makeChapterClosing({
    id: 'ch2-closing',
    audioKey: 'bag1-ch2-s10-closing-course1',
    title: 'ختام الفصل الثاني',
    narration:
      'ممتاز، بهذا نكون أتممنا الفصل الثاني. بنينا فهمًا متكاملًا لإدارة الامتثال والتدقيق، وتابعنا دورة التحسين المستمر من التخطيط إلى التنفيذ والتحقق والتحسين. وتعرّفنا على مراقبة الضوابط ومؤشرات الامتثال، ثم ربطنا ذلك ببناء ثقافة تجعل السلوك الصحيح ممارسة يومية. نتيجتك تظهر أمامك الآن، فاستفد منها في تحديد ما أتقنته وما يحتاج مراجعة. الخلاصة أن برنامج الامتثال الناجح لا يكتفي بالسياسات؛ بل يراقب التطبيق، ويعالج الأسباب الجذرية، ويقيس تغير السلوك. شكرًا لحسن استماعكم وتفاعلكم، ونلتقي بإذن الله في الفصل الثالث.',
    takeaways: [
      { title: 'تحسين مستمر', text: 'تخطيط وتنفيذ وتحقق وتحسين ضمن دورة مترابطة.', emoji: '🔄' },
      { title: 'ضوابط قابلة للقياس', text: 'مؤشرات ومراقبة تكشف الفجوات وتدعم المعالجة.', emoji: '📊' },
      { title: 'ثقافة امتثال', text: 'قيادة وتوعية وسلوك يومي يتجاوز الحضور الشكلي.', emoji: '🎓' },
    ],
  }),
]);

const chapterThreeOverview: PptCard[] = [
  {
    title: 'إطار إدارة المخاطر المؤسسية (أيزو 31000)',
    bullets: ['مبادئ أيزو 31000', 'الحوكمة القائمة على المخاطر', 'ربط المخاطر بالقرار'],
  },
  {
    title: 'إدارة المخاطر والضوابط',
    bullets: ['تحديد المخاطر', 'تصميم الضوابط', 'فعالية الضوابط'],
    tone: 'gold',
  },
  {
    title: 'تحليل وإدارة المخاطر المؤسسية',
    bullets: ['سجل المخاطر', 'تقييم الأثر والاحتمالية', 'مؤشرات المخاطر (KRIs)', 'إعداد التقارير التحليلية للمخاطر والامتثال (6/المخاطر)'],
    tone: 'blue',
  },
];

const isoRiskCards: PptCard[] = [
  {
    index: '01',
    title: 'تعريف الخطر',
    text: "'تأثير عدم اليقين على تحقيق الأهداف' – قد يكون إيجابياً (فرصة) أو سلبياً (تهديد) – لا يتعلق بالأحداث فقط بل بحالة عدم اليقين",
  },
  {
    index: '02',
    title: 'المبادئ الثمانية لأيزو31000',
    text: 'التكامل - التنظيم والشمول - مُخصَّصة حسب السياق - الجماعية (مشاركة أصحاب المصلحة) - التفاعل والديناميكية - إتاحة أفضل المعلومات - مراعاة العوامل البشرية - التحسين المستمر',
    tone: 'gold',
  },
  {
    index: '03',
    title: 'إطار عمل إدارة المخاطر',
    text: 'القيادة والالتزام - الدمج والتكامل - التصميم (السياق الداخلي والخارجي) - التنفيذ - التقييم - التحسين المستمر',
  },
  {
    index: '04',
    title: 'الحوكمة القائمة على المخاطر',
    text: 'ربط المخاطر بالقرار لا بالتقرير فقط – ضمان أن قرارات الشراء والتوسع والشراكات تأخذ المخاطر بعين الاعتبار قبل اتخاذها',
    tone: 'blue',
  },
];

const riskProcessCards: PptCard[] = [
  {
    index: '01',
    title: 'النطاق والسياق والمعايير',
    text: 'تحديد نطاق التطبيق، فهم البيئة الداخلية والخارجية، وضع معايير قبول المخاطر ومستويات التحمل (Risk Appetite)',
  },
  {
    index: '02',
    title: 'تحديد المخاطر',
    text: 'مصادر البيانات: سجلات المخاطر السابقة، تقارير التدقيق، شكاوى العملاء، وثائق الاعتماد، استطلاعات الموظفين، العصف الذهني، مخططات التدفق',
  },
  {
    index: '03',
    title: 'تحليل المخاطر',
    text: 'دراسة طبيعة المخاطر وخصائصها – يأخذ بعين الاعتبار: احتمالات الأحداث، فعالية الضوابط الموجودة، حجم التأثير، مستويات الحساسية والثقة',
  },
  {
    index: '04',
    title: 'تقييم المخاطر',
    text: 'مقارنة مستوى الخطر بمعايير القبول (مصفوفة الأثر × الاحتمالية) لتحديد أولويات المعالجة وتوثيق النتائج مع أصحاب المصلحة',
    tone: 'gold',
  },
  {
    index: '05',
    title: 'معالجة المخاطر',
    text: 'خيارات المعالجة: تعزيز ضوابط حالية - إضافة ضوابط وقائية جديدة - إعادة تصميم إجراءات العمل - تدريب مستهدف - إعادة النظر في نماذج التشغيل',
  },
  {
    index: '06',
    title: 'المراقبة والمراجعة والتسجيل',
    text: 'مراقبة مستمرة لدورة حياة الخطر، توثيق عملية التعامل مع المخاطر، تقديم التقارير والمردودات للإدارة ولأصحاب المساءلة',
    tone: 'blue',
  },
];

const riskRegisterCards: PptCard[] = [
  {
    index: '01',
    title: 'سجل المخاطر Risk Register',
    text: 'أداة توثق المخاطر وتحولها من افتراضات ذهنية إلى مخاطر قابلة للإدارة – يربط كل متطلب تنظيمي بالخطر المحتمل، الأثر، الجهات المتأثرة، مستوى الخطورة',
  },
  {
    index: '02',
    title: 'الخطر الكامن (قبل الضوابط)',
    text: 'يُقاس ببُعدين: حجم الأثر (ماذا لو حدث عدم الامتثال؟) واحتمالية الحدوث – نظر موضوعي لأسوأ السيناريوهات الممكنة',
  },
  {
    index: '03',
    title: 'الخطر المتبقي (بعد الضوابط)',
    text: 'هل ما تبقى من الخطر مقبول؟ – في القطاع الصحي: غير مقبول إطلاقاً للمخاطر المرتبطة بسلامة المرضى أو مرتبطة بالترخيص',
    tone: 'gold',
  },
  {
    index: '04',
    title: 'مؤشرات المخاطر KRIs',
    text: 'نسبة الحوادث الموثقة، معدل تنفيذ خطط التصحيح في الوقت المحدد، نسبة الضوابط الجسيمة المجتازة بنجاح، معدل تكرار نفس المخالفة',
  },
  {
    index: '05',
    title: 'إعداد التقارير التحليلية',
    text: 'تقارير تشغيلية للإدارات، تقارير دورية للإدارة العليا، تقارير مختصرة للجان ومجلس الإدارة مع أبرز 5 مخاطر، حالة الضوابط، والقرارات المطلوبة',
  },
  {
    index: '06',
    title: 'ربط السجل بالحوكمة',
    text: 'يُستخدم كأداة حية لمعلومات مجلس الإدارة، توجيه لجان الجودة والامتثال، تحديد أولويات المراجعة والتدقيق، وربط الامتثال بالأداء المؤسسي',
    tone: 'blue',
  },
];

const riskActivityCards: PptCard[] = [
  {
    index: '01',
    title: 'السيناريو',
    text: 'منشأة صحية تواجه مخاطر في مجال خصوصية بيانات المرضى (أيزو 27001 / سياسة الخصوصية)',
    rationale: 'ابدأ بتحديد المتطلب التنظيمي ونطاق البيانات والجهات المتأثرة قبل تقييم مستوى الخطر.',
  },
  {
    index: '02',
    title: 'تعبئة سجل المخاطر',
    text: 'المتطلب - الخطر (تسريب البيانات) - الأثر (قانوني/سمعة) - الاحتمالية - الضابط الحالي (صلاحيات وصول) - الخطر المتبقي - القرار - المعالجة - المسؤول',
    rationale: 'عبّئ الحقول بالترتيب حتى لا تقفز من الخطر إلى المعالجة قبل فهم الأثر والاحتمالية وفعالية الضابط الحالي.',
  },
  {
    index: '03',
    title: 'إعداد التقرير للإدارة',
    bullets: ['أبرز 5 مخاطر عدم الامتثال', 'حالة الضوابط الجسيمة', 'مؤشرات الامتثال والاتجاهات', 'القضايا غير المغلقة وأسباب التأخير', 'القرارات المطلوبة من القيادة'],
    rationale: 'قدّم للإدارة ما تحتاجه للقرار: المخاطر الأعلى، حالة الضوابط، الاتجاهات، أسباب التأخير، والقرارات المطلوبة بوضوح.',
    tone: 'gold',
  },
];

const summaryCards: PptCard[] = [
  {
    title: 'الفصل الأول',
    text: 'الحوكمة ليست وثائق – بل إطار حي يُوزّع الأدوار ويضمن المساءلة ويحمي القرار من التأثيرات غير المهنية.',
  },
  {
    title: 'الفصل الثاني',
    text: 'الامتثال الحقيقي يبدأ من الثقافة لا من السياسات – ومن يراقب بروح الحماية المبكرة يحمي المنشأة قبل الأزمة.',
    tone: 'gold',
  },
  {
    title: 'الفصل الثالث',
    text: 'إدارة المخاطر ليست تسجيل أرقام في سجل – بل قرار قيادي يُحدد أين تتركز الجهود وأين يكمن الخطر الحقيقي.',
    tone: 'blue',
  },
];

const finalMessageCards: PptCard[] = [
  { title: 'الامتثال بلا حوكمة', text: 'شكلٌ بلا روح' },
  { title: 'الحوكمة بلا امتثال', text: 'سلطةٌ بلا أثر', tone: 'gold' },
  { title: 'إدارة المخاطر بلا قرار', text: 'تحليلٌ بلا قيمة', tone: 'blue' },
];

const leadershipQuestions: PptCard[] = [
  {
    index: '01',
    title: 'ما الشيء الواحد الذي ستُغيّره في منشأتك خلال الثلاثين يوماً القادمة؟',
    text: 'حوكمة - امتثال - مخاطر – اختر معركتك الأولى',
  },
  {
    index: '02',
    title: 'أين الفجوة الأكبر بين ما تعلمته اليوم وما يحدث فعلياً في منشأتك؟',
    text: 'الفجوة المُعترَف بها هي نقطة البداية الحقيقية',
    tone: 'gold',
  },
  {
    index: '03',
    title: 'من الشخص الذي ستشارك معه هذا المحتوى اليوم قبل نهاية الدوام؟',
    text: 'المعرفة التي لا تنتشر لا تُحدث أثراً مؤسسياً',
    tone: 'blue',
  },
];

export const governanceChapterThreeSlides = indexSlides([
  makeSlide({
    id: 'ch3-welcome',
    audioKey: 'bag1-ch3-s1-welcome-course1',
    title: 'إدارة المخاطر المؤسسية',
    narration:
      'أهلًا وسهلًا بكم، والسلام عليكم ورحمة الله وبركاته. نصل اليوم في حقيبة الحوكمة والمخاطر والامتثال إلى الفصل الثالث: إدارة المخاطر المؤسسية. ومحاورنا هي: إطار أيزو 31000، ثم إدارة المخاطر والضوابط، ثم تحليل المخاطر. وبعد أن بنينا الحوكمة في الفصل الأول، وتأكدنا من التطبيق وفعالية الضوابط في الفصل الثاني، نصل إلى السؤال القيادي: أين يمكن أن نتعثر، وما القرار المناسب قبل أن يتحول الاحتمال إلى أثر؟ نبدأ على بركة الله.',
    visual: '🛡️',
    layout: 'pptIntro',
    kind: 'welcome',
    courseName: 'الحوكمة والمخاطر والامتثال',
    subtitle: 'الفصل الثالث',
    unitTitle: 'إدارة المخاطر المؤسسية',
    intro: 'المحاور: إطار أيزو 31000 - إدارة المخاطر والضوابط - تحليل المخاطر',
  }),
  makeSlide({
    id: 'ch3-overview',
    audioKey: 'bag1-ch3-s2-overview-course1',
    title: 'الفصل الثالث: إدارة المخاطر المؤسسية',
    narration: fullNarration(
      'لنرتب الفصل الأخير؛ نبدأ بالإطار، ثم ندير دورة الخطر، ثم نحوّل النتائج إلى سجل وتقارير تدعم القرار.',
      chapterThreeOverview,
      'وبهذا التسلسل، لا يصبح سجل المخاطر ملفًا ساكنًا؛ بل يصبح أداة حية مرتبطة بالحوكمة والامتثال.',
    ),
    visual: '🧭',
    layout: 'pptThreeColumns',
    cards: chapterThreeOverview,
    checks: [
      quickCheck({
        title: 'سؤال افتتاحي: لماذا نربط المخاطر بالقرار؟',
        text: 'فكر في قرار قيادي بدون قراءة للمخاطر: ماذا ينقصه؟',
        answer: 'ينقصه تقدير الاحتمالية والأثر قبل الالتزام بالقرار',
        rationale: 'إدارة المخاطر لا تعطل القرار؛ تجعل القرار أوضح وأقرب للواقع.',
      }),
    ],
  }),
  makeSlide({
    id: 'ch3-risk-definition',
    audioKey: 'bag1-ch3-s3-risk-definition-course1',
    title: 'تعريف الخطر ومبادئ أيزو 31000',
    narration: fullNarration(
      'نبدأ بتعريف الخطر ومبادئ أيزو 31000، والمهم أن نفهم أن الخطر مرتبط بعدم اليقين وتأثيره على الأهداف.',
      isoRiskCards,
      'إدارة المخاطر الناضجة تدخل قبل القرار، وتستخدم أفضل المعلومات مع مراعاة السياق والعوامل البشرية.',
    ),
    visual: '🛡️',
    layout: 'pptTitleCards',
    cards: isoRiskCards,
  }),
  makeSlide({
    id: 'ch3-risk-process',
    audioKey: 'bag1-ch3-s4-risk-process-course1',
    title: 'مراحل عملية إدارة المخاطر',
    narration: fullNarration(
      'والآن نستعرض مراحل عملية إدارة المخاطر من تحديد السياق إلى المراقبة والتسجيل.',
      riskProcessCards,
      'فكل مرحلة تعتمد على التي قبلها؛ ولا نختار المعالجة قبل أن نحلل الخطر ونقارنه بمعايير القبول.',
    ),
    visual: '🔄',
    layout: 'pptSixCards',
    cards: riskProcessCards,
    checks: [
      quickCheck({
        title: 'ترتيب منطقي: هل نعالج الخطر قبل تحليله؟',
        text: 'فكر في خطأ شائع: اختيار إجراء سريع قبل فهم السبب والأثر.',
        answer: 'لا، نحدد السياق ثم نحلل ونقيّم وبعدها نعالج',
        rationale: 'المعالجة قبل التحليل قد تبدو سريعة، لكنها قد تعالج العرض وتترك السبب الحقيقي.',
      }),
    ],
  }),
  makeSlide({
    id: 'ch3-risk-register',
    audioKey: 'bag1-ch3-s5-risk-register-course1',
    title: 'سجل المخاطر وإعداد التقارير التحليلية',
    narration: fullNarration(
      'بعد فهم العملية، نحولها إلى سجل مخاطر وتقارير تحليلية تساعد القيادة على اتخاذ القرار.',
      riskRegisterCards,
      'قيمة السجل ليست في عدد الصفوف؛ قيمته في توضيح الخطر المتبقي والقرار المطلوب ومن يملك المعالجة.',
    ),
    visual: '📊',
    layout: 'pptSixCards',
    cards: riskRegisterCards,
  }),
  makeSlide({
    id: 'ch3-risk-activity',
    audioKey: 'bag1-ch3-s6-risk-activity-course1',
    title: 'نشاط: إعداد سجل المخاطر وتقارير المخاطر',
    narration: fullNarration(
      'نطبّق الآن على خصوصية بيانات المرضى. فكّر في كل خطوة أولًا، ثم اضغط عليها حتى نناقش طريقة بنائها.',
      riskActivityCards,
      'ابدأ من المتطلب والخطر، ثم قيّم الأثر والاحتمالية والضابط الحالي، وبعدها فقط حدد المعالجة والقرار المطلوب.',
    ),
    visual: '🧠',
    layout: 'pptThreeColumns',
    kind: 'activity',
    cards: riskActivityCards,
  }),
  makeSlide({
    id: 'program-summary',
    audioKey: 'bag1-ch3-s7-summary-course1',
    title: 'الخلاصة – أبرز ما تعلمناه',
    narration: fullNarration(
      'وصلنا إلى الخلاصة؛ لنجمع الرسالة الأساسية من كل فصل.',
      summaryCards,
      'الحوكمة تضبط القرار، والامتثال يحمي التطبيق، وإدارة المخاطر توجه الأولويات. الثلاثة منظومة واحدة، وكل جزء يقوّي الثاني.',
    ),
    visual: '✨',
    layout: 'pptThreeColumns',
    cards: summaryCards,
    checks: [
      quickCheck({
        title: 'الخلاصة الكبرى: ما العلاقة بين الثلاثة؟',
        text: 'حوكمة، امتثال، مخاطر. حاول تلخصها في جملة واحدة قبل الكشف.',
        answer: 'الحوكمة توجه، والامتثال يثبت، والمخاطر تحمي القرار',
        rationale: 'هذه هي الفكرة التي نريد نقلها للعمل: منظومة واحدة لا ثلاث جزر منفصلة.',
        tone: 'gold',
      }),
    ],
  }),
  makeSlide({
    id: 'program-final-message',
    audioKey: 'bag1-ch3-s8-final-message-course1',
    title: 'الامتثال بلا حوكمة.. شكلٌ بلا روح',
    narration: fullNarration(
      'وقبل أن نختم، خذوا هذه الرسائل الثلاث كقاعدة مختصرة تعودون إليها وقت القرار.',
      finalMessageCards,
      'وتكتمل المنظومة حين يتوفر لدينا توجيه واضح، وتطبيق فعلي، ومخاطر مرتبطة بالقرار.',
    ),
    visual: '💡',
    layout: 'pptThreeColumns',
    cards: finalMessageCards,
  }),
  makeSlide({
    id: 'program-leadership-questions',
    audioKey: 'bag1-ch3-s9-leadership-questions-course1',
    title: 'ما بعد التدريب – ثلاثة أسئلة قيادية',
    narration: fullNarration(
      'خذ دقيقة قبل أن تغادر القاعة وأجب بصدق؛ فنحن لا نحتاج إلى إجابة مثالية، بل إلى خطوة واضحة تبدأ بها من واقع منشأتك.',
      leadershipQuestions,
      'وبعد أن تحدد خطوتك الأولى، انتقل إلى اختبار الفصل الثالث لمراجعة أهم مفاهيم إدارة المخاطر.',
    ),
    visual: '🎯',
    layout: 'pptConclusion',
    kind: 'completion',
    subtitle: 'خذ دقيقة قبل أن تغادر القاعة وأجب بصدق:',
    cards: leadershipQuestions,
  }),
  makeQuizSlide({
    id: 'ch3-quiz',
    audioKey: 'bag1-ch3-s10-quiz-course1',
    title: 'اختبار الفصل الثالث',
    narration:
      'وصلنا إلى الاختبار الختامي للفصل الثالث وللحقيبة كاملة. أمامك خمسة أسئلة عن تعريف الخطر، وتقييم المخاطر، والخطر المتبقي، ومؤشرات المخاطر، ودور سجل المخاطر في الحوكمة. اختر إجابتك، واقرأ التفسير، وبعد السؤال الخامس تظهر النتيجة النهائية. درجة الاجتياز ستون بالمئة، ويمكنك إعادة المحاولة. أشكركم على حسن الاستماع والمشاركة، وأسأل الله لكم التوفيق.',
    quiz: chapterThreeQuiz,
  }),
  makeChapterClosing({
    id: 'ch3-closing',
    audioKey: 'bag1-ch3-s11-closing-course1',
    title: 'ختام الفصل الثالث والحقيبة',
    narration:
      'الحمد لله، وصلنا إلى ختام الفصل الثالث وختام حقيبة الحوكمة والمخاطر والامتثال. تعرّفنا على إطار إدارة المخاطر المؤسسية وفق آيزو 31 ألف، وربطنا تحديد المخاطر وتقييمها بتصميم الضوابط وقياس فعاليتها. كما ميّزنا بين الخطر الكامن والخطر المتبقي، وفهمنا دور سجل المخاطر ومؤشرات المخاطر في دعم القرار والتقارير القيادية. نتيجتك النهائية ظاهرة أمامك الآن. خذها كمؤشر للتطوير، وارجع إلى النقاط التي تحتاج تثبيتًا قبل نقلها إلى واقع العمل. الرسالة الأهم: الحوكمة توجه، والامتثال يثبت التطبيق، وإدارة المخاطر تحمي القرار. شكرًا لحسن استماعكم ومشاركتكم، وأسأل الله لكم التوفيق والسداد.',
    takeaways: [
      { title: 'قرار واعٍ بالمخاطر', text: 'تقييم الاحتمالية والأثر قبل اعتماد القرار.', emoji: '🧭' },
      { title: 'ضوابط فعالة', text: 'قياس الخطر المتبقي والتأكد من أثر المعالجة.', emoji: '🛡️' },
      { title: 'منظومة متكاملة', text: 'حوكمة توجه، وامتثال يثبت، ومخاطر تحمي.', emoji: '🤝' },
    ],
  }),
]);

export const governanceProgramSlides = [
  ...governanceIntroSlides,
  ...governanceChapterOneSlides,
  ...governanceChapterTwoSlides,
  ...governanceChapterThreeSlides,
];
